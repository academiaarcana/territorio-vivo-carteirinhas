-- Estrutura territorial normalizada: UBS -> equipe eSF -> microarea -> ACS.
-- Armazena somente totais agregados. Nenhum cidadao, prontuario, CPF ou dado clinico.

create table public.microareas (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on update cascade on delete cascade,
  code text not null,
  population_count integer,
  population_reference_date date,
  data_status text not null default 'not_informed',
  source_label text not null default '',
  source_checked_on date,
  source_note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint microareas_code_not_blank check (char_length(trim(code)) between 1 and 40),
  constraint microareas_population_count_check check (population_count is null or population_count >= 0),
  constraint microareas_population_reference_check check (
    (population_count is null and population_reference_date is null)
    or (population_count is not null and population_reference_date is not null)
  ),
  constraint microareas_data_status_check check (data_status in ('not_informed', 'local_confirmed', 'esus_report')),
  constraint microareas_source_lengths_check check (
    char_length(source_label) <= 180
    and char_length(source_note) <= 2000
  ),
  constraint microareas_team_code_key unique (team_id, code)
);

alter table public.profiles
  add column if not exists microarea_id uuid references public.microareas(id) on delete set null;

-- Converte os vinculos textuais existentes sem inventar totais populacionais.
insert into public.microareas (team_id, code, data_status, source_note)
select distinct p.team_id, trim(p.microarea), 'not_informed',
  'Microarea migrada do vinculo profissional; quantidade de pessoas ainda nao informada.'
from public.profiles p
where p.role = 'acs'
  and p.team_id is not null
  and nullif(trim(coalesce(p.microarea, '')), '') is not null
on conflict (team_id, code) do nothing;

update public.profiles p
set microarea_id = m.id
from public.microareas m
where p.role = 'acs'
  and p.team_id = m.team_id
  and trim(coalesce(p.microarea, '')) = m.code
  and p.microarea_id is null
  and (
    select count(*)
    from public.profiles candidate
    where candidate.role = 'acs'
      and candidate.team_id = p.team_id
      and trim(coalesce(candidate.microarea, '')) = trim(coalesce(p.microarea, ''))
  ) = 1;

create unique index microareas_one_acs_assignment_idx
  on public.profiles (microarea_id)
  where role = 'acs' and microarea_id is not null;
create index microareas_team_id_idx on public.microareas (team_id);
create index profiles_microarea_id_idx on public.profiles (microarea_id);

alter table public.microareas enable row level security;

revoke all privileges on table public.microareas from anon;
revoke all privileges on table public.microareas from authenticated;
grant select, insert, update, delete on table public.microareas to authenticated;

create policy microareas_select_by_scope
on public.microareas
for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.teams t
    where t.id = microareas.team_id
      and (select private.is_unit_admin_for(t.unit_cnes))
  )
  or (
    (select private.is_active_member())
    and microareas.team_id = (select private.current_team_id())
  )
);

create policy microareas_insert_by_management_scope
on public.microareas
for insert
to authenticated
with check (
  (select private.is_admin())
  or exists (
    select 1
    from public.teams t
    where t.id = microareas.team_id
      and (select private.is_unit_admin_for(t.unit_cnes))
  )
);

create policy microareas_update_by_management_scope
on public.microareas
for update
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.teams t
    where t.id = microareas.team_id
      and (select private.is_unit_admin_for(t.unit_cnes))
  )
)
with check (
  (select private.is_admin())
  or exists (
    select 1
    from public.teams t
    where t.id = microareas.team_id
      and (select private.is_unit_admin_for(t.unit_cnes))
  )
);

create policy microareas_delete_by_management_scope
on public.microareas
for delete
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.teams t
    where t.id = microareas.team_id
      and (select private.is_unit_admin_for(t.unit_cnes))
  )
);

create trigger microareas_set_updated_at
before update on public.microareas
for each row execute function public.set_updated_at();

create or replace function public.validate_profile_microarea_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_team_id uuid;
  resolved_code text;
begin
  if new.role <> 'acs' then
    new.microarea_id := null;
    new.microarea := '';
    return new;
  end if;

  if new.microarea_id is null then
    if tg_op = 'UPDATE' and old.microarea_id is not null then
      new.microarea := '';
    end if;
    return new;
  end if;

  select m.team_id, m.code
    into resolved_team_id, resolved_code
  from public.microareas m
  where m.id = new.microarea_id
    and m.active = true;

  if resolved_team_id is null then
    raise exception 'Microarea invalida ou inativa';
  end if;

  if new.team_id is null or new.team_id <> resolved_team_id then
    raise exception 'Microarea nao pertence a equipe selecionada';
  end if;

  new.microarea := resolved_code;
  return new;
end;
$$;

revoke all on function public.validate_profile_microarea_membership() from public, anon, authenticated;
grant execute on function public.validate_profile_microarea_membership() to service_role;

drop trigger if exists profiles_validate_microarea_membership on public.profiles;
create trigger profiles_validate_microarea_membership
before insert or update of role, team_id, microarea_id
on public.profiles
for each row execute function public.validate_profile_microarea_membership();

-- Inclui o novo identificador no bloqueio de autoalteracao de escopo.
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
    raise exception 'O identificador do perfil nao pode ser alterado';
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
      raise exception 'Gestor Municipal nao pode alterar outra conta de Gestor ou a conta Master';
    end if;
    if old.id = auth.uid() and new.access_status is distinct from old.access_status then
      raise exception 'Gestor Municipal nao pode alterar o proprio status de acesso';
    end if;
    return new;
  end if;

  caller_is_unit_admin := private.is_unit_admin();
  scope_changed := (
    new.municipality_code is distinct from old.municipality_code
    or new.unit_cnes is distinct from old.unit_cnes
    or new.team_id is distinct from old.team_id
    or new.microarea_id is distinct from old.microarea_id
    or new.microarea is distinct from old.microarea
    or (new.unit_cnes is null and new.unit_name is distinct from old.unit_name)
    or (new.team_id is null and new.team_name is distinct from old.team_name)
  );

  if old.id = auth.uid() then
    if new.access_status is distinct from old.access_status then
      raise exception 'O usuario nao pode alterar o proprio status de acesso';
    end if;
    if old.role = 'unit_admin' and scope_changed then
      raise exception 'Administrador de UBS nao pode alterar o proprio vinculo institucional';
    end if;
    if old.role in ('acs', 'physician', 'nurse')
      and old.access_status <> 'pending'
      and scope_changed then
      raise exception 'Profissional ativo nao pode alterar o proprio vinculo institucional; solicite a gestao';
    end if;
  elsif new.access_status is distinct from old.access_status then
    if not caller_is_unit_admin or old.role not in ('acs', 'physician', 'nurse') then
      raise exception 'Somente a gestao superior pode alterar o acesso de administradores';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_scope_security() from public, anon, authenticated;
grant execute on function public.enforce_profile_scope_security() to service_role;

drop trigger if exists profiles_enforce_scope_security on public.profiles;
create trigger profiles_enforce_scope_security
before update of id, role, is_master_account, access_status, municipality_code, unit_cnes, team_id, microarea_id, microarea, unit_name, team_name
on public.profiles
for each row execute function public.enforce_profile_scope_security();
