import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const dashboard = fs.readFileSync('src/pages/dashboard.js', 'utf8');
const css = fs.readFileSync('src/styles/field-dashboard.css', 'utf8');

assert.match(index, /field-dashboard\.css/, 'A aplicação precisa carregar a camada visual Painel de Campo.');
assert.match(layout, /workspace-scope-band/, 'O shell precisa tornar UBS, equipe e microárea facilmente escaneáveis.');
assert.match(layout, /Escopo de acesso atual/, 'A faixa de contexto precisa ter nome acessível.');
assert.match(dashboard, /dashboard-journey/, 'O início precisa apresentar o ciclo rápido de trabalho territorial.');
assert.match(dashboard, /Conhecer o território/, 'O roteiro do ACS deve começar pela leitura territorial.');
assert.match(dashboard, /Levar para a equipe/, 'O roteiro deve explicitar a discussão em equipe.');
assert.match(dashboard, /Agir e reavaliar/, 'O roteiro deve terminar em ação e reavaliação.');
assert.match(dashboard, /dashboard-briefing-row/, 'A leitura territorial deve usar linhas leves em vez de cartões de métricas.');
assert.match(css, /@media screen/, 'O novo desenho não pode alterar impressão ou PDF.');
assert.match(css, /\.sidebar[\s\S]*background: var\(--field-navy\)/, 'A navegação interna deve usar o fundo azul profundo escolhido.');
assert.match(css, /@media \(max-width: 760px\)/, 'O Painel de Campo precisa preservar reflow mobile.');
assert.doesNotMatch(css, /linear-gradient|radial-gradient/, 'O Painel de Campo não deve usar gradientes decorativos.');

console.log('Contrato do Painel de Campo OK: contexto, jornada, leitura territorial e responsividade protegidos.');
