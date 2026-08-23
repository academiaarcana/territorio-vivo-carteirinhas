alter table public.profiles
  add column if not exists access_status text not null default 'pending';

update public.profiles
set access_status = 'active'
where access_status = 'pending';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_access_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_access_status_check
      check (access_status in ('pending','active','suspended'));
  end if;
end $$;

create or replace function private.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select access_status = 'active'
    from public.profiles
    where id = auth.uid()
  ), false);
$$;

create or replace function private.is_admin()
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
  );
$$;

create or replace function private.is_unit_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select role = 'unit_admin' and access_status = 'active'
    from public.profiles
    where id = auth.uid()
  ), false);
$$;

create or replace function private.is_unit_admin_for(target_unit text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select role = 'unit_admin'
      and access_status = 'active'
      and unit_cnes is not null
      and unit_cnes = target_unit
    from public.profiles
    where id = auth.uid()
  ), false);
$$;

revoke all on function private.is_active_member() from public;
grant execute on function private.is_active_member() to authenticated;

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
  initial_status text;
begin
  requested_unit := nullif(trim(coalesce(new.raw_user_meta_data->>'unit_cnes','')), '');
  requested_microarea := nullif(trim(coalesce(new.raw_user_meta_data->>'microarea','')), '');
  requested_team := nullif(trim(coalesce(new.raw_user_meta_data->>'team_name','')), '');

  select hu.name, hu.municipality_code
    into resolved_unit_name, resolved_municipality
  from public.health_units hu
  where hu.cnes = requested_unit
    and hu.is_active = true;

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

  initial_status := case
    when lower(coalesce(new.email,'')) = 'macedotaynara@outlook.com' then 'active'
    else 'pending'
  end;

  insert into public.profiles(
    id, full_name, role, access_status, microarea,
    municipality_code, unit_cnes, team_id, unit_name, team_name
  ) values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name',''),160),
    case when lower(coalesce(new.email,'')) = 'macedotaynara@outlook.com' then 'admin' else 'acs' end,
    initial_status,
    left(requested_microarea,40),
    resolved_municipality,
    requested_unit,
    requested_team_uuid,
    resolved_unit_name,
    left(coalesce(requested_team,''),120)
  )
  on conflict(id) do update set
    role = excluded.role,
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

create or replace function public.enforce_profile_scope_security()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  account_email text;
  scope_changed boolean;
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

  if private.is_admin() then
    return new;
  end if;

  scope_changed := (
    new.municipality_code is distinct from old.municipality_code
    or new.unit_cnes is distinct from old.unit_cnes
    or new.team_id is distinct from old.team_id
  );

  if old.id = auth.uid() then
    if new.access_status is distinct from old.access_status then
      raise exception 'O usuário não pode alterar o próprio status de acesso';
    end if;

    if old.role = 'unit_admin' and scope_changed then
      raise exception 'Administrador de UBS não pode alterar a própria unidade ou equipe de gestão';
    end if;

    if old.role = 'acs' and old.access_status <> 'pending' and scope_changed then
      raise exception 'Profissional ativo não pode alterar o próprio vínculo institucional; solicite à gestão';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_scope_security on public.profiles;
create trigger profiles_enforce_scope_security
before update of id, access_status, municipality_code, unit_cnes, team_id
on public.profiles
for each row execute function public.enforce_profile_scope_security();

drop policy if exists territory_points_select_by_scope on public.territory_points;
create policy territory_points_select_by_scope
on public.territory_points
for select
to authenticated
using (
  private.is_admin()
  or (
    private.is_active_member()
    and unit_cnes is not null
    and unit_cnes = private.current_unit_cnes()
  )
);

drop policy if exists territory_points_insert_in_scope on public.territory_points;
create policy territory_points_insert_in_scope
on public.territory_points
for insert
to authenticated
with check (
  private.is_admin()
  or private.is_unit_admin_for(unit_cnes)
  or (
    private.is_active_member()
    and (select auth.uid()) = created_by
    and unit_cnes is not null
    and unit_cnes = private.current_unit_cnes()
    and municipality_code = private.current_municipality_code()
    and (team_id is null or team_id = private.current_team_id())
  )
);

drop policy if exists territory_points_update_by_scope on public.territory_points;
create policy territory_points_update_by_scope
on public.territory_points
for update
to authenticated
using (
  private.is_admin()
  or (unit_cnes is not null and private.is_unit_admin_for(unit_cnes))
  or (
    private.is_active_member()
    and (select auth.uid()) = created_by
    and unit_cnes is not null
    and unit_cnes = private.current_unit_cnes()
  )
)
with check (
  private.is_admin()
  or (unit_cnes is not null and private.is_unit_admin_for(unit_cnes))
  or (
    private.is_active_member()
    and (select auth.uid()) = created_by
    and unit_cnes is not null
    and unit_cnes = private.current_unit_cnes()
    and municipality_code = private.current_municipality_code()
    and (team_id is null or team_id = private.current_team_id())
  )
);

drop policy if exists territory_points_delete_by_scope on public.territory_points;
create policy territory_points_delete_by_scope
on public.territory_points
for delete
to authenticated
using (
  private.is_admin()
  or (unit_cnes is not null and private.is_unit_admin_for(unit_cnes))
  or (
    private.is_active_member()
    and (select auth.uid()) = created_by
    and unit_cnes is not null
    and unit_cnes = private.current_unit_cnes()
  )
);
