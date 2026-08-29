-- Território Vivo — endurecimento após reconstrução do projeto Supabase.
-- Remove policies históricas permissivas que sobreviveram a um restore limpo
-- e restringe a função interna de autoativação de RLS para que não seja RPC de cliente.

-- Policies antigas seriam combinadas por OR com as policies de escopo atuais.
drop policy if exists territory_points_authenticated_select on public.territory_points;
drop policy if exists territory_points_insert_own on public.territory_points;

-- A função continua vinculada ao event trigger interno ensure_rls, mas não deve
-- ser executável diretamente via Data API por papéis de cliente.
revoke all on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
