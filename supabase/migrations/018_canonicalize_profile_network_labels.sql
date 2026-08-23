create or replace function public.validate_profile_network_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  team_unit text;
  resolved_team_name text;
  unit_municipality text;
  resolved_unit_name text;
begin
  if new.unit_cnes is not null then
    select municipality_code, name
      into unit_municipality, resolved_unit_name
    from public.health_units
    where cnes = new.unit_cnes
      and is_active = true;

    if unit_municipality is null then
      raise exception 'Unidade de saúde inválida ou inativa';
    end if;

    if new.municipality_code is null then
      new.municipality_code := unit_municipality;
    elsif new.municipality_code <> unit_municipality then
      raise exception 'Unidade não pertence ao município selecionado';
    end if;

    new.unit_name := resolved_unit_name;
  elsif new.role <> 'admin' and new.access_status = 'active' then
    raise exception 'Perfil profissional ativo precisa estar vinculado a uma unidade';
  else
    new.unit_name := '';
  end if;

  if new.team_id is not null then
    select unit_cnes, name
      into team_unit, resolved_team_name
    from public.teams
    where id = new.team_id
      and active = true;

    if team_unit is null then
      raise exception 'Equipe inválida ou inativa';
    end if;

    if new.unit_cnes is null then
      new.unit_cnes := team_unit;
      select municipality_code, name
        into new.municipality_code, new.unit_name
      from public.health_units
      where cnes = team_unit
        and is_active = true;
    elsif new.unit_cnes <> team_unit then
      raise exception 'Equipe não pertence à unidade selecionada';
    end if;

    new.team_name := resolved_team_name;
  else
    new.team_name := left(coalesce(new.team_name,''),120);
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_validate_network_membership on public.profiles;
create trigger profiles_validate_network_membership
before insert or update of municipality_code, unit_cnes, team_id, unit_name, team_name, access_status
on public.profiles
for each row execute function public.validate_profile_network_membership();

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
    or new.unit_name is distinct from old.unit_name
    or new.team_name is distinct from old.team_name
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

drop trigger if exists profiles_enforce_scope_security on public.profiles;
create trigger profiles_enforce_scope_security
before update of id, access_status, municipality_code, unit_cnes, team_id, unit_name, team_name
on public.profiles
for each row execute function public.enforce_profile_scope_security();
