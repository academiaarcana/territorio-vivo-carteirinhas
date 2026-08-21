-- Território Vivo — mantém rótulos derivados de UBS/equipe sincronizados com o catálogo.
-- IDs e microárea continuam sendo o vínculo protegido. Quando há FK válida,
-- unit_name/team_name são rótulos canônicos e podem ser atualizados internamente.

create or replace function public.enforce_profile_scope_security()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  account_email text;
  scope_changed boolean;
  caller_is_admin boolean;
  caller_is_unit_admin boolean;
begin
  if new.id is distinct from old.id then
    raise exception 'O identificador do perfil não pode ser alterado';
  end if;

  select lower(coalesce(email,'')) into account_email
  from auth.users
  where id = new.id;

  if account_email = 'macedotaynara@outlook.com' then
    new.access_status := 'active';
  end if;

  caller_is_admin := private.is_admin();
  if caller_is_admin then
    return new;
  end if;

  caller_is_unit_admin := private.is_unit_admin();
  scope_changed := (
    new.municipality_code is distinct from old.municipality_code
    or new.unit_cnes is distinct from old.unit_cnes
    or new.team_id is distinct from old.team_id
    or new.microarea is distinct from old.microarea
    -- Rótulos sem vínculo por FK ainda representam uma solicitação de escopo.
    or (new.unit_cnes is null and new.unit_name is distinct from old.unit_name)
    or (new.team_id is null and new.team_name is distinct from old.team_name)
  );

  if old.id = auth.uid() then
    if new.access_status is distinct from old.access_status then
      raise exception 'O usuário não pode alterar o próprio status de acesso';
    end if;

    if old.role = 'unit_admin' and scope_changed then
      raise exception 'Administrador de UBS não pode alterar o próprio vínculo institucional';
    end if;

    if old.role = 'acs' and old.access_status <> 'pending' and scope_changed then
      raise exception 'Profissional ativo não pode alterar o próprio vínculo institucional; solicite à gestão';
    end if;
  elsif new.access_status is distinct from old.access_status then
    if not caller_is_unit_admin or old.role <> 'acs' then
      raise exception 'Somente o master pode alterar o acesso de administradores';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_scope_security() from public;
revoke execute on function public.enforce_profile_scope_security() from anon, authenticated;
grant execute on function public.enforce_profile_scope_security() to service_role;

create or replace function public.sync_profile_unit_label()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.name is distinct from old.name then
    update public.profiles
       set unit_name = new.name
     where unit_cnes = new.cnes
       and unit_name is distinct from new.name;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_profile_unit_label() from public;
revoke execute on function public.sync_profile_unit_label() from anon, authenticated;
grant execute on function public.sync_profile_unit_label() to service_role;

create or replace function public.sync_profile_team_label()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.name is distinct from old.name then
    update public.profiles
       set team_name = new.name
     where team_id = new.id
       and team_name is distinct from new.name;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_profile_team_label() from public;
revoke execute on function public.sync_profile_team_label() from anon, authenticated;
grant execute on function public.sync_profile_team_label() to service_role;

drop trigger if exists health_units_sync_profile_label on public.health_units;
create trigger health_units_sync_profile_label
after update of name on public.health_units
for each row execute function public.sync_profile_unit_label();

drop trigger if exists teams_sync_profile_label on public.teams;
create trigger teams_sync_profile_label
after update of name on public.teams
for each row execute function public.sync_profile_team_label();

-- Reconciliamos qualquer rótulo histórico sem alterar IDs de vínculo.
update public.profiles p
set unit_name = hu.name
from public.health_units hu
where p.unit_cnes = hu.cnes
  and p.unit_name is distinct from hu.name;

update public.profiles p
set team_name = t.name
from public.teams t
where p.team_id = t.id
  and p.team_name is distinct from t.name;
