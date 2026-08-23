import assert from 'node:assert/strict';
import fs from 'node:fs';

const print = fs.readFileSync('src/utils/print.js', 'utf8');
const css = fs.readFileSync('src/styles/pdf-capture.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

assert.match(print, /pdf-document pdf-capture/, 'PDF deve usar um container temporário explicitamente renderizável.');
assert.doesNotMatch(print, /left\s*=\s*['"]-200vw['"]/, 'Captura do PDF não pode voltar a posicionar o conteúdo 200vw fora da viewport.');
assert.match(print, /wrapper\.style\.left\s*=\s*['"]0['"]/, 'Container do PDF precisa permanecer em coordenada capturável.');
assert.match(print, /wrapper\.style\.zIndex\s*=\s*['"]-1['"]/, 'Container pode ficar atrás da interface sem usar display:none, visibility:hidden ou opacity:0.');
assert.match(print, /waitForImages\(wrapper, \{ strict: true \}\)/, 'PDF deve aguardar pictogramas e tratar falha de carregamento.');
assert.match(print, /naturalWidth <= 0|naturalHeight <= 0/, 'Falha real de imagem deve ser detectada antes da captura.');
assert.match(print, /assertPdfCaptureReady\(wrapper\)/, 'PDF deve validar dimensões e conteúdo antes de chamar html2pdf.');
assert.match(print, /style\.display === 'none'/, 'Validação deve rejeitar container display:none.');
assert.match(print, /rect\.width < 100|rect\.height < 40/, 'Validação deve rejeitar container sem dimensão renderizável.');
assert.match(print, /wrapper\.remove\(\)/, 'Container temporário deve ser removido mesmo quando houver erro.');
assert.doesNotMatch(print, /printHtml\(html, \{ className, title \}\);\s*return \{ mode: 'print-fallback' \}/s, 'Baixar PDF não pode mascarar falha abrindo apenas a impressão.');
assert.match(print, /throw new Error\('Gerador de PDF indisponível no navegador\.'/,
  'Ausência do html2pdf deve ser reportada como erro real.');
assert.match(print, /withRequiredAttribution\(html\)/, 'Conteúdo capturado deve preservar atribuição obrigatória do Flaticon.');

assert.match(index, /pdf-capture\.css/, 'Aplicação deve carregar o CSS exclusivo da captura direta de PDF.');
assert.match(css, /\.pdf-document\.cards-print/, 'CSS de PDF precisa ser isolado da tela e do @media print.');
assert.match(css, /\.card-sheet\.count-2/, 'PDF deve preservar layout 2 por A4.');
assert.match(css, /\.card-sheet\.count-4/, 'PDF deve preservar layout 4 por A4.');
assert.match(css, /\.card-sheet\.count-8/, 'PDF deve preservar layout 8 por A4.');
assert.match(css, /\.card-sheet\.count-12/, 'PDF deve preservar layout 12 por A4.');
assert.match(css, /print-flaticon-attribution/, 'Créditos do Flaticon devem permanecer visíveis no PDF.');

const captureBlock = css.match(/\.pdf-document\.pdf-capture\s*\{([^}]*)\}/)?.[1] || '';
const cardsPrintBlock = css.match(/\.pdf-document\.cards-print\s*\{([^}]*)\}/)?.[1] || '';
assert.ok(captureBlock, 'CSS precisa declarar o container principal de captura.');
assert.ok(cardsPrintBlock, 'CSS precisa declarar o container das carteirinhas no PDF.');
assert.doesNotMatch(captureBlock, /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$)/,
  'Container principal do PDF não pode ser ocultado por CSS.');
assert.doesNotMatch(cardsPrintBlock, /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$)/,
  'Área A4 das carteirinhas não pode ser ocultada por CSS.');

console.log('Contrato de captura direta de PDF OK: container renderizável, imagens validadas, atribuição e grades 2/4/8/12 protegidas.');
