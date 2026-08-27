import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const page = fs.readFileSync('src/pages/education.js', 'utf8');
const data = fs.readFileSync('src/data/education.js', 'utf8');
const css = fs.readFileSync('src/styles/field-education.css', 'utf8');

assert.match(index, /field-education\.css/, 'Educação em saúde precisa carregar sua camada visual específica.');
assert.match(page, /education-intro-panel/, 'A página precisa explicar a relação entre materiais internos e ferramentas externas.');
assert.match(page, /education-resources-panel/, 'Ferramentas externas precisam ficar separadas dos materiais imprimíveis.');
assert.match(page, /target="_blank" rel="noopener noreferrer"/, 'Ferramentas externas precisam abrir de forma segura.');
assert.match(page, /não integram prontuários, contas ou dados do Território Vivo/, 'A separação entre recursos externos e dados do produto precisa ser explícita.');
assert.match(page, /education-detail-blocks/, 'O material interno precisa manter leitura sequencial.');
assert.match(page, /data-print-topic/, 'A impressão homologada precisa continuar disponível.');
assert.match(page, /data-pdf-topic/, 'A geração de PDF precisa continuar disponível.');
assert.match(data, /https:\/\/www\.cuidadoparatodos\.com\.br\//, 'Cuidado Para Todos precisa estar cadastrado.');
assert.match(data, /https:\/\/storage\.googleapis\.com\/aps-cuidado-para-todos\/ans_de_bolso\.html/, 'ANS de Bolso precisa estar cadastrado.');
assert.match(data, /Avaliação Neurológica Simplificada/, 'ANS de Bolso precisa ter finalidade identificada.');
assert.doesNotMatch(data, /utm_|fbclid=/, 'Links externos não devem manter parâmetros de rastreamento.');
assert.match(css, /@media screen/, 'A nova camada não pode alterar impressão ou PDF.');
assert.match(css, /#app\[data-route="\/app\/educacao"\]/, 'O refinamento precisa permanecer limitado à rota de educação.');
assert.match(css, /@media \(max-width: 760px\)/, 'Materiais e ferramentas precisam preservar reflow mobile.');
assert.doesNotMatch(css, /@media print/, 'O novo arquivo não pode redefinir o material impresso.');
assert.doesNotMatch(css, /linear-gradient|radial-gradient/, 'Educação em saúde não deve usar gradientes decorativos.');

console.log('Contrato da Educação em Campo OK: materiais, ferramentas externas, fontes e impressão protegidos.');
