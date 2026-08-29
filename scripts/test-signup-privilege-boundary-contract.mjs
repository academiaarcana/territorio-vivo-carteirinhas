import assert from 'node:assert/strict';
import fs from 'node:fs';

const authService = fs.readFileSync('src/services/auth.js', 'utf8');
const masterMigration = fs.readFileSync('supabase/migrations/029_separate_gestor_and_master_account.sql', 'utf8');
const clinicalMigration = fs.readFileSync('supabase/migrations/20260826234754_add_clinical_professional_roles.sql', 'utf8');
const microareaMigration = fs.readFileSync('supabase/migrations/20260827161226_add_microareas_and_population_counts.sql', 'utf8');

function blockBetween(source, start, end, label) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `${label}: início não encontrado.`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `${label}: fim não encontrado.`);
  return source.slice(startIndex, endIndex);
}

const signupBlock = blockBetween(
  authService,
  'export async function signUp(payload)',
  'export async function signOut()',
  'signUp do frontend'
);

assert.match(signupBlock, /emailRedirectTo:\s*authRedirectUrl\(\)/, 'Cadastro deve usar o redirect controlado da aplicação.');
for (const allowedField of ['full_name', 'municipality_code', 'unit_cnes', 'team_id', 'team_name', 'microarea']) {
  assert.match(signupBlock, new RegExp(`\\b${allowedField}\\b`), `Cadastro deve enviar somente vínculo esperado; campo ${allowedField} ausente.`);
}
assert.doesNotMatch(signupBlock, /\brole\s*:|\baccess_status\s*:|\bis_master_account\s*:/i, 'Frontend nunca pode escolher papel, status ou flag Master no cadastro.');

const handleNewUserBlock = blockBetween(
  masterMigration,
  'create or replace function public.handle_new_user()',
  'revoke all on function public.handle_new_user()',
  'handle_new_user'
);

assert.match(handleNewUserBlock, /'acs'\s*,\s*'pending'\s*,\s*false/i, 'Banco deve forçar todo novo perfil para ACS pendente e não-Master.');
assert.doesNotMatch(handleNewUserBlock, /raw_user_meta_data->>'(?:role|access_status|is_master_account)'/i, 'Autorização não pode depender de user_metadata.');
assert.match(handleNewUserBlock, /where hu\.cnes = requested_unit and hu\.is_active = true/i, 'Unidade enviada no cadastro deve ser validada contra o catálogo ativo.');
assert.match(handleNewUserBlock, /t\.unit_cnes = requested_unit/i, 'Equipe enviada no cadastro deve pertencer à unidade selecionada.');

const enforceRoleBlock = blockBetween(
  clinicalMigration,
  'create or replace function public.enforce_profile_role()',
  'revoke all on function public.enforce_profile_role()',
  'enforce_profile_role clínico'
);

assert.match(enforceRoleBlock, /if tg_op = 'INSERT'[\s\S]*new\.is_master_account := false;[\s\S]*new\.role := 'acs';[\s\S]*new\.access_status := 'pending';/i, 'Trigger de defesa em profundidade deve rebaixar INSERT para ACS pendente e não-Master.');

const microareaValidationBlock = blockBetween(
  microareaMigration,
  'create or replace function public.validate_profile_microarea_membership()',
  'revoke all on function public.validate_profile_microarea_membership()',
  'validate_profile_microarea_membership'
);

assert.match(microareaValidationBlock, /if new\.microarea_id is null then[\s\S]*return new;/i, 'Primeiro cadastro deve poder existir antes da normalização administrativa da microárea.');
assert.match(microareaValidationBlock, /if new\.team_id is null or new\.team_id <> resolved_team_id then[\s\S]*raise exception/i, 'Microárea normalizada deve pertencer à equipe do perfil.');

console.log('Contrato do cadastro OK: sem autoelevação, vínculo validado e primeira conta compatível com microárea ainda não normalizada.');
