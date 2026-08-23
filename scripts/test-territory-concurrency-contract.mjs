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

assert.match(territory, /function territoryMutationErrorMessage\(error, fallback\)/, 'Território precisa traduzir erros locais seguros sem expor erro técnico do banco.');
assert.match(territory, /message === 'Informe latitude e longitude juntas\.'/,'Par de coordenadas incompleto precisa mostrar a orientação específica ao usuário.');
assert.match(territory, /\^\(Latitude\|Longitude\) inválida/, 'Faixa inválida de latitude/longitude precisa manter a mensagem específica da validação local.');
assert.match(territory, /setStatus\(pointStatus, territoryMutationErrorMessage\(/, 'Cadastro territorial precisa usar a mensagem geográfica específica quando aplicável.');
assert.match(territory, /setStatus\(editStatus, territoryMutationErrorMessage\(/, 'Edição territorial precisa usar a mensagem geográfica específica quando aplicável.');

assert.match(territory, /https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/, 'Localização deve usar o link gratuito do Google Maps sem Maps JavaScript API.');
assert.match(territory, /target="_blank" rel="noopener noreferrer">Ver no Google Maps/, 'Link externo do mapa precisa abrir de forma segura.');
assert.doesNotMatch(territory, /maps\.googleapis\.com|google\.maps\.Map|AIza[0-9A-Za-z_-]+/, 'Território não pode depender de Maps JS, chave de API ou faturamento.');

console.log('Contrato territorial OK: concorrência, mensagens de coordenadas e atalho gratuito de localização protegidos.');
