-- Território Vivo — pontos territoriais não pessoais para o Mapa Inteligente.
-- Não usar esta tabela para nomes de pacientes, diagnósticos ou dados clínicos individuais.

create table if not exists public.territory_points (
  id uuid primary key default gen_random_uuid(),
  municipality_code text not null references public.municipalities(code) on update cascade,
  unit_cnes text references public.health_units(cnes) on update cascade on delete set null,
  team_id uuid references public.teams(id) on update cascade on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  kind text not null check (kind in ('resource','potentiality','risk','critical_point','partner','access_barrier','other')),
  name text not null check (char_length(trim(name)) between 2 and 160),
  description text not null default '',
  address text not null default '',
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  observed_on date not null default current_date,
  status text not null default 'active' check (status in ('active','resolved','needs_review')),
  source_label text not null default 'Observação territorial',
  source_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists territory_points_municipality_idx on public.territory_points(municipality_code);
create index if not exists territory_points_unit_idx on public.territory_points(unit_cnes);
create index if not exists territory_points_team_idx on public.territory_points(team_id);
create index if not exists territory_points_kind_status_idx on public.territory_points(kind,status);

alter table public.territory_points enable row level security;

grant select, insert, update, delete on public.territory_points to authenticated;
revoke all on public.territory_points from anon;

drop policy if exists "territory_points_authenticated_select" on public.territory_points;
create policy "territory_points_authenticated_select"
on public.territory_points for select
to authenticated
using (true);

drop policy if exists "territory_points_insert_own" on public.territory_points;
create policy "territory_points_insert_own"
on public.territory_points for insert
to authenticated
with check ((select auth.uid()) = created_by);

drop policy if exists "territory_points_update_own_or_admin" on public.territory_points;
create policy "territory_points_update_own_or_admin"
on public.territory_points for update
to authenticated
using (((select auth.uid()) = created_by) or private.is_admin())
with check (((select auth.uid()) = created_by) or private.is_admin());

drop policy if exists "territory_points_delete_own_or_admin" on public.territory_points;
create policy "territory_points_delete_own_or_admin"
on public.territory_points for delete
to authenticated
using (((select auth.uid()) = created_by) or private.is_admin());

create or replace function public.validate_territory_point()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  unit_municipality text;
  team_unit text;
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  else
    new.created_by := old.created_by;
  end if;

  if new.created_by is null then
    raise exception 'Usuário autenticado obrigatório';
  end if;

  if new.unit_cnes is not null then
    select municipality_code into unit_municipality
    from public.health_units
    where cnes = new.unit_cnes and is_active = true;

    if unit_municipality is null then
      raise exception 'Unidade inválida ou inativa';
    end if;

    if new.municipality_code <> unit_municipality then
      raise exception 'Unidade não pertence ao município selecionado';
    end if;
  end if;

  if new.team_id is not null then
    select unit_cnes into team_unit
    from public.teams
    where id = new.team_id and active = true;

    if team_unit is null then
      raise exception 'Equipe inválida ou inativa';
    end if;

    if new.unit_cnes is null then
      new.unit_cnes := team_unit;
      select municipality_code into new.municipality_code
      from public.health_units where cnes = team_unit;
    elsif new.unit_cnes <> team_unit then
      raise exception 'Equipe não pertence à unidade selecionada';
    end if;
  end if;

  new.name := trim(new.name);
  return new;
end;
$$;

revoke all on function public.validate_territory_point() from public, anon, authenticated;

drop trigger if exists territory_points_validate on public.territory_points;
create trigger territory_points_validate
before insert or update on public.territory_points
for each row execute procedure public.validate_territory_point();

drop trigger if exists territory_points_set_updated_at on public.territory_points;
create trigger territory_points_set_updated_at
before update on public.territory_points
for each row execute procedure public.set_updated_at();
