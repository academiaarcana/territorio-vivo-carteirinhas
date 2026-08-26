import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const indicators = fs.readFileSync('src/pages/indicators.js', 'utf8');
const data = fs.readFileSync('src/data/indicators.js', 'utf8');
const css = fs.readFileSync('src/styles/field-indicators.css', 'utf8');

assert.match(index, /field-indicators\.css/, 'A rota de indicadores precisa carregar sua camada visual específica.');
assert.match(indicators, /indicators-intro-panel/, 'A página precisa contextualizar o uso dos indicadores antes do formulário.');
assert.match(indicators, /indicators-journey/, 'O ciclo precisa explicitar contextualizar, informar, interpretar e agir.');
assert.match(indicators, /ausência de informação não deve ser tratada como zero/, 'A tela precisa diferenciar dado ausente de valor zero.');
assert.match(indicators, /indicatorGroupIcons/, 'Os grupos precisam reutilizar os ícones atribuídos do projeto.');
assert.match(indicators, /indicator-reflection-step/, 'A reflexão precisa acompanhar a sequência de leitura territorial.');
assert.match(indicators, /não é salvo automaticamente/, 'A tela precisa manter explícita a não persistência do rascunho.');
assert.match(indicators, /não é gravada no Supabase/, 'A reflexão precisa manter explícita a não persistência no Supabase.');
assert.match(indicators, /id="indicators-print"/, 'A impressão homologada precisa continuar disponível.');
assert.match(indicators, /id="indicators-pdf"/, 'A geração de PDF precisa continuar disponível.');
assert.match(data, /Minha microárea[\s\S]*Minha equipe/, 'Os dois escopos homologados precisam continuar disponíveis.');
assert.match(css, /@media screen/, 'A nova camada não pode alterar impressão ou PDF.');
assert.match(css, /#app\[data-route="\/app\/indicadores"\]/, 'O refinamento precisa permanecer limitado à rota de indicadores.');
assert.match(css, /@media \(max-width: 760px\)/, 'Indicadores e reflexão precisam preservar reflow mobile.');
assert.doesNotMatch(css, /@media print/, 'O novo arquivo não pode redefinir a leitura impressa.');
assert.doesNotMatch(css, /linear-gradient|radial-gradient/, 'A rota de indicadores não deve usar gradientes decorativos.');

console.log('Contrato dos Indicadores em Campo OK: números, contexto, reflexão e impressão protegidos.');
