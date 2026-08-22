-- Território Vivo — menor privilégio para administração local.
-- O administrador da UBS vê profissionais/ACS da própria unidade, mas não outros administradores/master.
-- Também pode consultar equipes inativas da própria UBS para conseguir reativá-las.

drop policy if exists profiles_select_by_scope on public.profiles;
create policy profiles_select_by_scope
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or private.is_admin()
  or (
    private.is_unit_admin()
    and unit_cnes = private.current_unit_cnes()
    and role = 'acs'
  )
);

drop policy if exists teams_authenticated_select on public.teams;
create policy teams_authenticated_select
on public.teams
for select
to authenticated
using (
  active = true
  or private.is_admin()
  or private.is_unit_admin_for(unit_cnes)
);

drop policy if exists health_units_authenticated_select on public.health_units;
create policy health_units_authenticated_select
on public.health_units
for select
to authenticated
using (
  is_active = true
  or private.is_admin()
  or private.is_unit_admin_for(cnes)
);
