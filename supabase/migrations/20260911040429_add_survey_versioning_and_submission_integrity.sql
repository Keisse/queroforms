alter table public.surveys
  add column if not exists published_version integer not null default 1;

alter table public.submissions
  add column if not exists attempt_id uuid not null default gen_random_uuid(),
  add column if not exists survey_version integer not null default 1;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'surveys_published_version_check') then
    alter table public.surveys add constraint surveys_published_version_check check (published_version >= 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'submissions_score_check') then
    alter table public.submissions add constraint submissions_score_check check (score is null or (score between 0 and 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'submissions_level_check') then
    alter table public.submissions add constraint submissions_level_check check (level is null or (level between 1 and 4));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'submissions_survey_slug_fkey') then
    alter table public.submissions add constraint submissions_survey_slug_fkey foreign key (survey_slug) references public.surveys(slug) on update cascade on delete restrict;
  end if;
end $$;

create unique index if not exists submissions_survey_attempt_uidx
  on public.submissions(survey_slug, attempt_id);

create table if not exists public.survey_versions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  version integer not null check (version >= 1),
  config jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (survey_id, version)
);

alter table public.survey_versions enable row level security;

revoke all on table public.survey_versions from anon;
grant select, insert on table public.survey_versions to authenticated;

drop policy if exists "authenticated can read survey versions" on public.survey_versions;
create policy "authenticated can read survey versions"
on public.survey_versions for select
to authenticated
using ((select auth.uid()) is not null);

drop policy if exists "authenticated can insert survey versions" on public.survey_versions;
create policy "authenticated can insert survey versions"
on public.survey_versions for insert
to authenticated
with check ((select auth.uid()) is not null);

insert into public.survey_versions(survey_id, version, config, created_by)
select id, published_version, config, null
from public.surveys
where status = 'published'
on conflict (survey_id, version) do nothing;

create or replace function public.publish_survey(
  p_slug text,
  p_steps jsonb,
  p_expected_version integer
)
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

revoke execute on function public.publish_survey(text, jsonb, integer) from public;
revoke execute on function public.publish_survey(text, jsonb, integer) from anon;
grant execute on function public.publish_survey(text, jsonb, integer) to authenticated;
