-- Contenção reversível de perfis de teste criados administrativamente fora do fluxo
-- normal do Território Vivo durante a homologação de 29/08/2026.
-- Não remove usuários do Auth e não afeta cadastros profissionais completos.

alter table public.profiles disable trigger profiles_enforce_scope_security;

update public.profiles p
set access_status = 'suspended',
    updated_at = now()
from auth.users u
where u.id = p.id
  and p.role = 'acs'
  and p.access_status = 'pending'
  and p.is_master_account = false
  and nullif(btrim(p.full_name), '') is null
  and p.unit_cnes is null
  and p.team_id is null
  and p.microarea_id is null
  and u.email_confirmed_at is not null
  and u.confirmation_sent_at is null
  and u.last_sign_in_at is null
  and u.created_at >= timestamptz '2026-08-29 23:22:00+00'
  and u.created_at <  timestamptz '2026-08-29 23:24:00+00';

alter table public.profiles enable trigger profiles_enforce_scope_security;
