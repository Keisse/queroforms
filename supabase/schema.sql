create extension if not exists pgcrypto;

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  survey_slug text not null,
  name text,
  email text,
  score integer,
  level integer,
  dimension_scores jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_url text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists submissions_survey_slug_idx on public.submissions(survey_slug);
create index if not exists submissions_email_idx on public.submissions(email);
create index if not exists submissions_created_at_idx on public.submissions(created_at desc);

alter table public.surveys enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "public can insert submissions" on public.submissions;
create policy "public can insert submissions"
on public.submissions for insert
to anon
with check (true);

drop policy if exists "authenticated can read submissions" on public.submissions;
create policy "authenticated can read submissions"
on public.submissions for select
to authenticated
using (true);

drop policy if exists "authenticated can manage surveys" on public.surveys;
create policy "authenticated can manage surveys"
on public.surveys for all
to authenticated
using (true)
with check (true);

insert into public.surveys(slug,name,status,config)
values (
  'gp-ia',
  'Diagnóstico de Maturidade em IA para GP',
  'published',
  '{"product":"ebook-gp-ia","type":"maturity-diagnostic"}'::jsonb
)
on conflict (slug) do update set
  name = excluded.name,
  status = excluded.status,
  config = public.surveys.config || excluded.config,
  updated_at = now();
