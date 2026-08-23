import assert from 'node:assert/strict';
import fs from 'node:fs';

const visual = fs.readFileSync('src/lib/visual-support.js', 'utf8');
const options = fs.readFileSync('src/lib/print-accessibility.js', 'utf8');
const cards = fs.readFileSync('src/pages/cards.js', 'utf8');
const five = fs.readFileSync('src/pages/five.js', 'utf8');
const indicators = fs.readFileSync('src/pages/indicators.js', 'utf8');
const education = fs.readFileSync('src/pages/education.js', 'utf8');
const css = fs.readFileSync('src/styles/print-accessibility.css', 'utf8');
const guide = fs.readFileSync('docs/PRINT_ACCESSIBILITY_GUIDE.md', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const print = fs.readFileSync('src/utils/print.js', 'utf8');

for (const required of ['vaccine', 'dentist', 'exam', 'fasting', 'water', 'susCard', 'companion', 'clinic', 'warning', 'barrier', 'hypertension', 'diabetes']) {
  assert.match(visual, new RegExp(`\\b${required}\\b`), `Biblioteca visual precisa manter ${required}.`);
}
assert.match(visual, /value = ''/, 'Escolha de pictograma precisa considerar o conteúdo preenchido.');
assert.match(visual, /if \(!ids\.length\)/, 'Sem correspondência específica, fallback deve ser restrito a campos reconhecíveis.');
assert.doesNotMatch(visual, /localStorage|sessionStorage|indexedDB|IndexedDB/, 'Biblioteca visual não pode introduzir persistência.');

assert.match(visual, /const flaticonAssets = \{/, 'Pictogramas assistenciais selecionados precisam ter catálogo explícito do Flaticon.');
for (const id of ['vaccine', 'dentist', 'exam', 'medicine', 'consultation', 'fasting', 'water', 'susCard', 'companion', 'clinic']) {
  assert.match(visual, new RegExp(`${id}: \\{ iconId:`), `${id} precisa usar recurso gratuito rastreável do Flaticon.`);
}
assert.match(visual, /cdn-icons-png\.flaticon\.com/, 'Ícones Flaticon precisam usar origem identificável.');
assert.match(visual, /renderFlaticonAttribution/, 'Biblioteca precisa expor atribuição visível obrigatória.');
assert.match(visual, /Uso gratuito com atribuição/, 'Crédito precisa deixar explícito o contrato gratuito com atribuição.');
assert.doesNotMatch(visual, /premium|Premium/, 'Implementação não pode depender de recurso Premium.');
assert.match(layout, /renderFlaticonAttribution/, 'Aplicativo precisa exibir atribuição do Flaticon no uso web.');
assert.match(print, /withRequiredAttribution/, 'Impressão e PDF precisam incluir atribuição quando houver ícones Flaticon.');
assert.match(print, /waitForImages/, 'Impressão e PDF precisam aguardar o carregamento dos pictogramas externos.');
assert.match(css, /flaticon-icon/, 'CSS precisa dimensionar os ícones Flaticon sem distorção.');
assert.match(css, /flaticon-attribution/, 'CSS precisa manter a atribuição visível inclusive na impressão.');

for (const label of ['Leitura fácil', 'Apoio visual', 'Letra ampliada', 'Econômica']) {
  assert.match(options, new RegExp(label), `Opções compartilhadas precisam manter ${label}.`);
}
assert.match(options, /printAccessibilityClasses/, 'Impressões precisam compartilhar classes de acessibilidade.');

assert.match(cards, /renderVisualSupports\(\{ label: item\.label, value: item\.value, type: item\.field\.type \}/, 'Carteirinhas precisam escolher apoio visual a partir do conteúdo real do campo.');
assert.match(cards, /visualSupport\.checked && Number\(count\.value\) > 4/, 'Apoio visual não deve ser comprimido acima de 4 carteirinhas por A4.');

for (const [name, content] of [['5 minutos', five], ['Indicadores', indicators], ['Educação', education]]) {
  assert.match(content, /renderPrintAccessibilityOptions/, `${name} precisa oferecer opções padronizadas de impressão.`);
  assert.match(content, /readPrintAccessibilityOptions/, `${name} precisa aplicar as opções escolhidas.`);
  assert.match(content, /renderVisualSupports/, `${name} precisa usar a biblioteca visual compartilhada.`);
}

assert.match(css, /print-visual-support/, 'CSS precisa estilizar impressão com apoio visual.');
assert.match(css, /print-large/, 'CSS precisa estilizar letra ampliada.');
assert.match(css, /print-easy-read/, 'CSS precisa estilizar leitura fácil.');
assert.match(index, /print-accessibility\.css/, 'Aplicação precisa carregar os estilos compartilhados de impressão acessível.');

assert.match(guide, /Se o texto fosse escondido/, 'Guia precisa manter o teste de compreensão sem leitura.');
assert.match(guide, /Checklist por tela/, 'Guia precisa registrar checklist por tela.');
assert.match(guide, /Biblioteca visual inicial/, 'Guia precisa registrar a biblioteca visual inicial.');

console.log('Contrato de impressão acessível OK: biblioteca, Flaticon gratuito com atribuição e opções padronizadas protegidos.');
