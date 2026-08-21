import assert from 'node:assert/strict';
import fs from 'node:fs';

const accessManagement = fs.readFileSync('src/pages/access-management.js', 'utf8');

assert.match(accessManagement, /let mutationInFlight = false;/, 'Aprovações precisam manter um lock de mutation compartilhado.');
assert.match(accessManagement, /if \(!action \|\| action\.disabled \|\| mutationInFlight\) return;/, 'Uma segunda aprovação não pode iniciar enquanto outra mutation está em andamento.');
assert.match(accessManagement, /mutationInFlight = true;[\s\S]*target\.setAttribute\('aria-busy', 'true'\);/, 'A lista precisa anunciar estado ocupado durante a mutation.');
assert.match(accessManagement, /finally \{[\s\S]*mutationInFlight = false;[\s\S]*target\.removeAttribute\('aria-busy'\);[\s\S]*setButtonBusy\(action, false\);/, 'O lock e o estado acessível precisam ser restaurados mesmo após erro.');

console.log('Contrato de aprovações OK: mutations de acesso são serializadas e o estado ocupado é restaurado.');
