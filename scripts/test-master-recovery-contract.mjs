import assert from 'node:assert/strict';
import fs from 'node:fs';

const preparePath = 'supabase/migrations/20260829175027_prepare_safe_initial_master_promotion.sql';
const alignPath = 'supabase/migrations/20260829183355_align_initial_master_promotion_microareas.sql';
const hardenPath = 'supabase/migrations/20260829234653_harden_initial_master_eligibility.sql';
const bootstrapPath = 'supabase/migrations/20260829234749_promote_initial_master_if_unambiguous.sql';
const containmentPath = 'supabase/migrations/20260829235025_suspend_unscoped_admin_created_test_profiles.sql';

const prepareSql = fs.readFileSync(preparePath, 'utf8');
const alignSql = fs.readFileSync(alignPath, 'utf8');
const hardenSql = fs.readFileSync(hardenPath, 'utf8');
const bootstrapSql = fs.readFileSync(bootstrapPath, 'utf8');
const containmentSql = fs.readFileSync(containmentPath, 'utf8');

function assertExecutionRevoked(sql, role) {
  const functionPattern = 'private\\.promote_initial_master\\(\\)';
  const groupedOrSingle = new RegExp(`revoke\\s+(?:all|execute)\\s+on\\s+function\\s+${functionPattern}\\s+from\\s+[^;]*\\b${role}\\b`, 'i');
  assert.match(sql.replace(/\s+/g, ' '), groupedOrSingle, `${role} não pode executar a recuperação.`);
}

for (const sql of [prepareSql, alignSql, hardenSql]) {
  assert.match(sql, /create or replace function private\.promote_initial_master\(\)/i, 'A recuperação precisa ficar no schema private.');
  assert.match(sql, /security definer/i, 'A operação administrativa precisa executar com autoridade controlada.');
  assert.match(sql, /set search_path = pg_catalog/i, 'A função precisa fixar search_path.');
  assert.match(sql, /pg_advisory_xact_lock/i, 'A promoção precisa ser serializada para evitar corrida.');
  assert.match(sql, /where p\.is_master_account = true/i, 'A operação precisa verificar Master existente.');
  assert.match(sql, /u\.email_confirmed_at is not null/i, 'Somente conta confirmada pode ser elegível.');
  assert.match(sql, /eligible_count <> 1/i, 'A promoção precisa recusar seleção ambígua.');
  assert.match(sql, /role = 'admin'/i, 'A conta promovida precisa receber papel admin.');
  assert.match(sql, /access_status = 'active'/i, 'A conta promovida precisa ficar ativa.');
  assert.match(sql, /is_master_account = true/i, 'A conta promovida precisa ser marcada como Master.');
  assert.match(sql, /municipality_code = null[\s\S]*unit_cnes = null[\s\S]*team_id = null/i, 'Master não pode manter escopo territorial.');
  assert.match(sql, /disable trigger profiles_enforce_role/i, 'A operação precisa controlar temporariamente a proteção de papel.');
  assert.match(sql, /enable trigger profiles_enforce_role/i, 'A proteção de papel precisa ser restaurada.');
  assert.match(sql, /disable trigger profiles_enforce_scope_security/i, 'A operação precisa controlar temporariamente a proteção de escopo.');
  assert.match(sql, /enable trigger profiles_enforce_scope_security/i, 'A proteção de escopo precisa ser restaurada.');
  for (const role of ['public', 'anon', 'authenticated', 'service_role']) assertExecutionRevoked(sql, role);
}

assert.match(alignSql, /microarea_id = null/i, 'A Master precisa remover explicitamente o vínculo microarea_id.');
assert.match(alignSql, /microarea = ''/i, 'A Master precisa remover também o rótulo textual da microárea.');

assert.match(hardenSql, /p\.role = 'acs'[\s\S]*p\.access_status = 'pending'/i, 'Bootstrap só pode considerar perfil profissional pendente.');
assert.match(hardenSql, /nullif\(btrim\(p\.full_name\), ''\) is not null/i, 'Perfil vazio não pode concorrer à promoção Master.');
assert.match(hardenSql, /public\.health_units[\s\S]*hu\.cnes = p\.unit_cnes[\s\S]*hu\.is_active = true/i, 'UBS do perfil elegível precisa existir e estar ativa.');
assert.match(hardenSql, /public\.teams[\s\S]*t\.id = p\.team_id[\s\S]*t\.unit_cnes = p\.unit_cnes[\s\S]*t\.active = true/i, 'Equipe do perfil elegível precisa existir, estar ativa e pertencer à UBS.');
assert.doesNotMatch(hardenSql, /raw_user_meta_data|user_metadata/i, 'Autorização da Master não pode depender de metadados editáveis pelo usuário.');

assert.match(bootstrapSql, /master_count = 0 and eligible_count = 1/i, 'Bootstrap versionado só pode agir em estado inequívoco.');
assert.match(bootstrapSql, /perform private\.promote_initial_master\(\)/i, 'Bootstrap deve reutilizar a função privada endurecida.');
assert.doesNotMatch(bootstrapSql, /else[\s\S]*promote_initial_master/i, 'Estado vazio ou ambíguo deve permanecer no-op.');

assert.match(containmentSql, /set access_status = 'suspended'/i, 'Perfis administrativos de teste sem escopo devem ser contidos por suspensão reversível.');
assert.match(containmentSql, /confirmation_sent_at is null/i, 'Contenção deve diferenciar criação administrativa do signup normal com e-mail.');
assert.match(containmentSql, /last_sign_in_at is null/i, 'Contenção deve atingir apenas contas de teste que nunca iniciaram sessão.');
assert.match(containmentSql, /nullif\(btrim\(p\.full_name\), ''\) is null[\s\S]*p\.unit_cnes is null[\s\S]*p\.team_id is null/i, 'Contenção não pode atingir perfil profissional completo.');
assert.doesNotMatch(containmentSql, /delete\s+from\s+auth\.users/i, 'Contenção deve preservar o histórico do Auth para auditoria.');

console.log('Contrato da recuperação Master OK: promoção única, confirmada, institucionalmente validada, sem API e com contenção reversível de perfis anômalos.');
