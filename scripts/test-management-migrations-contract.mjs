import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];
const read = (file) => {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) {
    errors.push(`Arquivo obrigatório ausente: ${file}`);
    return '';
  }
  return fs.readFileSync(target, 'utf8');
};
const expect = (content, needle, message) => {
  if (!content.includes(needle)) errors.push(message);
};

const m29 = read('supabase/migrations/029_separate_gestor_and_master_account.sql');
expect(m29, 'is_master_account boolean not null default false', 'Migration 029 precisa distinguir explicitamente a conta Master técnica.');
expect(m29, "new.is_master_account := false", 'Novas contas nunca podem nascer como Master.');
expect(m29, "new.role := 'acs'", 'Novas contas precisam nascer como ACS.');
expect(m29, "new.access_status := 'pending'", 'Novas contas precisam nascer pendentes.');
expect(m29, 'new.is_master_account := old.is_master_account', 'Flag Master precisa ser imutável em updates comuns.');
expect(m29, "if old.is_master_account then", 'Conta Master existente precisa ser protegida pelo banco.');
expect(m29, "new.role := 'admin'", 'Conta Master precisa permanecer role=admin.');
expect(m29, "new.access_status := 'active'", 'Conta Master precisa permanecer ativa.');
expect(m29, "caller_is_master and new.role in ('acs', 'unit_admin', 'admin')", 'Somente Master precisa poder promover para Gestor Municipal.');
expect(m29, "caller_is_admin\n      and old.role <> 'admin'", 'Gestor Municipal não pode alterar outro perfil admin.');
expect(m29, 'Gestor Municipal não pode alterar outra conta de Gestor ou a conta Master', 'Banco precisa bloquear administração lateral entre gestores.');
expect(m29, 'Gestor Municipal não pode alterar o próprio status de acesso', 'Gestor não pode autoalterar o próprio acesso.');
expect(m29, 'revoke all on function public.enforce_profile_role() from public, anon, authenticated', 'Trigger de papel não pode ser invocável pelo cliente.');
expect(m29, 'revoke all on function public.enforce_profile_scope_security() from public, anon, authenticated', 'Trigger de escopo não pode ser invocável pelo cliente.');
expect(m29, "'acs', 'pending', false", 'handle_new_user precisa criar conta profissional comum sem privilégio.');
expect(m29, 'or private.is_master_account()', 'Policy de perfis precisa reconhecer a conta Master no banco.');
expect(m29, "or (private.is_admin() and role <> 'admin')", 'Gestor Municipal deve administrar apenas perfis não-admin.');

const m30 = read('supabase/migrations/030_optimize_gestor_profile_policy.sql');
expect(m30, '(select auth.uid()) = id', 'Policy otimizada precisa avaliar auth.uid() uma vez por consulta.');
expect(m30, 'or private.is_master_account()', 'Otimização não pode remover o escopo da conta Master.');
expect(m30, "or (private.is_admin() and role <> 'admin')", 'Otimização não pode ampliar Gestor para outros admins.');
expect(m30, "and role = 'acs'", 'Administrador da UBS deve continuar limitado a ACS na própria unidade.');

const m31 = read('supabase/migrations/031_enforce_management_scope_shape.sql');
expect(m31, "if new.role = 'admin' then", 'Perfis admin precisam ter forma canônica de escopo.');
for (const needle of [
  'new.municipality_code := null',
  'new.unit_cnes := null',
  "new.unit_name := ''",
  'new.team_id := null',
  "new.team_name := ''",
  "new.microarea := ''"
]) expect(m31, needle, `Admin global precisa limpar vínculo territorial: ${needle}.`);
expect(m31, "elsif new.role = 'unit_admin' then", 'Administrador da UBS precisa ter forma de escopo própria.');
expect(m31, "where role = 'admin'", 'Migration 031 precisa corrigir perfis admin já existentes.');
expect(m31, "where role = 'unit_admin'", 'Migration 031 precisa corrigir unit_admin já existentes.');

const m32 = read('supabase/migrations/032_noop_verify_management_scope_shape.sql');
expect(m32, 'perform 1', 'Migration 032 deve continuar sendo no-op documental/operacional.');
if (/alter\s+table|create\s+table|drop\s+table|update\s+public\.|insert\s+into|delete\s+from/i.test(m32)) {
  errors.push('Migration 032 não pode adquirir DDL/DML real; ela representa somente a verificação operacional já registrada.');
}

const permissions = read('src/core/permissions.js');
expect(permissions, 'export function isMasterAccount', 'Frontend precisa distinguir Master técnico de Gestor Municipal.');
expect(permissions, 'export function isGestor', 'Frontend precisa distinguir Gestor Municipal do Master técnico.');
expect(permissions, "return 'Master / Desenvolvimento'", 'Interface precisa rotular a conta Master técnica explicitamente.');
expect(permissions, "return 'Gestor Municipal'", 'Interface precisa rotular Gestor Municipal explicitamente.');
expect(permissions, 'if (isMasterAccount(actorProfile)) return true', 'Somente Master técnico pode exercer promoção administrativa superior no frontend.');
expect(permissions, 'if (targetProfile.role === ROLES.ADMIN) return false', 'Gestor comum não pode alterar status de outro admin pela interface.');

if (errors.length) {
  console.error('\nCONTRATO DE GESTÃO/Master FALHOU\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Contrato Gestor × Master OK: criação sem privilégio, promoção restrita, administração lateral bloqueada e escopos de gestão canonicalizados.');
