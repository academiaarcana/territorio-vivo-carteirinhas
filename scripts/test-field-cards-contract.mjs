import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const cards = fs.readFileSync('src/pages/cards.js', 'utf8');
const css = fs.readFileSync('src/styles/field-cards.css', 'utf8');

assert.match(index, /field-cards\.css/, 'A área de carteirinhas precisa carregar sua camada visual de tela.');
assert.match(cards, /cards-intro-panel/, 'A página precisa explicar o fluxo antes da biblioteca.');
assert.match(cards, /card-library-summary/, 'A busca precisa anunciar a quantidade de modelos encontrados.');
assert.match(cards, /matchingTemplates/, 'Busca, filtro e contagem devem compartilhar a mesma seleção de modelos.');
assert.match(cards, /card-editor-steps/, 'O editor precisa explicitar preencher, ajustar e imprimir.');
assert.match(cards, /Opções de impressão e acessibilidade/, 'As opções da prévia precisam formar um grupo acessível.');
assert.match(cards, /renderFlaticonIcon/, 'A biblioteca deve reutilizar os ícones atribuídos do projeto.');
assert.match(cards, /Criar/, 'A ação dos modelos deve comunicar o resultado esperado.');
assert.match(cards, /const opts = \{ \.\.\.options\(body\), showEditorPlaceholder: false \};/, 'Impressão e PDF precisam desativar a instrução interna do editor.');
assert.match(cards, /showEditorPlaceholder = true/, 'A prévia em tela deve continuar orientando quando nenhum campo foi preenchido.');
assert.match(cards, /renderEditorPlaceholder\(showEditorPlaceholder\)/, 'Todos os modelos devem compartilhar a separação entre prévia vazia e conteúdo imprimível.');
assert.match(cards, /showEditorPlaceholder\s*\? '<p class="placeholder-copy">Preencha os campos ao lado para montar a carteirinha\.<\/p>'\s*:\s*'';/, 'A instrução do editor nunca pode integrar o HTML de impressão quando desativada.');
assert.match(css, /@media screen/, 'A camada visual não pode alcançar impressão ou PDF.');
assert.match(css, /#app\[data-route="\/app\/carteirinhas"\]/, 'O refinamento precisa ficar limitado à rota de carteirinhas.');
assert.match(css, /@media \(max-width: 760px\)/, 'A biblioteca e o editor precisam preservar reflow mobile.');
assert.doesNotMatch(css, /@media print/, 'O novo arquivo não pode redefinir os modelos impressos.');
assert.doesNotMatch(css, /linear-gradient|radial-gradient/, 'A área de carteirinhas não deve usar gradientes decorativos.');

console.log('Contrato das Carteirinhas em Campo OK: biblioteca, editor, acessibilidade e impressão isolados.');
