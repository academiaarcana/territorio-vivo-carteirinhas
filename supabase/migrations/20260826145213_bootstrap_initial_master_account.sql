-- Bootstrap operacional da primeira conta Master do projeto definitivo.
-- Não contém e-mail/UUID e permanece seguro ao reaplicar em banco vazio
-- ou em ambiente que já possua uma conta Master.

do $bootstrap_master$
declare
  eligible_count integer;
  master_count integer;
  target_id uuid;
  affected integer;
begin
  select count(*)
    into master_count
  from public.profiles
  where is_master_account = true;

  if master_count > 0 then
    return;
  end if;

  select count(*), min(p.id)
    into eligible_count, target_id
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.email_confirmed_at is not null;

  if eligible_count = 0 then
    return;
  end if;

  if eligible_count <> 1 then
    raise exception 'Bootstrap Master cancelado: esperado um único perfil confirmado; encontrados %.', eligible_count;
  end if;

  execute 'alter table public.profiles disable trigger profiles_enforce_role';
  execute 'alter table public.profiles disable trigger profiles_enforce_scope_security';

  begin
    update public.profiles
    set role = 'admin',
        access_status = 'active',
        is_master_account = true,
        municipality_code = null,
        unit_cnes = null,
        unit_name = '',
        team_id = null,
        team_name = '',
        microarea = '',
        updated_at = now()
    where id = target_id;

    get diagnostics affected = row_count;
    if affected <> 1 then
      raise exception 'Bootstrap Master cancelado: alteração atingiu % perfis.', affected;
    end if;

    execute 'alter table public.profiles enable trigger profiles_enforce_scope_security';
    execute 'alter table public.profiles enable trigger profiles_enforce_role';
  exception
    when others then
      execute 'alter table public.profiles enable trigger profiles_enforce_scope_security';
      execute 'alter table public.profiles enable trigger profiles_enforce_role';
      raise;
  end;
end
$bootstrap_master$;
