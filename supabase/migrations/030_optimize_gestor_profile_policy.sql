-- Evita reavaliar auth.uid() para cada linha na policy de perfis.
-- Mantém exatamente o mesmo escopo definido na migration 029.

drop policy if exists profiles_update_by_scope on public.profiles;
create policy profiles_update_by_scope
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  or private.is_master_account()
  or (private.is_admin() and role <> 'admin')
  or (
    private.is_unit_admin()
    and unit_cnes = private.current_unit_cnes()
    and role = 'acs'
  )
)
with check (
  (select auth.uid()) = id
  or private.is_master_account()
  or (private.is_admin() and role <> 'admin')
  or (
    private.is_unit_admin()
    and unit_cnes = private.current_unit_cnes()
    and role = 'acs'
  )
);
