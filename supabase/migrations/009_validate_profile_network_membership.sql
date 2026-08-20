-- Garante coerência entre município, unidade e equipe escolhidos no perfil.

create or replace function public.validate_profile_network_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  team_unit text;
  unit_municipality text;
begin
  if new.unit_cnes is not null then
    select municipality_code into unit_municipality
    from public.health_units
    where cnes = new.unit_cnes and is_active = true;

    if unit_municipality is null then
      raise exception 'Unidade de saúde inválida ou inativa';
    end if;

    if new.municipality_code is null then
      new.municipality_code := unit_municipality;
    elsif new.municipality_code <> unit_municipality then
      raise exception 'Unidade não pertence ao município selecionado';
    end if;
  end if;

  if new.team_id is not null then
    select unit_cnes into team_unit
    from public.teams
    where id = new.team_id and active = true;

    if team_unit is null then
      raise exception 'Equipe inválida ou inativa';
    end if;

    if new.unit_cnes is null then
      new.unit_cnes := team_unit;
    elsif new.unit_cnes <> team_unit then
      raise exception 'Equipe não pertence à unidade selecionada';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_profile_network_membership() from public, anon, authenticated;

drop trigger if exists profiles_validate_network_membership on public.profiles;
create trigger profiles_validate_network_membership
before insert or update of municipality_code, unit_cnes, team_id on public.profiles
for each row execute procedure public.validate_profile_network_membership();
