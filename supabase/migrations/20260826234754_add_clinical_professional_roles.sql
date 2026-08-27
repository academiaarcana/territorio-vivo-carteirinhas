-- Perfis clínicos de menor privilégio para acesso externo a prescrições.
-- Nenhum dado de receita ou paciente é persistido no Território Vivo.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('acs', 'physician', 'nurse', 'unit_admin', 'admin'));

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
    if old.role in ('acs', 'physician', 'nurse')
      and old.access_status <> 'pending'
      and scope_changed then
      raise exception 'Profissional ativo não pode alterar o próprio vínculo institucional; solicite à gestão';
    end if;
  elsif new.access_status is distinct from old.access_status then
    if not caller_is_unit_admin or old.role not in ('acs', 'physician', 'nurse') then
      raise exception 'Somente a gestão superior pode alterar o acesso de administradores';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_scope_security() from public, anon, authenticated;
grant execute on function public.enforce_profile_scope_security() to service_role;

create or replace function public.validate_profile_network_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  team_unit text;
  resolved_team_name text;
  unit_municipality text;
  resolved_unit_name text;
begin
  if new.role = 'admin' then
    new.municipality_code := null;
    new.unit_cnes := null;
    new.unit_name := '';
    new.team_id := null;
    new.team_name := '';
    new.microarea := '';
  elsif new.role = 'unit_admin' then
    new.team_id := null;
    new.team_name := '';
    new.microarea := '';
  elsif new.role in ('physician', 'nurse') then
    new.microarea := '';
  end if;

  if new.unit_cnes is not null then
    select municipality_code, name
      into unit_municipality, resolved_unit_name
    from public.health_units
    where cnes = new.unit_cnes
      and is_active = true;

    if unit_municipality is null then
      raise exception 'Unidade de saúde inválida ou inativa';
    end if;

    if new.municipality_code is null then
      new.municipality_code := unit_municipality;
    elsif new.municipality_code <> unit_municipality then
      raise exception 'Unidade não pertence ao município selecionado';
    end if;

    new.unit_name := resolved_unit_name;
  elsif new.role <> 'admin' and new.access_status = 'active' then
    raise exception 'Perfil profissional ativo precisa estar vinculado a uma unidade';
  else
    new.unit_name := '';
  end if;

  if new.team_id is not null then
    select unit_cnes, name
      into team_unit, resolved_team_name
    from public.teams
    where id = new.team_id
      and active = true;

    if team_unit is null then
      raise exception 'Equipe inválida ou inativa';
    end if;

    if new.unit_cnes is null then
      new.unit_cnes := team_unit;
      select municipality_code, name
        into new.municipality_code, new.unit_name
      from public.health_units
      where cnes = team_unit
        and is_active = true;
    elsif new.unit_cnes <> team_unit then
      raise exception 'Equipe não pertence à unidade selecionada';
    end if;

    new.team_name := resolved_team_name;
  else
    new.team_name := left(coalesce(new.team_name, ''), 120);
  end if;

  return new;
end;
$$;

revoke all on function public.validate_profile_network_membership() from public, anon, authenticated;
grant execute on function public.validate_profile_network_membership() to service_role;

drop policy if exists profiles_select_by_scope on public.profiles;
create policy profiles_select_by_scope
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or private.is_admin()
  or (
    private.is_unit_admin()
    and unit_cnes = private.current_unit_cnes()
    and role in ('acs', 'physician', 'nurse')
  )
);

drop policy if exists profiles_update_by_scope on public.profiles;
create policy profiles_update_by_scope
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  or private.is_master_account()
  or (private.is_admin() and role <> 'admin')
  or (
    private.is_unit_admin()
    and unit_cnes = private.current_unit_cnes()
    and role in ('acs', 'physician', 'nurse')
  )
)
with check (
  (select auth.uid()) = id
  or private.is_master_account()
  or (private.is_admin() and role <> 'admin')
  or (
    private.is_unit_admin()
    and unit_cnes = private.current_unit_cnes()
    and role in ('acs', 'physician', 'nurse')
  )
);
