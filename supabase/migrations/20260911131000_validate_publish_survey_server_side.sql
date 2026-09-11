create or replace function public.publish_survey(
  p_slug text,
  p_steps jsonb,
  p_expected_version integer
)
returns table(version integer, updated_at timestamptz)
language plpgsql
set search_path = ''
as $$
declare
  v_survey_id uuid;
  v_current_version integer;
  v_config jsonb;
  v_updated_at timestamptz;
  v_count integer;
  v_email_ord bigint;
  v_name_ord bigint;
  v_processing_ord bigint;
  v_pre_result_ord bigint;
  v_result_ord bigint;
  v_dimension text;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') <> 'admin' then
    raise exception 'admin role required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_steps) <> 'array' or jsonb_array_length(p_steps) = 0 then
    raise exception 'steps must be a non-empty JSON array' using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_steps) s(step)
    where coalesce(btrim(step->>'id'), '') = ''
  ) then
    raise exception 'every step must have a non-empty id' using errcode = '22023';
  end if;

  if (select count(*) from jsonb_array_elements(p_steps)) <>
     (select count(distinct step->>'id') from jsonb_array_elements(p_steps) s(step)) then
    raise exception 'step ids must be unique' using errcode = '22023';
  end if;

  foreach v_dimension in array array['intro','branch','email','name','processing','result'] loop
    select count(*) into v_count
    from jsonb_array_elements(p_steps) s(step)
    where step->>'kind' = v_dimension;
    if v_count <> 1 then
      raise exception 'survey requires exactly one % step; found %', v_dimension, v_count using errcode = '22023';
    end if;
  end loop;

  if p_steps->0->>'kind' <> 'intro' then
    raise exception 'intro must be the first step' using errcode = '22023';
  end if;
  if jsonb_array_length(p_steps) < 2 or p_steps->1->>'kind' <> 'branch' then
    raise exception 'branch must be the second step' using errcode = '22023';
  end if;
  if p_steps->(jsonb_array_length(p_steps)-1)->>'kind' <> 'result' then
    raise exception 'result must be the last step' using errcode = '22023';
  end if;

  select ord into v_email_ord from jsonb_array_elements(p_steps) with ordinality s(step,ord) where step->>'kind'='email';
  select ord into v_name_ord from jsonb_array_elements(p_steps) with ordinality s(step,ord) where step->>'kind'='name';
  select ord into v_processing_ord from jsonb_array_elements(p_steps) with ordinality s(step,ord) where step->>'kind'='processing';
  select ord into v_result_ord from jsonb_array_elements(p_steps) with ordinality s(step,ord) where step->>'kind'='result';

  select count(*), min(ord) into v_count, v_pre_result_ord
  from jsonb_array_elements(p_steps) with ordinality s(step,ord)
  where step->>'id'='insight-pre-result-guide';
  if v_count <> 1 then
    raise exception 'survey requires exactly one pre-result guide step' using errcode = '22023';
  end if;

  if not (v_email_ord < v_name_ord and v_name_ord < v_processing_ord and v_processing_ord < v_pre_result_ord and v_pre_result_ord = v_result_ord - 1) then
    raise exception 'final flow order must be email, name, processing, pre-result, result' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_steps) q(step)
    where step->>'kind'='question'
      and (jsonb_typeof(step->'options') <> 'array' or jsonb_array_length(step->'options') < 2)
  ) then
    raise exception 'every question requires at least two options' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_steps) q(step)
    cross join lateral jsonb_array_elements(step->'options') o(option)
    where step->>'kind'='question'
      and (coalesce(btrim(option->>'label'),'')='' or coalesce(btrim(option->>'value'),'')='')
  ) then
    raise exception 'question options require non-empty label and value' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_steps) q(step)
    cross join lateral jsonb_array_elements(step->'options') o(option)
    where step->>'kind'='question'
    group by step->>'id', option->>'value'
    having count(*) > 1
  ) then
    raise exception 'option values must be unique within each question' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_steps) q(step)
    where step->>'kind'='question'
      and step->>'input' <> 'multi'
      and (
        select count(*) filter (where jsonb_typeof(option->'score')='number')
        from jsonb_array_elements(step->'options') o(option)
      ) between 1 and jsonb_array_length(step->'options') - 1
  ) then
    raise exception 'scored questions cannot mix scored and unscored options' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_steps) q(step)
    where step->>'kind'='question'
      and step->>'input'='scale'
      and exists (
        select 1 from jsonb_array_elements(step->'options') o(option)
        where jsonb_typeof(option->'score') is distinct from 'number'
      )
  ) then
    raise exception 'scale questions require numeric score on every option' using errcode = '22023';
  end if;

  foreach v_dimension in array array['planejamento','riscos','decisao','comunicacao','automacao','confianca'] loop
    if not exists (
      select 1
      from jsonb_array_elements(p_steps) q(step)
      where step->>'kind'='question'
        and step->>'input' <> 'multi'
        and step->>'dimension'=v_dimension
        and (
          select count(*) from jsonb_array_elements(step->'options') o(option)
          where jsonb_typeof(option->'score')='number'
        ) >= 2
    ) then
      raise exception 'result dimension % requires at least one scoreable question', v_dimension using errcode = '22023';
    end if;
  end loop;

  select s.id, s.published_version, s.config
  into v_survey_id, v_current_version, v_config
  from public.surveys s
  where s.slug = p_slug
  for update;

  if not found then
    raise exception 'survey not found' using errcode = 'P0002';
  end if;

  if v_current_version <> p_expected_version then
    raise exception 'survey version conflict: expected %, current %', p_expected_version, v_current_version
      using errcode = '40001';
  end if;

  v_current_version := v_current_version + 1;
  v_config := v_config || jsonb_build_object('steps', p_steps, 'draft_steps', p_steps);

  update public.surveys s
  set config = v_config,
      published_version = v_current_version,
      updated_at = now()
  where s.id = v_survey_id
  returning s.updated_at into v_updated_at;

  insert into public.survey_versions(survey_id, version, config, created_by)
  values (v_survey_id, v_current_version, v_config, (select auth.uid()));

  return query select v_current_version, v_updated_at;
end;
$$;

revoke execute on function public.publish_survey(text,jsonb,integer) from public, anon;
grant execute on function public.publish_survey(text,jsonb,integer) to authenticated;
