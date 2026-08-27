import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const education = fs.readFileSync('src/pages/education.js', 'utf8');
const page = fs.readFileSync('src/pages/registration-guide.js', 'utf8');
const data = fs.readFileSync('src/data/registration-guide.js', 'utf8');
const css = fs.readFileSync('src/styles/field-registration-guide.css', 'utf8');

assert.match(index, /field-registration-guide\.css/, 'O guia precisa carregar sua camada visual específica.');
assert.match(main, /registerRoute\('\/app\/guia-cadastro', \{ auth: true, capability: CAPABILITIES\.USE_TEMPORARY_TOOLS/, 'O guia precisa exigir conta ativa e capacidade interna.');
assert.match(education, /data-nav="\/app\/guia-cadastro"/, 'Educação em saúde precisa oferecer acesso ao guia.');
assert.match(page, /Este guia orienta; não coleta cadastros/, 'A fronteira educativa precisa estar explícita.');
assert.match(page, /não recebe nem armazena as respostas do cidadão/, 'O guia não pode sugerir persistência de dados pessoais.');
assert.match(page, /target="_blank" rel="noopener noreferrer"/, 'Fontes oficiais precisam abrir de forma segura.');
assert.doesNotMatch(page, /<form|<input|<textarea|supabase|repository/i, 'O guia não pode coletar ou persistir respostas.');

for (const expected of [
  'sete etapas',
  "title: 'Imóvel'",
  "title: 'Território'",
  "title: 'Família'",
  "title: 'Cidadão'",
  'Orientação sexual',
  'Identidade de gênero',
  'autodeclaração',
  'cisgênero',
  'transgênero',
  'Travesti',
  'não binário',
  'Nome social',
  'situação de rua',
  'Não inferir',
  'Não confundir'
]) assert.match(data, new RegExp(expected, 'i'), `O guia precisa conter a orientação: ${expected}.`);

assert.match(data, /sisaps\.saude\.gov\.br\/sistemas\/esusaps\/docs\/manual\/TERRITORIO\/territorio_03\//, 'O manual oficial do e-SUS Território precisa estar registrado.');
assert.match(data, /nota-tecnica-no-21-2024/, 'A Nota Técnica nº 21/2024 precisa estar registrada.');
assert.match(data, /Outro.+APENAS|apenas quando a autodeclaração/is, 'A opção “outro” precisa seguir a autodeclaração.');
assert.match(css, /@media screen/, 'A camada visual precisa permanecer limitada à tela.');
assert.match(css, /#app\[data-route="\/app\/guia-cadastro"\]/, 'O refinamento precisa ser restrito à rota do guia.');
assert.match(css, /@media \(max-width: 760px\)/, 'O guia precisa preservar reflow móvel.');
assert.doesNotMatch(css, /@media print/, 'O guia não pode alterar contratos de impressão existentes.');
assert.doesNotMatch(css, /linear-gradient|radial-gradient/, 'O guia não deve usar gradientes decorativos.');

console.log('Contrato do Guia de Cadastro OK: fontes oficiais, inclusão, privacidade e responsividade protegidas.');
