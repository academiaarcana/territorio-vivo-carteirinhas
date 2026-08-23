-- Território Vivo — defesa em profundidade para criação manual de perfis.
-- Mesmo fora do fluxo normal de signup, um usuário comum nunca pode inserir
-- o próprio perfil já ativo ou com papel administrativo.

create or replace function public.enforce_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  account_email text;
  caller_is_admin boolean := false;
begin
  select lower(coalesce(email,'')) into account_email
  from auth.users
  where id = new.id;

  if account_email = 'macedotaynara@outlook.com' then
    new.role := 'admin';
    new.access_status := 'active';
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'acs';
    new.access_status := 'pending';
    return new;
  end if;

  if new.role is distinct from old.role then
    caller_is_admin := private.is_admin();
    if caller_is_admin and new.role in ('acs','unit_admin') then
      return new;
    end if;
    new.role := old.role;
  else
    new.role := old.role;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_role() from public;
revoke execute on function public.enforce_profile_role() from anon, authenticated;
