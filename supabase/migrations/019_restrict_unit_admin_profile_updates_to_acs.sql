drop policy if exists profiles_update_by_scope on public.profiles;

create policy profiles_update_by_scope
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  or private.is_admin()
  or (
    private.is_unit_admin()
    and unit_cnes = private.current_unit_cnes()
    and role = 'acs'
  )
)
with check (
  (select auth.uid()) = id
  or private.is_admin()
  or (
    private.is_unit_admin()
    and unit_cnes = private.current_unit_cnes()
    and role = 'acs'
  )
);
