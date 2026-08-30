import assert from 'node:assert/strict';
import fs from 'node:fs';

const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const a11y = fs.readFileSync('src/core/a11y.js', 'utf8');
const router = fs.readFileSync('src/core/router.js', 'utf8');
const foundation = fs.readFileSync('src/styles/foundation.css', 'utf8');
const structural = fs.readFileSync('src/styles/structural.css', 'utf8');

assert.match(layout, /import \{ setButtonBusy \} from '\.\.\/lib\/forms\.js';/, 'Layout deve reutilizar o busy state compartilhado.');
assert.match(layout, /<header class="workspace-header">[\s\S]*data-signout>Sair da conta<\/button>/, 'A saída deve permanecer visível no cabeçalho das telas internas.');
assert.equal((layout.match(/data-signout/g) || []).length, 2, 'O layout deve renderizar um único botão e consultá-lo uma única vez.');
assert.match(foundation, /\.workspace-header\{[^}]*display:flex[^}]*justify-content:space-between/, 'Cabeçalho deve reservar espaço visível para a saída.');
assert.match(layout, /setButtonBusy\(signout, true, 'Saindo…'\)/, 'Logout deve bloquear interação repetida e anunciar estado ocupado.');
assert.match(layout, /setButtonBusy\(signout, false\)/, 'Logout deve restaurar o estado anterior mesmo após erro.');
assert.equal(layout.includes('bindTabKeyboard'), false, 'Layout não deve instalar um segundo controlador de teclado para tabs.');
assert.match(a11y, /document\.addEventListener\('keydown', handleTablistKeydown\)/, 'Teclado das tabs deve permanecer centralizado no controlador global de acessibilidade.');
assert.match(a11y, /ArrowDown/, 'Controlador global deve manter navegação vertical de tabs.');
assert.match(a11y, /ArrowUp/, 'Controlador global deve manter navegação vertical de tabs.');

assert.match(router, /heading\.setAttribute\('tabindex', '-1'\)/, 'Título da página deve continuar como alvo de foco programático sem entrar na ordem de tabulação.');
assert.match(router, /heading\.focus\(\{ preventScroll: true \}\)/, 'Roteador deve continuar movendo o foco programaticamente para o título após navegação.');
assert.match(structural, /:where\(a,button,input,select,textarea,\[tabindex\]\):focus-visible\{outline:var\(--focus-ring\);outline-offset:var\(--focus-offset\)\}/, 'Controles e alvos navegáveis devem manter foco visível global.');
assert.match(structural, /h1\[tabindex="-1"\]:focus,h1\[tabindex="-1"\]:focus-visible\{outline:none\}/, 'Heading focado apenas para anúncio programático não deve exibir contorno visual de controle interativo.');
assert.match(structural, /\.skip-link:focus\{transform:translateY\(0\)\}/, 'Skip link deve continuar visível ao receber foco.');
assert.match(layout, /class="nav-icon-tile nav-icon-tile--\$\{tone\}" aria-hidden="true"/, 'Navegação deve reservar uma área regular e decorativa para cada pictograma.');
assert.match(layout, /'Carteirinhas', 'susCard', 'violet'/, 'Carteirinhas deve usar um pictograma de cartão de saúde semanticamente claro.');
assert.match(layout, /'Objetivo e tutorial', 'document', 'cyan'/, 'Tutorial deve usar um pictograma de documento ou guia semanticamente claro.');

console.log('Contrato do layout OK: logout, acessibilidade de tabs e foco programático do heading sem contorno visual indevido.');
