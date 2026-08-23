-- Menor privilégio: achados territoriais não pessoais ficam visíveis
-- ao master municipal ou a profissionais vinculados à própria UBS.

drop policy if exists territory_points_select_by_municipality on public.territory_points;
drop policy if exists territory_points_select_by_scope on public.territory_points;

create policy territory_points_select_by_scope on public.territory_points
for select to authenticated
using (
  private.is_admin()
  or (unit_cnes is not null and unit_cnes = private.current_unit_cnes())
);
