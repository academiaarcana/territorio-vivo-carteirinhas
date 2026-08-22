-- Território Vivo — menor privilégio nos grants de tabelas expostas pela API.
-- RLS continua sendo a fonte de autorização por linha, mas os papéis de cliente
-- não precisam de TRUNCATE/REFERENCES/TRIGGER/MAINTAIN nem de acesso anônimo a perfis.

revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.municipalities from anon;
revoke all privileges on table public.health_units from anon;
revoke all privileges on table public.teams from anon;
revoke all privileges on table public.territory_points from anon;

grant select on table public.municipalities to anon;
grant select on table public.health_units to anon;
grant select on table public.teams to anon;

revoke all privileges on table public.profiles from authenticated;
revoke all privileges on table public.municipalities from authenticated;
revoke all privileges on table public.health_units from authenticated;
revoke all privileges on table public.teams from authenticated;
revoke all privileges on table public.territory_points from authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.municipalities to authenticated;
grant select, insert, update, delete on table public.health_units to authenticated;
grant select, insert, update, delete on table public.teams to authenticated;
grant select, insert, update, delete on table public.territory_points to authenticated;
