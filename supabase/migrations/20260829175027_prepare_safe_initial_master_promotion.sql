-- Prepara uma operação administrativa segura para a recuperação da primeira conta Master.
-- A função não cria usuários e não escolhe conta por e-mail ou UUID.
-- Ela só promove quando existe exatamente uma conta confirmada e nenhuma Master anterior.

create or replace function private.promote_initial_master()
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  eligible_count integer;
  master_count integer;
  target_id uuid;
  existing_master_id uuid;
  affected integer;
begin
  perform pg_advisory_xact_lock(hashtext('territorio_vivo_promote_initial_master'));

  select count(*), min(p.id::text)::uuid
    into master_count, existing_master_id
  from public.profiles p
  where p.is_master_account = true;

  if master_count = 1 then
    return existing_master_id;
  end if;

  if master_count > 1 then
    raise exception 'Promoção Master cancelada: existem % contas Master.', master_count;
  end if;

  select count(*), min(p.id::text)::uuid
    into eligible_count, target_id
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.email_confirmed_at is not null;

  if eligible_count = 0 then
    raise exception 'Promoção Master cancelada: nenhuma conta confirmada disponível.';
  end if;

  if eligible_count <> 1 then
    raise exception 'Promoção Master cancelada: esperado um único perfil confirmado; encontrados %.', eligible_count;
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
      raise exception 'Promoção Master cancelada: alteração atingiu % perfis.', affected;
    end if;

    execute 'alter table public.profiles enable trigger profiles_enforce_scope_security';
    execute 'alter table public.profiles enable trigger profiles_enforce_role';
  exception
    when others then
      execute 'alter table public.profiles enable trigger profiles_enforce_scope_security';
      execute 'alter table public.profiles enable trigger profiles_enforce_role';
      raise;
  end;

  return target_id;
end;
$function$;

revoke all on function private.promote_initial_master() from public;
revoke all on function private.promote_initial_master() from anon;
revoke all on function private.promote_initial_master() from authenticated;
revoke all on function private.promote_initial_master() from service_role;

comment on function private.promote_initial_master() is
  'Operação controlada de recuperação: promove exatamente uma conta confirmada para Master quando ainda não existe Master.';
