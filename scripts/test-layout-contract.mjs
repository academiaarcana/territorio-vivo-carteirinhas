import assert from 'node:assert/strict';
import fs from 'node:fs';

const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const a11y = fs.readFileSync('src/core/a11y.js', 'utf8');
const foundation = fs.readFileSync('src/styles/foundation.css', 'utf8');

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

console.log('Contrato do layout OK: logout com busy state compartilhado e um único controlador de teclado para tabs.');
