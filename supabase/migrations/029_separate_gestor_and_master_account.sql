-- Distingue o Gestor Municipal (role=admin) da conta técnica Master/Desenvolvimento.
-- Os roles continuam exatamente: acs, unit_admin e admin.

alter table public.profiles
  add column if not exists is_master_account boolean not null default false;

-- No momento desta migration existe uma única conta admin: a conta Master já homologada.
-- Gestores promovidos depois desta migration permanecem com is_master_account=false.
update public.profiles
set is_master_account = true
where role = 'admin';

create or replace function private.is_master_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and access_status = 'active'
      and is_master_account = true
  );
$$;

revoke all on function private.is_master_account() from public, anon;
grant execute on function private.is_master_account() to authenticated, service_role;

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
    new.access_status := 'pending';
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

    if caller_is_master and new.role in ('acs', 'unit_admin', 'admin') then
      if new.role = 'admin' then
        new.access_status := 'active';
      end if;
      return new;
    end if;

    if caller_is_admin
      and old.role <> 'admin'
      and new.role in ('acs', 'unit_admin') then
      return new;
    end if;

    new.role := old.role;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_role() from public, anon, authenticated;
grant execute on function public.enforce_profile_role() to service_role;

drop trigger if exists profiles_enforce_role on public.profiles;
create trigger profiles_enforce_role
before insert or update of role, id, is_master_account on public.profiles
for each row execute function public.enforce_profile_role();

create or replace function public.enforce_profile_scope_security()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  scope_changed boolean;
  caller_is_master boolean;
  caller_is_admin boolean;
  caller_is_unit_admin boolean;
begin
  if new.id is distinct from old.id then
    raise exception 'O identificador do perfil não pode ser alterado';
  end if;

  caller_is_master := private.is_master_account();
  caller_is_admin := private.is_admin();

  if old.is_master_account then
    new.role := 'admin';
    new.access_status := 'active';
    new.is_master_account := true;
  end if;

  if caller_is_master then
    return new;
  end if;

  if caller_is_admin then
    if old.role = 'admin' and old.id <> auth.uid() then
      raise exception 'Gestor Municipal não pode alterar outra conta de Gestor ou a conta Master';
    end if;
    if old.id = auth.uid() and new.access_status is distinct from old.access_status then
      raise exception 'Gestor Municipal não pode alterar o próprio status de acesso';
    end if;
    return new;
  end if;

  caller_is_unit_admin := private.is_unit_admin();
  scope_changed := (
    new.municipality_code is distinct from old.municipality_code
    or new.unit_cnes is distinct from old.unit_cnes
    or new.team_id is distinct from old.team_id
    or new.microarea is distinct from old.microarea
    or (new.unit_cnes is null and new.unit_name is distinct from old.unit_name)
    or (new.team_id is null and new.team_name is distinct from old.team_name)
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
      raise exception 'Somente a gestão superior pode alterar o acesso de administradores';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_scope_security() from public, anon, authenticated;
grant execute on function public.enforce_profile_scope_security() to service_role;

drop trigger if exists profiles_enforce_scope_security on public.profiles;
create trigger profiles_enforce_scope_security
before update of id, role, is_master_account, access_status, municipality_code, unit_cnes, team_id, microarea, unit_name, team_name
on public.profiles
for each row execute function public.enforce_profile_scope_security();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_unit text;
  resolved_unit_name text;
  resolved_municipality text;
  requested_microarea text;
  requested_team text;
  requested_team_uuid uuid;
  resolved_team_name text;
begin
  requested_unit := nullif(trim(coalesce(new.raw_user_meta_data->>'unit_cnes','')), '');
  requested_microarea := nullif(trim(coalesce(new.raw_user_meta_data->>'microarea','')), '');
  requested_team := nullif(trim(coalesce(new.raw_user_meta_data->>'team_name','')), '');

  select hu.name, hu.municipality_code
    into resolved_unit_name, resolved_municipality
  from public.health_units hu
  where hu.cnes = requested_unit and hu.is_active = true;

  if resolved_unit_name is null then
    requested_unit := null;
    resolved_unit_name := '';
    resolved_municipality := null;
  end if;

  select t.id, t.name
    into requested_team_uuid, resolved_team_name
  from public.teams t
  where t.active = true
    and t.unit_cnes = requested_unit
    and t.id::text = coalesce(new.raw_user_meta_data->>'team_id','')
  limit 1;

  if resolved_team_name is not null then
    requested_team := resolved_team_name;
  end if;

  insert into public.profiles(
    id, full_name, role, access_status, is_master_account, microarea,
    municipality_code, unit_cnes, team_id, unit_name, team_name
  ) values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name',''),160),
    'acs', 'pending', false,
    left(requested_microarea,40),
    resolved_municipality,
    requested_unit,
    requested_team_uuid,
    resolved_unit_name,
    left(coalesce(requested_team,''),120)
  )
  on conflict(id) do update set
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    microarea = coalesce(public.profiles.microarea, excluded.microarea),
    municipality_code = coalesce(public.profiles.municipality_code, excluded.municipality_code),
    unit_cnes = coalesce(public.profiles.unit_cnes, excluded.unit_cnes),
    team_id = coalesce(public.profiles.team_id, excluded.team_id),
    unit_name = case when public.profiles.unit_name = '' then excluded.unit_name else public.profiles.unit_name end,
    team_name = case when public.profiles.team_name = '' then excluded.team_name else public.profiles.team_name end;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

drop trigger if exists profiles_validate_network_membership on public.profiles;
create trigger profiles_validate_network_membership
before insert or update of role, municipality_code, unit_cnes, team_id, unit_name, team_name, access_status
on public.profiles
for each row execute function public.validate_profile_network_membership();

drop policy if exists profiles_update_by_scope on public.profiles;
create policy profiles_update_by_scope
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or private.is_master_account()
  or (private.is_admin() and role <> 'admin')
  or (private.is_unit_admin() and unit_cnes = private.current_unit_cnes() and role = 'acs')
)
with check (
  auth.uid() = id
  or private.is_master_account()
  or (private.is_admin() and role <> 'admin')
  or (private.is_unit_admin() and unit_cnes = private.current_unit_cnes() and role = 'acs')
);
