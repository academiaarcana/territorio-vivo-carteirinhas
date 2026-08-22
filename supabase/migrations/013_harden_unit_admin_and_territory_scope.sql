-- Fecha elevação indireta de escopo por mudança de UBS e endurece
-- a escrita de pontos territoriais para a unidade/equipe do usuário.

create or replace function private.current_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid();
$$;

revoke execute on function private.current_team_id() from public, anon;
grant execute on function private.current_team_id() to authenticated;

create or replace function public.enforce_profile_scope_security()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'O identificador do perfil não pode ser alterado';
  end if;

  if old.role = 'unit_admin'
     and old.id = auth.uid()
     and not private.is_admin()
     and (
       new.unit_cnes is distinct from old.unit_cnes
       or new.municipality_code is distinct from old.municipality_code
     ) then
    raise exception 'Administrador de UBS não pode alterar a própria unidade de gestão';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_profile_scope_security() from public, anon, authenticated;
grant execute on function public.enforce_profile_scope_security() to service_role;

drop trigger if exists profiles_enforce_scope_security on public.profiles;
create trigger profiles_enforce_scope_security
before update of id, unit_cnes, municipality_code on public.profiles
for each row execute function public.enforce_profile_scope_security();

-- ACS só grava/edita achados dentro da própria UBS e, quando informada,
-- da própria equipe. unit_admin fica limitado à própria UBS; master pode tudo.
drop policy if exists territory_points_insert_in_scope on public.territory_points;
drop policy if exists territory_points_update_by_scope on public.territory_points;
drop policy if exists territory_points_delete_by_scope on public.territory_points;

create policy territory_points_insert_in_scope on public.territory_points
for insert to authenticated
with check (
  private.is_admin()
  or private.is_unit_admin_for(unit_cnes)
  or (
    (select auth.uid()) = created_by
    and unit_cnes is not null
    and unit_cnes = private.current_unit_cnes()
    and municipality_code = private.current_municipality_code()
    and (team_id is null or team_id = private.current_team_id())
  )
);

create policy territory_points_update_by_scope on public.territory_points
for update to authenticated
using (
  private.is_admin()
  or (unit_cnes is not null and private.is_unit_admin_for(unit_cnes))
  or (
    (select auth.uid()) = created_by
    and unit_cnes is not null
    and unit_cnes = private.current_unit_cnes()
  )
)
with check (
  private.is_admin()
  or (unit_cnes is not null and private.is_unit_admin_for(unit_cnes))
  or (
    (select auth.uid()) = created_by
    and unit_cnes is not null
    and unit_cnes = private.current_unit_cnes()
    and municipality_code = private.current_municipality_code()
    and (team_id is null or team_id = private.current_team_id())
  )
);

create policy territory_points_delete_by_scope on public.territory_points
for delete to authenticated
using (
  private.is_admin()
  or (unit_cnes is not null and private.is_unit_admin_for(unit_cnes))
  or (
    (select auth.uid()) = created_by
    and unit_cnes is not null
    and unit_cnes = private.current_unit_cnes()
  )
);
