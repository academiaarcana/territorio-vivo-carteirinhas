import assert from 'node:assert/strict';
import fs from 'node:fs';

const router = fs.readFileSync('src/core/router.js', 'utf8');

assert.match(router, /import \{ hydrateSession \} from '\.\/session\.js';/, 'Router precisa reutilizar a hidratação canônica da sessão.');
assert.match(router, /\(route\.active \|\| route\.management \|\| route\.master\) && state\.session/, 'Rotas protegidas precisam revalidar o perfil autenticado.');

const revalidateIndex = router.indexOf('await hydrateSession(state.session);');
const activeGuardIndex = router.indexOf('if (route.active && !isActiveProfile(state.profile))');
assert.ok(revalidateIndex >= 0, 'Revalidação do perfil não encontrada.');
assert.ok(activeGuardIndex > revalidateIndex, 'O perfil precisa ser revalidado antes do guard de acesso ativo.');

const refreshStateIndex = router.indexOf('state = getState();', revalidateIndex);
assert.ok(refreshStateIndex > revalidateIndex && refreshStateIndex < activeGuardIndex, 'Guards precisam usar o perfil recém-revalidado.');
assert.match(router, /Não foi possível validar seu acesso/, 'Falha de revalidação precisa falhar fechada sem renderizar conteúdo protegido com perfil antigo.');

console.log('Contrato de sessão OK: rotas protegidas revalidam perfil antes dos guards e falham fechadas.');
