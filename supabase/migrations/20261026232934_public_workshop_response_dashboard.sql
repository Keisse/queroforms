begin;
create schema if not exists qf_dashboard_internal;
revoke all on schema qf_dashboard_internal from public, anon, authenticated;

create table public.public_form_dashboards (
 slug text primary key check (slug = 'masterclass-21-novembro'),
 payload jsonb not null check (jsonb_typeof(payload)='object'),
 updated_at timestamptz not null default now()
);
alter table public.public_form_dashboards enable row level security;
revoke all on public.public_form_dashboards from public, anon, authenticated;
grant select on public.public_form_dashboards to anon, authenticated;
create policy "read published workshop aggregate only" on public.public_form_dashboards
 for select to anon, authenticated using (slug='masterclass-21-novembro');

-- The only output is counts of configured options. No submitted text or identifiers.
create function qf_dashboard_internal.workshop_dashboard_payload()
returns jsonb language sql stable security invoker set search_path='' as $payload$
with survey as (
 select id,config,published_version from public.surveys where slug='masterclass-21-novembro' and status='published'
), snapshots as (
 select config,published_version as version,true as live from survey
 union all
 select v.config,v.version,false from public.survey_versions v join survey s on s.id=v.survey_id
), all_questions as (
 select step->>'id' as question_id,step,ordinality as position,version,live
 from snapshots cross join lateral jsonb_array_elements(coalesce(config->'steps','[]'::jsonb)) with ordinality a(step,ordinality)
 where step->>'kind'='question'
), definitions as (
 select distinct on (question_id) question_id,step,position,version,
 not exists(select 1 from all_questions current_q where current_q.live and current_q.question_id=q.question_id) as historical
 from all_questions q order by question_id,version desc,live desc
), options as (
 select distinct on(q.question_id,opt->>'value') q.question_id,opt->>'value' as value,opt->>'label' as label,ord as position
 from all_questions q cross join lateral jsonb_array_elements(q.step->'options') with ordinality a(opt,ord)
 where jsonb_typeof(opt->'label')='string' and jsonb_typeof(opt->'value')='string'
 order by q.question_id,opt->>'value',q.version desc,q.live desc
), base as (
 select id,answers,created_at from public.submissions where survey_slug='masterclass-21-novembro'
), valid_answers as (
 select distinct b.id,a.key as question_id,v.value
 from base b cross join lateral jsonb_each(b.answers) a
 cross join lateral jsonb_array_elements_text(case jsonb_typeof(a.value)
 when 'array' then a.value when 'string' then jsonb_build_array(a.value) else '[]'::jsonb end) v(value)
 join options o on o.question_id=a.key and o.value=v.value
), respondents as (
 select question_id,count(distinct id) as answered from valid_answers group by question_id
), counts as (
 select question_id,value,count(*) as count from valid_answers group by question_id,value
), days as (
 select (created_at at time zone 'America/Sao_Paulo')::date as day,count(*) as count from base group by 1
)
select jsonb_build_object(
 'slug','masterclass-21-novembro','title','Ficha do aluno — Workshop Gestor de projetos de alto valor com IA',
 'version',coalesce((select published_version from survey),0),
 'total',(select count(*) from base),
 'daily',coalesce((select jsonb_agg(jsonb_build_object('day',day,'count',count) order by day) from days),'[]'::jsonb),
 'questions',coalesce((select jsonb_agg(jsonb_build_object(
 'id',d.question_id,'title',d.step->>'title','subtitle',d.step->>'subtitle','input',d.step->>'input',
 'position',d.position,'historical',d.historical,'answered',coalesce(r.answered,0),
 'options',coalesce((select jsonb_agg(jsonb_build_object('value',o.value,'label',o.label,'count',coalesce(c.count,0)) order by o.position,o.value)
 from options o left join counts c on c.question_id=o.question_id and c.value=o.value where o.question_id=d.question_id),'[]'::jsonb)
 ) order by d.historical,d.position,d.question_id) from definitions d left join respondents r on r.question_id=d.question_id),'[]'::jsonb)
);
$payload$;
revoke all on function qf_dashboard_internal.workshop_dashboard_payload() from public,anon,authenticated;

-- Trigger-only privileged writer; never exposed through the Data API.
create function qf_dashboard_internal.refresh_workshop_dashboard()
returns trigger language plpgsql security definer set search_path='' as $trigger$
declare relevant boolean := false;
begin
 if TG_TABLE_NAME='submissions' then
  if TG_OP<>'DELETE' then relevant := NEW.survey_slug='masterclass-21-novembro'; end if;
  if TG_OP<>'INSERT' then relevant := relevant or OLD.survey_slug='masterclass-21-novembro'; end if;
 elsif TG_TABLE_NAME='surveys' then
  if TG_OP<>'DELETE' then relevant := NEW.slug='masterclass-21-novembro'; end if;
  if TG_OP<>'INSERT' then relevant := relevant or OLD.slug='masterclass-21-novembro'; end if;
 elsif TG_TABLE_NAME='survey_versions' then
  if TG_OP<>'DELETE' then relevant := exists(select 1 from public.surveys where id=NEW.survey_id and slug='masterclass-21-novembro'); end if;
  if TG_OP<>'INSERT' then relevant := relevant or exists(select 1 from public.surveys where id=OLD.survey_id and slug='masterclass-21-novembro'); end if;
 end if;
 if relevant then
  perform pg_catalog.pg_advisory_xact_lock(260112026);
  insert into public.public_form_dashboards(slug,payload,updated_at)
  values('masterclass-21-novembro',qf_dashboard_internal.workshop_dashboard_payload(),now())
  on conflict(slug) do update set payload=excluded.payload,updated_at=excluded.updated_at;
 end if;
 return null;
end;
$trigger$;
revoke all on function qf_dashboard_internal.refresh_workshop_dashboard() from public,anon,authenticated;
create trigger workshop_dashboard_submission_refresh after insert or update or delete on public.submissions
 for each row execute function qf_dashboard_internal.refresh_workshop_dashboard();
create trigger workshop_dashboard_survey_refresh after insert or update or delete on public.surveys
 for each row execute function qf_dashboard_internal.refresh_workshop_dashboard();
create trigger workshop_dashboard_version_refresh after insert or update or delete on public.survey_versions
 for each row execute function qf_dashboard_internal.refresh_workshop_dashboard();
insert into public.public_form_dashboards(slug,payload) values('masterclass-21-novembro',qf_dashboard_internal.workshop_dashboard_payload());
comment on table public.public_form_dashboards is 'Public aggregate snapshot only. No names, emails, individual answers, identifiers, sources or free-text values.';
commit;
