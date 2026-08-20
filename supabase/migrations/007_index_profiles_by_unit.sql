-- Índice para consultas e gestão de perfis por unidade de saúde.
create index if not exists profiles_unit_cnes_idx on public.profiles(unit_cnes);
