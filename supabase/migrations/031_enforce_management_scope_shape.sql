-- Perfis de gestão não devem herdar equipe/microárea de um cadastro ACS anterior.
-- Gestor Municipal opera na rede e Administrador da UBS opera na unidade inteira.

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
  if new.role = 'admin' then
    new.municipality_code := null;
    new.unit_cnes := null;
    new.unit_name := '';
    new.team_id := null;
    new.team_name := '';
    new.microarea := '';
  elsif new.role = 'unit_admin' then
    new.team_id := null;
    new.team_name := '';
    new.microarea := '';
  end if;

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

-- Limpa vínculos herdados já existentes sem depender de IDs específicos.
update public.profiles
set municipality_code = null,
    unit_cnes = null,
    unit_name = '',
    team_id = null,
    team_name = '',
    microarea = ''
where role = 'admin'
  and (
    municipality_code is not null
    or unit_cnes is not null
    or coalesce(unit_name, '') <> ''
    or team_id is not null
    or coalesce(team_name, '') <> ''
    or coalesce(microarea, '') <> ''
  );

update public.profiles
set team_id = null,
    team_name = '',
    microarea = ''
where role = 'unit_admin'
  and (
    team_id is not null
    or coalesce(team_name, '') <> ''
    or coalesce(microarea, '') <> ''
  );
