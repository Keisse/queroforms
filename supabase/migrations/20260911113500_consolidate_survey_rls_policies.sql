drop policy if exists "public can read published surveys" on public.surveys;
drop policy if exists "admins can manage surveys" on public.surveys;

create policy "public can read published surveys"
on public.surveys for select
to anon
using (status = 'published');

create policy "authenticated can read published or admin surveys"
on public.surveys for select
to authenticated
using (
  status = 'published'
  or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin'
);

create policy "admins can insert surveys"
on public.surveys for insert
to authenticated
with check (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin');

create policy "admins can update surveys"
on public.surveys for update
to authenticated
using (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin')
with check (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin');

create policy "admins can delete surveys"
on public.surveys for delete
to authenticated
using (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role'), '') = 'admin');
