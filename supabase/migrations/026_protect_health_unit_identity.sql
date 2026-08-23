-- Território Vivo — protege a identidade oficial da UBS contra alterações locais.
-- O administrador da própria UBS pode manter dados operacionais, mas somente o
-- master municipal pode alterar identidade ou estrutura administrativa da unidade.

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
       or new.name is distinct from old.name
       or new.short_name is distinct from old.short_name
       or new.unit_type is distinct from old.unit_type
       or new.is_active is distinct from old.is_active
       or new.display_order is distinct from old.display_order then
      raise exception 'Administrador de UBS não pode alterar a identidade ou estrutura administrativa da unidade';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_health_unit_structure() from public;
revoke execute on function public.protect_health_unit_structure() from anon, authenticated;
grant execute on function public.protect_health_unit_structure() to service_role;
