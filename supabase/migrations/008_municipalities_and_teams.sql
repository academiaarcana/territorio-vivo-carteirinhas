-- Território Vivo — municípios, unidades e equipes confirmáveis.
-- Mantém CNES como chave institucional das unidades e preserva compatibilidade com os perfis existentes.

create table if not exists public.municipalities (
  code text primary key,
  name text not null,
  state_code text not null check (char_length(state_code)=2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.municipalities(code,name,state_code)
values ('110018','Pimenta Bueno','RO')
on conflict (code) do update set name=excluded.name,state_code=excluded.state_code,active=true,updated_at=now();

alter table public.health_units add column if not exists municipality_code text;
update public.health_units set municipality_code='110018' where municipality_code is null and municipality='Pimenta Bueno' and state='RO';

do $$ begin
  if not exists (select 1 from pg_constraint where conname='health_units_municipality_code_fkey') then
    alter table public.health_units add constraint health_units_municipality_code_fkey foreign key (municipality_code) references public.municipalities(code) on update cascade;
  end if;
end $$;

alter table public.health_units add column if not exists data_status text not null default 'public_source';
alter table public.health_units add column if not exists source_note text default '';

do $$ begin
  if not exists (select 1 from pg_constraint where conname='health_units_data_status_check') then
    alter table public.health_units add constraint health_units_data_status_check check (data_status in ('public_source','team_confirmed','needs_review'));
  end if;
end $$;

update public.health_units set data_status='needs_review', source_note='Existência pública confirmada; endereço, telefone e/ou funcionamento devem ser confirmados localmente.' where cnes in ('9560742','5756316','8135339','8176108');
update public.health_units set data_status='public_source' where cnes in ('2496542','2496550','2496569','2552108');

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  unit_cnes text not null references public.health_units(cnes) on update cascade on delete cascade,
  name text not null,
  ine text unique,
  active boolean not null default true,
  verification_status text not null default 'pending' check (verification_status in ('pending','confirmed')),
  source_label text default '',
  source_url text default '',
  source_checked_on date,
  source_note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(unit_cnes,name)
);

alter table public.profiles add column if not exists municipality_code text;
alter table public.profiles add column if not exists team_id uuid;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_municipality_code_fkey') then
    alter table public.profiles add constraint profiles_municipality_code_fkey foreign key (municipality_code) references public.municipalities(code) on update cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='profiles_team_id_fkey') then
    alter table public.profiles add constraint profiles_team_id_fkey foreign key (team_id) references public.teams(id) on delete set null;
  end if;
end $$;

insert into public.teams(unit_cnes,name,ine,verification_status,source_label,source_checked_on,source_note)
values ('2496542','Equipe 02','0002332566','confirmed','Relatório e-SUS utilizado no projeto Território Vivo','2026-08-20','Equipe 02 da UBS Madre Tereza de Calcutá confirmada nos relatórios locais do projeto.')
on conflict (unit_cnes,name) do update set ine=excluded.ine,verification_status='confirmed',source_label=excluded.source_label,source_checked_on=excluded.source_checked_on,source_note=excluded.source_note,updated_at=now();

update public.profiles p set municipality_code='110018' where municipality_code is null and unit_cnes is not null;
update public.profiles p set team_id=(select id from public.teams where unit_cnes='2496542' and name='Equipe 02' limit 1) where team_id is null and unit_cnes='2496542' and team_name='Equipe 02';

alter table public.municipalities enable row level security;
alter table public.teams enable row level security;
grant select on public.municipalities, public.teams to anon, authenticated;
grant insert,update,delete on public.municipalities, public.teams to authenticated;
revoke insert,update,delete on public.municipalities, public.teams from anon;

drop policy if exists municipalities_public_select on public.municipalities;
create policy municipalities_public_select on public.municipalities for select to anon using (active=true);
drop policy if exists municipalities_authenticated_select on public.municipalities;
create policy municipalities_authenticated_select on public.municipalities for select to authenticated using (active=true or private.is_admin());
drop policy if exists municipalities_admin_insert on public.municipalities;
create policy municipalities_admin_insert on public.municipalities for insert to authenticated with check (private.is_admin());
drop policy if exists municipalities_admin_update on public.municipalities;
create policy municipalities_admin_update on public.municipalities for update to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists municipalities_admin_delete on public.municipalities;
create policy municipalities_admin_delete on public.municipalities for delete to authenticated using (private.is_admin());

drop policy if exists teams_public_select on public.teams;
create policy teams_public_select on public.teams for select to anon using (active=true);
drop policy if exists teams_authenticated_select on public.teams;
create policy teams_authenticated_select on public.teams for select to authenticated using (active=true or private.is_admin());
drop policy if exists teams_admin_insert on public.teams;
create policy teams_admin_insert on public.teams for insert to authenticated with check (private.is_admin());
drop policy if exists teams_admin_update on public.teams;
create policy teams_admin_update on public.teams for update to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists teams_admin_delete on public.teams;
create policy teams_admin_delete on public.teams for delete to authenticated using (private.is_admin());

drop trigger if exists municipalities_set_updated_at on public.municipalities;
create trigger municipalities_set_updated_at before update on public.municipalities for each row execute procedure public.set_updated_at();
drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at before update on public.teams for each row execute procedure public.set_updated_at();

create index if not exists health_units_municipality_code_idx on public.health_units(municipality_code);
create index if not exists teams_unit_cnes_idx on public.teams(unit_cnes);
create index if not exists profiles_municipality_code_idx on public.profiles(municipality_code);
create index if not exists profiles_team_id_idx on public.profiles(team_id);

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

  select hu.name, hu.municipality_code into resolved_unit_name, resolved_municipality
  from public.health_units hu where hu.cnes=requested_unit and hu.is_active=true;
  if resolved_unit_name is null then
    requested_unit := null;
    resolved_unit_name := '';
    resolved_municipality := null;
  end if;

  select t.id,t.name into requested_team_uuid,resolved_team_name
  from public.teams t
  where t.active=true and t.unit_cnes=requested_unit and t.id::text=coalesce(new.raw_user_meta_data->>'team_id','')
  limit 1;

  if resolved_team_name is not null then requested_team := resolved_team_name; end if;

  insert into public.profiles(id,full_name,role,microarea,municipality_code,unit_cnes,team_id,unit_name,team_name)
  values(
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name',''),160),
    case when lower(coalesce(new.email,''))='macedotaynara@outlook.com' then 'admin' else 'acs' end,
    left(requested_microarea,40),
    resolved_municipality,
    requested_unit,
    requested_team_uuid,
    resolved_unit_name,
    left(coalesce(requested_team,''),120)
  )
  on conflict(id) do update set
    role=excluded.role,
    full_name=case when public.profiles.full_name='' then excluded.full_name else public.profiles.full_name end,
    microarea=coalesce(public.profiles.microarea,excluded.microarea),
    municipality_code=coalesce(public.profiles.municipality_code,excluded.municipality_code),
    unit_cnes=coalesce(public.profiles.unit_cnes,excluded.unit_cnes),
    team_id=coalesce(public.profiles.team_id,excluded.team_id),
    unit_name=case when public.profiles.unit_name='' then excluded.unit_name else public.profiles.unit_name end,
    team_name=case when public.profiles.team_name='' then excluded.team_name else public.profiles.team_name end;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public,anon,authenticated;
