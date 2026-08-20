-- Consolida as políticas de perfil para evitar regras permissivas duplicadas.

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (((select auth.uid()) = id) or private.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_update_all" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (((select auth.uid()) = id) or private.is_admin())
with check (((select auth.uid()) = id) or private.is_admin());
