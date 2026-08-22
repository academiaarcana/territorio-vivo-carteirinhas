import assert from 'node:assert/strict';
import fs from 'node:fs';

const territory = fs.readFileSync('src/pages/territory.js', 'utf8');

assert.match(territory, /let mutationInFlight = false;/, 'Território precisa manter lock compartilhado de mutation.');
assert.match(territory, /let refreshPromise = null;/, 'Território precisa serializar recargas de pontos.');
assert.match(territory, /if \(refreshPromise\) return refreshPromise;/, 'Uma segunda recarga territorial precisa reutilizar a requisição em andamento.');
assert.match(territory, /button\.disabled \|\| mutationInFlight \|\| refreshPromise \|\| !form\.reportValidity\(\)/, 'Cadastro territorial não pode iniciar durante outra mutation ou recarga.');
assert.match(territory, /pointsTarget\.addEventListener\('click',[\s\S]*if \(mutationInFlight \|\| refreshPromise\) return;/, 'Ações dos pontos precisam ser bloqueadas enquanto o território está ocupado.');
assert.match(territory, /function openPointEditor[\s\S]*if \(mutationInFlight \|\| refreshPromise\) return;/, 'Editor territorial não pode abrir sobre mutation ou recarga em andamento.');
assert.match(territory, /mutationInFlight = true;[\s\S]*pointsTarget\.setAttribute\('aria-busy', 'true'\);/, 'Mutations territoriais precisam anunciar estado ocupado.');
assert.match(territory, /finally \{[\s\S]*mutationInFlight = false;[\s\S]*pointsTarget\.removeAttribute\('aria-busy'\);[\s\S]*setButtonBusy\(button, false\);/, 'Mutation territorial precisa restaurar lock e busy state mesmo em erro.');

console.log('Contrato de concorrência territorial OK: create/edit/resolve/delete e recargas são serializados.');
