-- Sincroniza no repositório a migração já aplicada no projeto Supabase.
-- Introduz o papel unit_admin, limitado à própria unidade por RLS.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('acs','unit_admin','admin'));

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.current_unit_cnes()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select unit_cnes from public.profiles where id = auth.uid();
$$;

create or replace function private.current_municipality_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select municipality_code from public.profiles where id = auth.uid();
$$;

create or replace function private.is_unit_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'unit_admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function private.is_unit_admin_for(target_unit text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select role = 'unit_admin' and unit_cnes is not null and unit_cnes = target_unit
    from public.profiles where id = auth.uid()
  ), false);
$$;

revoke execute on function private.current_unit_cnes() from public, anon;
revoke execute on function private.current_municipality_code() from public, anon;
revoke execute on function private.is_unit_admin() from public, anon;
revoke execute on function private.is_unit_admin_for(text) from public, anon;
grant execute on function private.current_unit_cnes() to authenticated;
grant execute on function private.current_municipality_code() to authenticated;
grant execute on function private.is_unit_admin() to authenticated;
grant execute on function private.is_unit_admin_for(text) to authenticated;

create or replace function public.enforce_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  account_email text;
  caller_is_admin boolean := false;
begin
  select lower(coalesce(email,'')) into account_email
  from auth.users
  where id = new.id;

  if account_email = 'macedotaynara@outlook.com' then
    new.role := 'admin';
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'acs';
    return new;
  end if;

  if new.role is distinct from old.role then
    caller_is_admin := private.is_admin();
    if caller_is_admin and new.role in ('acs','unit_admin') then
      return new;
    end if;
    new.role := old.role;
  else
    new.role := old.role;
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_profile_role() from public, anon, authenticated;
grant execute on function public.enforce_profile_role() to service_role;

-- Perfis: próprio perfil, master, ou administrador da mesma UBS.
drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists profiles_update_own_or_admin on public.profiles;
drop policy if exists profiles_select_by_scope on public.profiles;
drop policy if exists profiles_update_by_scope on public.profiles;

create policy profiles_select_by_scope on public.profiles
for select to authenticated
using (
  (select auth.uid()) = id
  or private.is_admin()
  or (private.is_unit_admin() and unit_cnes = private.current_unit_cnes())
);

create policy profiles_update_by_scope on public.profiles
for update to authenticated
using (
  (select auth.uid()) = id
  or private.is_admin()
  or (private.is_unit_admin() and unit_cnes = private.current_unit_cnes())
)
with check (
  (select auth.uid()) = id
  or private.is_admin()
  or (private.is_unit_admin() and unit_cnes = private.current_unit_cnes())
);

-- Unidade: master administra todas; unit_admin atualiza somente a própria.
drop policy if exists health_units_admin_update on public.health_units;
drop policy if exists health_units_management_update on public.health_units;
create policy health_units_management_update on public.health_units
for update to authenticated
using (private.is_admin() or private.is_unit_admin_for(cnes))
with check (private.is_admin() or private.is_unit_admin_for(cnes));

-- Equipes: master ou administrador da unidade correspondente.
drop policy if exists teams_admin_insert on public.teams;
drop policy if exists teams_admin_update on public.teams;
drop policy if exists teams_admin_delete on public.teams;
drop policy if exists teams_management_insert on public.teams;
drop policy if exists teams_management_update on public.teams;
drop policy if exists teams_management_delete on public.teams;

create policy teams_management_insert on public.teams
for insert to authenticated
with check (private.is_admin() or private.is_unit_admin_for(unit_cnes));

create policy teams_management_update on public.teams
for update to authenticated
using (private.is_admin() or private.is_unit_admin_for(unit_cnes))
with check (private.is_admin() or private.is_unit_admin_for(unit_cnes));

create policy teams_management_delete on public.teams
for delete to authenticated
using (private.is_admin() or private.is_unit_admin_for(unit_cnes));

-- Pontos territoriais: administrador da UBS também pode gerir pontos da própria unidade.
drop policy if exists territory_points_update_own_or_admin on public.territory_points;
drop policy if exists territory_points_delete_own_or_admin on public.territory_points;
drop policy if exists territory_points_update_by_scope on public.territory_points;
drop policy if exists territory_points_delete_by_scope on public.territory_points;

create policy territory_points_update_by_scope on public.territory_points
for update to authenticated
using (
  private.is_admin()
  or (select auth.uid()) = created_by
  or (unit_cnes is not null and private.is_unit_admin_for(unit_cnes))
)
with check (
  private.is_admin()
  or (select auth.uid()) = created_by
  or (unit_cnes is not null and private.is_unit_admin_for(unit_cnes))
);

create policy territory_points_delete_by_scope on public.territory_points
for delete to authenticated
using (
  private.is_admin()
  or (select auth.uid()) = created_by
  or (unit_cnes is not null and private.is_unit_admin_for(unit_cnes))
);
