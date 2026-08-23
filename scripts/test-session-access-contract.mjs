import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync('src/core/router.js', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');

assert.match(router, /import \{ hydrateSession \} from '\.\/session\.js';/, 'Router precisa reutilizar a hidratação canônica da sessão.');
assert.match(router, /import \{ CAPABILITIES, hasCapability \} from '\.\/access-control\.js';/, 'Router precisa usar a matriz central de capacidades.');
assert.match(router, /\(route\.capability \|\| route\.accessGate\) && state\.session/, 'Rotas por capacidade e gate de aprovação precisam revalidar o perfil autenticado.');
assert.match(main, /registerRoute\('\/app\/aguardando', \{ auth: true, accessGate: true,/, 'Rota de espera precisa ser marcada como gate de acesso.');
assert.match(main, /capability: CAPABILITIES\.MANAGE_UNIT_PROFESSIONALS/, 'Aprovações devem exigir capacidade administrativa explícita.');

const revalidateIndex = router.indexOf('await hydrateSession(state.session);');
const accessGateIndex = router.indexOf('if (route.accessGate && hasCapability(state.profile, CAPABILITIES.ACCESS_INTERNAL))');
const capabilityGuardIndex = router.indexOf('if (route.capability && !hasCapability(state.profile, route.capability))');
assert.ok(revalidateIndex >= 0, 'Revalidação do perfil não encontrada.');
assert.ok(accessGateIndex > revalidateIndex, 'Gate de espera precisa usar perfil revalidado.');
assert.ok(capabilityGuardIndex > revalidateIndex, 'O perfil precisa ser revalidado antes do guard de capacidade.');

const refreshStateIndex = router.indexOf('state = getState();', revalidateIndex);
assert.ok(refreshStateIndex > revalidateIndex && refreshStateIndex < accessGateIndex, 'Guards precisam usar o perfil recém-revalidado.');
assert.match(router, /route\.accessGate && hasCapability\(state\.profile, CAPABILITIES.ACCESS_INTERNAL\)[\s\S]*navigate\('\/app\/inicio'/, 'Perfil já ativo não pode permanecer na tela de aguardando aprovação.');
assert.match(router, /route\.capability && !hasCapability\(state\.profile, route\.capability\)/, 'Rota protegida deve falhar fechada quando a capacidade estiver ausente.');
assert.match(router, /Não foi possível validar seu acesso/, 'Falha de revalidação precisa falhar fechada sem renderizar conteúdo protegido com perfil antigo.');

assert.match(main, /import \{ getState, setState \} from '\.\/core\/store\.js';/, 'Sincronização de autenticação precisa comparar o contexto atual antes de decidir por rerender.');
assert.match(main, /function accessContextFingerprint\(state\)/, 'Sessão precisa ter uma comparação explícita dos campos que alteram acesso e escopo.');
for (const field of ['role', 'access_status', 'is_master_account', 'municipality_code', 'unit_cnes', 'team_id', 'microarea']) {
  assert.ok(main.includes(field), `Fingerprint de acesso precisa observar ${field}.`);
}
assert.match(main, /\['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'\]\.includes\(event\) && previousAccess === nextAccess\) return;/, 'Eventos repetidos da sessão sem mudança de acesso não devem reconstruir a tela atual.');
assert.match(main, /previousAccess === nextAccess/, 'A tela só pode ser preservada quando o contexto de acesso realmente permaneceu igual.');
assert.match(main, /await hydrateSession\(nextSession\);[\s\S]*previousAccess === nextAccess/, 'Mesmo sem rerender visual, a sessão precisa continuar sendo hidratada antes da comparação final.');

console.log('Contrato de sessão OK: rotas revalidam acesso e eventos repetidos de autenticação preservam a tela quando o escopo não mudou.');
