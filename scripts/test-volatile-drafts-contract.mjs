import assert from 'node:assert/strict';
import fs from 'node:fs';

const volatile = fs.readFileSync('src/core/volatile-drafts.js', 'utf8');
const session = fs.readFileSync('src/core/session.js', 'utf8');
const cards = fs.readFileSync('src/pages/cards.js', 'utf8');
const five = fs.readFileSync('src/pages/five.js', 'utf8');
const indicators = fs.readFileSync('src/pages/indicators.js', 'utf8');

assert.match(volatile, /const drafts = new Map\(\)/, 'Rascunhos devem existir somente em memória do processo da página.');
for (const forbidden of ['localStorage', 'sessionStorage', 'indexedDB', 'IndexedDB']) {
  assert.doesNotMatch(volatile, new RegExp(forbidden), `Rascunhos voláteis não podem usar ${forbidden}.`);
}
assert.match(volatile, /readVolatileDraft/, 'Camada volátil precisa permitir restaurar rascunho durante navegação SPA.');
assert.match(volatile, /writeVolatileDraft/, 'Camada volátil precisa permitir atualizar rascunho durante navegação SPA.');
assert.match(volatile, /clearAllVolatileDrafts/, 'Camada volátil precisa permitir limpeza total na saída da conta.');

assert.match(session, /clearAllVolatileDrafts\(\)/, 'Sair da conta deve apagar todos os rascunhos temporários.');

for (const [name, content] of [['Carteirinhas', cards], ['5 minutos', five], ['Indicadores', indicators]]) {
  assert.match(content, /readVolatileDraft/, `${name} precisa restaurar o rascunho ao voltar para a tela.`);
  assert.match(content, /writeVolatileDraft/, `${name} precisa atualizar o rascunho enquanto a aba estiver aberta.`);
}

assert.match(cards, /const CARDS_PAGE_DRAFT_KEY = 'cards-page'/, 'Carteirinhas precisam guardar qual modelo estava aberto.');
assert.match(cards, /getCardTemplate\(pageDraft\.openTemplateId\)/, 'Carteirinhas precisam reabrir automaticamente o modelo ao voltar para a tela.');
assert.match(cards, /dialog\.addEventListener\('close', \(\) => rememberOpenTemplate\(null\)\)/, 'Fechamento intencional do modelo precisa impedir reabertura automática.');
assert.match(cards, /Ao navegar por outras telas, o rascunho continua apenas na memória desta aba/, 'Carteirinhas precisam explicar a preservação temporária entre telas.');
assert.match(five, /Ao navegar por outras telas, o rascunho continua nesta aba/, '5 minutos precisam explicar a preservação temporária entre telas.');
assert.match(indicators, /rascunho[^\n]*continua nesta aba[^\n]*navegar por outras telas/, 'Indicadores precisam explicar a preservação temporária entre telas.');

console.log('Contrato de rascunhos voláteis OK: navegação preserva conteúdo e modelo aberto; recarga, fechamento e logout continuam limpando.');
