drop policy if exists "authenticated can manage surveys" on public.surveys;
drop policy if exists "public can read published surveys" on public.surveys;

drop policy if exists "authenticated can read submissions" on public.submissions;
drop policy if exists "public can insert submissions" on public.submissions;

drop policy if exists "authenticated can insert survey versions" on public.survey_versions;
drop policy if exists "authenticated can read survey versions" on public.survey_versions;

create policy "public can read published surveys"
on public.surveys
for select
to anon, authenticated
using (status = 'published');

create policy "admins can manage surveys"
on public.surveys
for all
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "public can insert submissions"
on public.submissions
for insert
to anon, authenticated
with check (true);

create policy "admins can read submissions"
on public.submissions
for select
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can read survey versions"
on public.survey_versions
for select
to authenticated
using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "admins can insert survey versions"
on public.survey_versions
for insert
to authenticated
with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

revoke all on table public.surveys from anon, authenticated;
grant select on table public.surveys to anon, authenticated;
grant insert, update, delete on table public.surveys to authenticated;

revoke all on table public.submissions from anon, authenticated;
grant insert on table public.submissions to anon, authenticated;
grant select on table public.submissions to authenticated;

revoke all on table public.survey_versions from anon, authenticated;
grant select, insert on table public.survey_versions to authenticated;

create or replace function public.publish_survey(p_slug text, p_steps jsonb, p_expected_version integer)
returns table(version integer, updated_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_survey_id uuid;
  v_current_version integer;
  v_config jsonb;
  v_updated_at timestamptz;
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

revoke execute on function public.publish_survey(text, jsonb, integer) from public, anon;
grant execute on function public.publish_survey(text, jsonb, integer) to authenticated;
