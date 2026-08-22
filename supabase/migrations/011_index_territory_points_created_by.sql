-- Índice para a chave estrangeira de autoria dos pontos territoriais.
create index if not exists territory_points_created_by_idx
  on public.territory_points (created_by);
