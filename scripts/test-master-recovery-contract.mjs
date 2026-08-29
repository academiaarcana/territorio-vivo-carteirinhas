import assert from 'node:assert/strict';
import fs from 'node:fs';

const path = 'supabase/migrations/20260829175027_prepare_safe_initial_master_promotion.sql';
const sql = fs.readFileSync(path, 'utf8');

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
assert.match(sql, /revoke all on function private\.promote_initial_master\(\) from public/i, 'PUBLIC não pode executar a recuperação.');
assert.match(sql, /revoke all on function private\.promote_initial_master\(\) from anon/i, 'anon não pode executar a recuperação.');
assert.match(sql, /revoke all on function private\.promote_initial_master\(\) from authenticated/i, 'authenticated não pode executar a recuperação.');
assert.match(sql, /revoke all on function private\.promote_initial_master\(\) from service_role/i, 'service_role não pode promover Master via API.');

console.log('Contrato da recuperação Master OK: promoção única, confirmada, serializada e sem execução por papéis de API.');
