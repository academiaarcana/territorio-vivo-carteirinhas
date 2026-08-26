import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const five = fs.readFileSync('src/pages/five.js', 'utf8');
const css = fs.readFileSync('src/styles/field-five.css', 'utf8');

assert.match(index, /field-five\.css/, 'A rota dos 5 minutos precisa carregar sua camada visual específica.');
assert.match(five, /five-intro-panel/, 'A página precisa apresentar o objetivo da reunião curta antes do formulário.');
assert.match(five, /five-journey/, 'O roteiro deve explicitar observar, interpretar, combinar ação e reavaliar.');
assert.match(five, /five-form-section/, 'O formulário precisa acompanhar a sequência da conversa.');
assert.match(five, /renderFlaticonIcon/, 'O roteiro deve reutilizar os ícones atribuídos do projeto.');
assert.match(five, /Este formulário é temporário e não é salvo no banco/, 'A nota precisa manter explícita a não persistência.');
assert.match(five, /Não registre nomes de pacientes ou famílias/, 'A orientação de privacidade não pode ser removida.');
assert.match(five, /name="importance"/, 'A interpretação do achado precisa continuar no contrato da nota.');
assert.match(five, /id="five-print"/, 'A impressão homologada precisa continuar disponível.');
assert.match(five, /id="five-pdf"/, 'A geração de PDF precisa continuar disponível.');
assert.match(css, /@media screen/, 'A nova camada não pode alterar impressão ou PDF.');
assert.match(css, /#app\[data-route="\/app\/5-minutos"\]/, 'O refinamento precisa permanecer limitado à rota dos 5 minutos.');
assert.match(css, /@media \(max-width: 760px\)/, 'A reunião e o formulário precisam preservar reflow mobile.');
assert.doesNotMatch(css, /@media print/, 'O novo arquivo não pode redefinir a nota impressa.');
assert.doesNotMatch(css, /linear-gradient|radial-gradient/, 'A rota dos 5 minutos não deve usar gradientes decorativos.');

console.log('Contrato dos 5 Minutos em Campo OK: roteiro, privacidade, nota e impressão protegidos.');
