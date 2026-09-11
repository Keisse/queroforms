alter table public.submissions
  alter column name set not null,
  alter column email set not null,
  alter column score set not null,
  alter column level set not null;

alter table public.submissions
  add constraint submissions_name_nonempty_check check (char_length(btrim(name)) between 1 and 120),
  add constraint submissions_email_shape_check check (char_length(btrim(email)) between 5 and 254 and position('@' in email) > 1),
  add constraint submissions_survey_version_check check (survey_version >= 1),
  add constraint submissions_answers_object_check check (jsonb_typeof(answers) = 'object'),
  add constraint submissions_dimension_scores_object_check check (jsonb_typeof(dimension_scores) = 'object');

create index if not exists survey_versions_created_by_idx on public.survey_versions(created_by);
