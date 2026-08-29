-- Executa o bootstrap somente quando o banco já contém exatamente um perfil
-- profissional confirmado e validado, e ainda não existe conta Master.
-- Em restores vazios ou estados ambíguos, esta migration é deliberadamente no-op.

do $$
declare
  eligible_count integer;
  master_count integer;
begin
  select count(*) into master_count
  from public.profiles
  where is_master_account = true;

  select count(*) into eligible_count
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.email_confirmed_at is not null
    and p.is_master_account = false
    and p.role = 'acs'
    and p.access_status = 'pending'
    and nullif(btrim(p.full_name), '') is not null
    and p.unit_cnes is not null
    and exists (
      select 1
      from public.health_units hu
      where hu.cnes = p.unit_cnes
        and hu.is_active = true
    )
    and p.team_id is not null
    and exists (
      select 1
      from public.teams t
      where t.id = p.team_id
        and t.unit_cnes = p.unit_cnes
        and t.active = true
    );

  if master_count = 0 and eligible_count = 1 then
    perform private.promote_initial_master();
  end if;
end
$$;
