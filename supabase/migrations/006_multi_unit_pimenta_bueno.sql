-- Território Vivo — expansão para múltiplas UBS/equipes de Pimenta Bueno.
-- Catálogo institucional baseado em dados públicos do CNES consultados em 20/08/2026.

create table if not exists public.health_units (
  cnes text primary key,
  name text not null,
  short_name text not null,
  unit_type text not null default 'ubs',
  address text default '',
  neighborhood text default '',
  phone text default '',
  hours text default '',
  municipality text not null default 'Pimenta Bueno',
  state text not null default 'RO',
  source_url text default '',
  source_label text not null default 'CNES / Ministério da Saúde',
  source_checked_on date,
  is_active boolean not null default true,
  display_order smallint not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.health_units enable row level security;

grant select on public.health_units to anon, authenticated;
grant insert, update, delete on public.health_units to authenticated;
revoke insert, update, delete on public.health_units from anon;

drop policy if exists "health_units_public_select" on public.health_units;
create policy "health_units_public_select" on public.health_units for select to anon using (is_active = true);

drop policy if exists "health_units_authenticated_select" on public.health_units;
create policy "health_units_authenticated_select" on public.health_units for select to authenticated using (is_active = true or private.is_admin());

drop policy if exists "health_units_admin_insert" on public.health_units;
create policy "health_units_admin_insert" on public.health_units for insert to authenticated with check (private.is_admin());

drop policy if exists "health_units_admin_update" on public.health_units;
create policy "health_units_admin_update" on public.health_units for update to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists "health_units_admin_delete" on public.health_units;
create policy "health_units_admin_delete" on public.health_units for delete to authenticated using (private.is_admin());

drop trigger if exists health_units_set_updated_at on public.health_units;
create trigger health_units_set_updated_at before update on public.health_units for each row execute procedure public.set_updated_at();

insert into public.health_units
(cnes,name,short_name,unit_type,address,neighborhood,phone,hours,source_url,source_checked_on,display_order)
values
('2496542','UBS Madre Tereza de Calcutá Pimenta Bueno','UBS Madre Tereza de Calcutá','ubs','Rua Pinheiro Machado, 316','Pioneiros','(69) 9 8169-9997','Segunda a sexta, 07:00–17:00','https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=1100182496542','2026-08-20',10),
('2552108','UBS Maura Ferreira','UBS Maura Ferreira','ubs','Rua Sebastião Soares Melo, 391','Triângulo Verde','(69) 9 8169-9978','Segunda a sexta, 07:00–17:00','https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=1100182552108','2026-08-20',20),
('9560742','UBS Pastor Ismaelino Salviano de Matos','UBS Pastor Ismaelino','ubs','Avenida São Paulo, 111','Bela Vista','(69) 9 8169-9990','Segunda a sexta, 07:00–17:00','https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=1100189560742','2026-08-20',30),
('2496550','Unidade Básica de Saúde Frei Silvestre Pimenta Bueno','UBS Frei Silvestre','ubs','Rua Pará, 1036','Nova Pimenta','(69) 9 8169-9987','Segunda a sexta, 07:00–17:00','https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=1100182496550','2026-08-20',40),
('2496569','Unidade Básica de Saúde Pastor Jonas Pimenta Bueno','UBS Pastor Jonas','ubs','Avenida Gílio Alves da Costa, 284','Jardim das Oliveiras','(69) 9 8156-9197','Segunda a sexta, 07:00–22:00; sábado, 07:00–17:00','https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=1100182496569','2026-08-20',50),
('5756316','Posto de Saúde Canaã','Posto de Saúde Canaã','rural','Linha 10, s/n','Zona Rural','(69) 3451-2122','Segunda a sexta, 07:00–17:00','https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=1100185756316','2026-08-20',60),
('8135339','Ponto de Atendimento Itaporanga','Ponto de Atendimento Itaporanga','district','','Itaporanga','','','https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=1100188135339','2026-08-20',70),
('8176108','Posto de Saúde Urucumacuã','Posto de Saúde Urucumacuã','district','','Urucumacuã','','','https://cnes2.datasus.gov.br/Mod_Conjunto.asp?VCo_Unidade=1100188176108','2026-08-20',80)
on conflict (cnes) do update set
  name = excluded.name, short_name = excluded.short_name, unit_type = excluded.unit_type,
  address = excluded.address, neighborhood = excluded.neighborhood, phone = excluded.phone,
  hours = excluded.hours, source_url = excluded.source_url, source_label = excluded.source_label,
  source_checked_on = excluded.source_checked_on, is_active = true, display_order = excluded.display_order;

alter table public.profiles drop constraint if exists profiles_microarea_check;
alter table public.profiles add column if not exists unit_cnes text;
alter table public.profiles alter column unit_name set default '';
alter table public.profiles alter column team_name set default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_unit_cnes_fkey') then
    alter table public.profiles add constraint profiles_unit_cnes_fkey
      foreign key (unit_cnes) references public.health_units(cnes)
      on update cascade on delete set null;
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_unit text;
  resolved_unit_name text;
  requested_microarea text;
  requested_team text;
begin
  requested_unit := nullif(trim(coalesce(new.raw_user_meta_data->>'unit_cnes','')), '');
  requested_microarea := nullif(trim(coalesce(new.raw_user_meta_data->>'microarea','')), '');
  requested_team := nullif(trim(coalesce(new.raw_user_meta_data->>'team_name','')), '');

  select hu.name into resolved_unit_name from public.health_units hu
  where hu.cnes = requested_unit and hu.is_active = true;

  if resolved_unit_name is null then
    requested_unit := null;
    resolved_unit_name := '';
  end if;

  insert into public.profiles (id, full_name, role, microarea, unit_cnes, unit_name, team_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name',''), 160),
    case when lower(coalesce(new.email,'')) = 'macedotaynara@outlook.com' then 'admin' else 'acs' end,
    left(requested_microarea, 40),
    requested_unit,
    resolved_unit_name,
    left(coalesce(requested_team,''), 120)
  )
  on conflict (id) do update set
    role = excluded.role,
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    microarea = coalesce(public.profiles.microarea, excluded.microarea),
    unit_cnes = coalesce(public.profiles.unit_cnes, excluded.unit_cnes),
    unit_name = case when public.profiles.unit_name = '' then excluded.unit_name else public.profiles.unit_name end,
    team_name = case when public.profiles.team_name = '' then excluded.team_name else public.profiles.team_name end;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated;
