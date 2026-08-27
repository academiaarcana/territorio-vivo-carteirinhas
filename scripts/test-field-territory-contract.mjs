import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const territory = fs.readFileSync('src/pages/territory.js', 'utf8');
const css = fs.readFileSync('src/styles/field-territory.css', 'utf8');

assert.match(index, /field-territory\.css/, 'A rota territorial precisa carregar sua camada visual específica.');
assert.match(territory, /territory-intro-panel/, 'A página precisa apresentar o escopo territorial antes das ferramentas.');
assert.match(territory, /data-scroll-to-point-form/, 'O atalho principal precisa levar ao cadastro de achado.');
assert.match(territory, /prefers-reduced-motion/, 'A rolagem do atalho precisa respeitar redução de movimento.');
assert.match(territory, /territory-metric-strip/, 'A leitura territorial deve usar métricas leves em vez de cartões pesados.');
assert.match(territory, /data-point-kind/, 'Cada achado precisa expor classificação visual sem alterar os dados.');
assert.match(territory, /renderTerritoryMetrics/, 'Métricas de achados e rede devem compartilhar o mesmo componente.');
assert.match(territory, /renderFlaticonIcon/, 'Ícones devem reutilizar a biblioteca atribuída do projeto.');
assert.match(css, /@media screen/, 'A nova camada não pode alterar impressão ou PDF.');
assert.match(css, /#app\[data-route="\/app\/territorio"\]/, 'O refinamento precisa permanecer limitado à rota territorial.');
assert.match(css, /@media \(max-width: 760px\)/, 'A página territorial precisa preservar reflow mobile.');
assert.doesNotMatch(css, /linear-gradient|radial-gradient/, 'A página territorial não deve usar gradientes decorativos.');

console.log('Contrato do Território em Campo OK: escopo, achados, rede e responsividade protegidos.');
