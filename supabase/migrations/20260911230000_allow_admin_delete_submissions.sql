drop policy if exists "admins can delete submissions" on public.submissions;

create policy "admins can delete submissions"
on public.submissions
for delete
to authenticated
using (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin');

grant delete on table public.submissions to authenticated;
