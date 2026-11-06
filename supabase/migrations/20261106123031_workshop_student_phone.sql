alter table public.submissions add column if not exists phone text;
comment on column public.submissions.phone is 'Phone number supplied by workshop students; optional for historical and other survey records.';
