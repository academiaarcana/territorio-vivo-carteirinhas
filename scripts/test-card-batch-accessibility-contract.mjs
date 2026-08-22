import assert from 'node:assert/strict';
import fs from 'node:fs';

const cards = fs.readFileSync('src/pages/cards.js', 'utf8');
const print = fs.readFileSync('src/utils/print.js', 'utf8');
const css = fs.readFileSync('src/styles/cards-accessibility.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert.match(cards, /Lote: conteúdos diferentes/, 'Editor precisa oferecer lote com conteúdos diferentes na mesma folha.');
assert.match(cards, /entries = Array\.from\(\{ length: 12 \}/, 'Lote deve manter até 12 rascunhos somente em memória.');
assert.match(cards, /Carteirinha \$\{activeIndex \+ 1\} de \$\{total\}/, 'Editor deve identificar claramente qual carteirinha está sendo preenchida.');
assert.match(cards, /cardsForSheet\(cards, sheetCount\)/, 'Impressão em lote deve usar uma carteirinha diferente por posição.');
assert.match(cards, /Apoio visual/, 'Editor precisa oferecer apoio visual com pictogramas.');
assert.match(cards, /Letra ampliada/, 'Editor precisa oferecer letra ampliada.');
assert.match(cards, /Number\(count\.value\) > 4/, 'Letra ampliada deve limitar densidade da folha.');
assert.match(cards, /localStorage/, 'Aviso de privacidade deve deixar explícito que o lote não usa armazenamento persistente do navegador.');
assert.match(cards, /field-pictogram/, 'Cartões com apoio visual devem renderizar pictogramas junto ao texto.');

assert.match(print, /export function cardsForSheet/, 'Utilitário de impressão precisa aceitar cartões diferentes por folha.');
assert.match(print, /cards\[index\] \|\| ''/, 'Cada posição da folha deve receber seu próprio HTML.');

assert.match(css, /generated-card\.large-print/, 'CSS deve ampliar tipografia da carteirinha.');
assert.match(css, /field-pictogram/, 'CSS deve dimensionar pictogramas para tela e impressão.');
assert.match(css, /count-4 \.generated-card\.large-print/, 'Impressão ampliada deve ter regra específica para A4.');
assert.match(index, /cards-accessibility\.css/, 'Estilos de lote e acessibilidade devem ser carregados pela aplicação.');

console.log('Contrato de carteirinhas em lote e acessibilidade OK.');
