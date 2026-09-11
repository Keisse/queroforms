create or replace function public.mark_survey_published_on_version_bump()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.published_version > old.published_version then
    new.status := 'published';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_mark_survey_published_on_version_bump on public.surveys;
create trigger trg_mark_survey_published_on_version_bump
before update of published_version on public.surveys
for each row
execute function public.mark_survey_published_on_version_bump();
