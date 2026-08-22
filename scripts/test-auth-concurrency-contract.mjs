import assert from 'node:assert/strict';
import fs from 'node:fs';

const auth = fs.readFileSync('src/pages/auth.js', 'utf8');

assert.match(auth, /let actionInFlight = false;/, 'Login precisa manter um lock compartilhado de autenticação.');
assert.match(auth, /function setLoginActionsBusy/, 'Login precisa bloquear em conjunto entrada e recuperação de senha.');
assert.match(auth, /\[submit, forgot\]\.forEach/, 'Entrar e esquecer senha precisam participar do mesmo busy state.');
assert.match(auth, /if \(busy\) form\.setAttribute\('aria-busy', 'true'\);/, 'Formulário de login precisa anunciar o estado ocupado.');
assert.match(auth, /else form\.removeAttribute\('aria-busy'\);/, 'Formulário de login precisa restaurar a ausência de aria-busy.');
assert.match(auth, /if \(forgot\.disabled \|\| actionInFlight\) return;/, 'Recuperação não pode iniciar durante login.');
assert.match(auth, /if \(actionInFlight \|\| !canSubmitForm\(form, submit\)\) return;/, 'Login não pode iniciar durante recuperação.');
assert.match(auth, /setLoginActionsBusy\(forgot, false\);/, 'Recuperação precisa restaurar o busy state mesmo em erro.');
assert.match(auth, /setLoginActionsBusy\(submit, false\);/, 'Login precisa restaurar o busy state mesmo em erro.');

console.log('Contrato de concorrência da autenticação OK: entrar e recuperar senha são serializados.');
