-- O administrador local pode manter dados operacionais da própria UBS,
-- mas não pode alterar por API campos estruturais reservados ao master.

create or replace function public.protect_health_unit_structure()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if private.is_unit_admin_for(old.cnes) and not private.is_admin() then
    if new.cnes is distinct from old.cnes
       or new.municipality_code is distinct from old.municipality_code
       or new.municipality is distinct from old.municipality
       or new.state is distinct from old.state
       or new.unit_type is distinct from old.unit_type
       or new.is_active is distinct from old.is_active
       or new.display_order is distinct from old.display_order then
      raise exception 'Administrador de UBS não pode alterar a estrutura administrativa da unidade';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_health_unit_structure() from public, anon, authenticated;
grant execute on function public.protect_health_unit_structure() to service_role;

drop trigger if exists health_units_protect_structure on public.health_units;
create trigger health_units_protect_structure
before update on public.health_units
for each row execute function public.protect_health_unit_structure();
