create or replace function public.enforce_profile_scope_security()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  account_email text;
  scope_changed boolean;
  caller_is_admin boolean;
  caller_is_unit_admin boolean;
begin
  if new.id is distinct from old.id then
    raise exception 'O identificador do perfil não pode ser alterado';
  end if;

  select lower(coalesce(email,'')) into account_email
  from auth.users
  where id = new.id;

  if account_email = 'macedotaynara@outlook.com' then
    new.access_status := 'active';
  end if;

  caller_is_admin := private.is_admin();
  if caller_is_admin then
    return new;
  end if;

  caller_is_unit_admin := private.is_unit_admin();
  scope_changed := (
    new.municipality_code is distinct from old.municipality_code
    or new.unit_cnes is distinct from old.unit_cnes
    or new.team_id is distinct from old.team_id
    or new.microarea is distinct from old.microarea
    or new.unit_name is distinct from old.unit_name
    or new.team_name is distinct from old.team_name
  );

  if old.id = auth.uid() then
    if new.access_status is distinct from old.access_status then
      raise exception 'O usuário não pode alterar o próprio status de acesso';
    end if;

    if old.role = 'unit_admin' and scope_changed then
      raise exception 'Administrador de UBS não pode alterar o próprio vínculo institucional';
    end if;

    if old.role = 'acs' and old.access_status <> 'pending' and scope_changed then
      raise exception 'Profissional ativo não pode alterar o próprio vínculo institucional; solicite à gestão';
    end if;
  elsif new.access_status is distinct from old.access_status then
    if not caller_is_unit_admin or old.role <> 'acs' then
      raise exception 'Somente o master pode alterar o acesso de administradores';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_scope_security on public.profiles;
create trigger profiles_enforce_scope_security
before update of id, access_status, municipality_code, unit_cnes, team_id, microarea, unit_name, team_name
on public.profiles
for each row execute function public.enforce_profile_scope_security();
