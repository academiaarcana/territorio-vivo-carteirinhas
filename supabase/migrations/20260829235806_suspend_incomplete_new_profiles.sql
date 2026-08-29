-- Perfis incompletos criados por fluxos administrativos ou inválidos não entram
-- na fila normal de aprovação. Cadastro profissional válido continua ACS + pending.

create or replace function public.enforce_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  caller_is_admin boolean := false;
  caller_is_master boolean := false;
begin
  if tg_op = 'INSERT' then
    new.is_master_account := false;
    new.role := 'acs';
    if nullif(btrim(coalesce(new.full_name, '')), '') is null
       or new.unit_cnes is null then
      new.access_status := 'suspended';
    else
      new.access_status := 'pending';
    end if;
    return new;
  end if;

  new.is_master_account := old.is_master_account;

  if old.is_master_account then
    new.role := 'admin';
    new.access_status := 'active';
    return new;
  end if;

  if new.role is distinct from old.role then
    caller_is_master := private.is_master_account();
    caller_is_admin := private.is_admin();

    if caller_is_master and new.role in ('acs', 'physician', 'nurse', 'unit_admin', 'admin') then
      if new.role = 'admin' then
        new.access_status := 'active';
      end if;
      return new;
    end if;

    if caller_is_admin
      and old.role <> 'admin'
      and new.role in ('acs', 'physician', 'nurse', 'unit_admin') then
      return new;
    end if;

    new.role := old.role;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_role() from public, anon, authenticated;
grant execute on function public.enforce_profile_role() to service_role;
