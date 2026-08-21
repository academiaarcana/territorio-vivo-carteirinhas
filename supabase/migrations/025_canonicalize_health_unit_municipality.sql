-- Território Vivo — remove dependência histórica de Pimenta Bueno/RO na estrutura de unidades.
-- municipality_code passa a ser obrigatório e município/UF são rótulos canônicos
-- derivados da tabela public.municipalities.

alter table public.health_units
  alter column municipality drop default,
  alter column state drop default,
  alter column municipality_code set not null;

create or replace function public.canonicalize_health_unit_municipality()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_name text;
  resolved_state text;
begin
  select m.name, m.state_code
    into resolved_name, resolved_state
  from public.municipalities m
  where m.code = new.municipality_code;

  if resolved_name is null or resolved_state is null then
    raise exception 'Município inválido para a unidade';
  end if;

  new.municipality := resolved_name;
  new.state := upper(resolved_state);
  return new;
end;
$$;

revoke all on function public.canonicalize_health_unit_municipality() from public;
revoke execute on function public.canonicalize_health_unit_municipality() from anon, authenticated;

drop trigger if exists health_units_canonicalize_municipality on public.health_units;
create trigger health_units_canonicalize_municipality
before insert or update of municipality_code, municipality, state
on public.health_units
for each row execute function public.canonicalize_health_unit_municipality();

update public.health_units hu
set municipality_code = hu.municipality_code;
