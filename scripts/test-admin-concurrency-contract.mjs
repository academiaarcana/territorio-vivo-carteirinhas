import assert from 'node:assert/strict';
import fs from 'node:fs';

const admin = fs.readFileSync('src/pages/admin.js', 'utf8');

assert.match(admin, /let mutationInFlight = false;/, 'Gestão precisa manter lock compartilhado de mutation.');
assert.match(admin, /let refreshPromise = null;/, 'Gestão precisa serializar recargas concorrentes.');
assert.match(admin, /if \(refreshPromise\) return refreshPromise;/, 'Uma segunda recarga precisa reutilizar a recarga em andamento.');
assert.match(admin, /if \(!canSubmitForm\(form, button\) \|\| mutationInFlight \|\| refreshPromise\) return;/, 'Formulários administrativos não podem iniciar durante outra mutation ou recarga.');
assert.match(admin, /if \(mutationInFlight \|\| refreshPromise\) return;[\s\S]*const editProfile/, 'Ações da grade precisam ser bloqueadas enquanto a gestão está ocupada.');
assert.match(admin, /async function runInlineMutation[\s\S]*mutationInFlight = true;[\s\S]*content\.setAttribute\('aria-busy', 'true'\);/, 'Mutações inline precisam compartilhar lock e aria-busy.');
assert.match(admin, /finally \{[\s\S]*mutationInFlight = false;[\s\S]*content\.removeAttribute\('aria-busy'\);[\s\S]*setButtonBusy\(button, false\);/, 'Estado ocupado da mutation administrativa precisa ser restaurado mesmo em erro.');

console.log('Contrato de concorrência da gestão OK: recargas e mutations administrativas são serializadas.');
