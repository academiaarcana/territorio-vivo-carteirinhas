-- Território Vivo — fecha o domínio de achados territoriais não pessoais.
-- O mapa inteligente deve registrar somente as seis categorias aprovadas.

alter table public.territory_points
  drop constraint if exists territory_points_kind_check;

alter table public.territory_points
  add constraint territory_points_kind_check
  check (kind in (
    'resource',
    'partner',
    'potentiality',
    'access_barrier',
    'risk',
    'critical_point'
  ));
