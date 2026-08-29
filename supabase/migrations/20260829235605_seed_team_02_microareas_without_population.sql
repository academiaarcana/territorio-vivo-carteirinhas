-- Registra somente a estrutura territorial conhecida da Equipe 02.
-- Não inventa população, data de referência, ACS ou fonte quantitativa.

insert into public.microareas (
  team_id,
  code,
  population_count,
  population_reference_date,
  data_status,
  source_label,
  source_checked_on,
  source_note,
  active
)
select
  t.id,
  v.code,
  null,
  null,
  'not_informed',
  '',
  null,
  'Microárea institucional da Equipe 02. Quantidade de pessoas e data de referência ainda não informadas no backend restaurado.',
  true
from public.teams t
cross join (values ('08'), ('09'), ('10')) as v(code)
where t.ine = '0002332566'
  and t.unit_cnes = '2496542'
  and t.active = true
on conflict (team_id, code) do update
set active = true,
    population_count = coalesce(public.microareas.population_count, excluded.population_count),
    population_reference_date = coalesce(public.microareas.population_reference_date, excluded.population_reference_date),
    updated_at = now();
