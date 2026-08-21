import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync('src/core/router.js', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');

assert.match(router, /import \{ hydrateSession \} from '\.\/session\.js';/, 'Router precisa reutilizar a hidratação canônica da sessão.');
assert.match(router, /\(route\.active \|\| route\.management \|\| route\.master \|\| route\.accessGate\) && state\.session/, 'Rotas protegidas e gate de aprovação precisam revalidar o perfil autenticado.');
assert.match(main, /registerRoute\('\/app\/aguardando', \{ auth: true, accessGate: true,/, 'Rota de espera precisa ser marcada como gate de acesso.');

const revalidateIndex = router.indexOf('await hydrateSession(state.session);');
const accessGateIndex = router.indexOf('if (route.accessGate && isActiveProfile(state.profile))');
const activeGuardIndex = router.indexOf('if (route.active && !isActiveProfile(state.profile))');
assert.ok(revalidateIndex >= 0, 'Revalidação do perfil não encontrada.');
assert.ok(accessGateIndex > revalidateIndex, 'Gate de espera precisa usar perfil revalidado.');
assert.ok(activeGuardIndex > revalidateIndex, 'O perfil precisa ser revalidado antes do guard de acesso ativo.');

const refreshStateIndex = router.indexOf('state = getState();', revalidateIndex);
assert.ok(refreshStateIndex > revalidateIndex && refreshStateIndex < accessGateIndex, 'Guards precisam usar o perfil recém-revalidado.');
assert.match(router, /route\.accessGate && isActiveProfile\(state\.profile\)[\s\S]*navigate\('\/app\/inicio'/, 'Perfil já ativo não pode permanecer na tela de aguardando aprovação.');
assert.match(router, /Não foi possível validar seu acesso/, 'Falha de revalidação precisa falhar fechada sem renderizar conteúdo protegido com perfil antigo.');

console.log('Contrato de sessão OK: rotas protegidas revalidam perfil e o gate de espera rejeita perfil já ativo.');
