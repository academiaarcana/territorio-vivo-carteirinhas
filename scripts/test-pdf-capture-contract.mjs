import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assertCanvasHasContent, inspectCanvasContent } from '../src/utils/pdf-canvas.js';

const print = fs.readFileSync('src/utils/print.js', 'utf8');
const canvasUtil = fs.readFileSync('src/utils/pdf-canvas.js', 'utf8');
const css = fs.readFileSync('src/styles/pdf-capture.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

function fakeCanvas(width, height, paint = () => {}) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    data[index + 3] = 255;
  }
  const setPixel = (x, y, red = 0, green = 0, blue = 0, alpha = 255) => {
    const offset = ((y * width) + x) * 4;
    data[offset] = red;
    data[offset + 1] = green;
    data[offset + 2] = blue;
    data[offset + 3] = alpha;
  };
  paint({ setPixel, width, height, data });
  return {
    width,
    height,
    getContext: () => ({ getImageData: () => ({ data }) })
  };
}

const blankCanvas = fakeCanvas(120, 80);
const blankStats = inspectCanvasContent(blankCanvas, { maxSamples: 10000 });
assert.equal(blankStats.blank, true, 'Canvas totalmente branco precisa ser detectado como vazio.');
assert.throws(
  () => assertCanvasHasContent(blankCanvas),
  (error) => error?.code === 'PDF_EMPTY_CANVAS',
  'PDF branco deve abortar antes de chegar ao jsPDF.'
);

const contentCanvas = fakeCanvas(120, 80, ({ setPixel }) => {
  for (let y = 18; y < 62; y += 1) {
    for (let x = 22; x < 98; x += 1) {
      if (x === 22 || x === 97 || y === 18 || y === 61 || (y % 9 === 0 && x % 3 === 0)) setPixel(x, y);
    }
  }
});
const contentStats = inspectCanvasContent(contentCanvas, { maxSamples: 10000 });
assert.equal(contentStats.blank, false, 'Canvas com bordas e texto simulado precisa ser reconhecido como conteúdo.');
assert.doesNotThrow(() => assertCanvasHasContent(contentCanvas));

const transparentCanvas = fakeCanvas(60, 40, ({ data }) => {
  for (let index = 3; index < data.length; index += 4) data[index] = 0;
});
assert.equal(inspectCanvasContent(transparentCanvas).blank, true, 'Canvas transparente também deve ser tratado como vazio.');

assert.match(print, /const A4_WIDTH_MM = 210;/, 'PDF precisa declarar a largura física A4 como fonte de verdade.');
assert.match(print, /const A4_HEIGHT_MM = 297;/, 'PDF precisa declarar a altura física A4 como fonte de verdade.');
assert.match(print, /captureWidthMm = A4_WIDTH_MM - \(safeMargin \* 2\)/, 'Largura útil deve descontar a margem exatamente uma vez.');
assert.match(print, /captureHeightMm = A4_HEIGHT_MM - \(safeMargin \* 2\)/, 'Altura útil deve descontar a margem exatamente uma vez.');
assert.match(print, /pdf-document pdf-capture/, 'PDF deve usar um container temporário explicitamente renderizável.');
assert.match(print, /createPdfCaptureHost\(captureWidthMm\)/, 'PDF deve usar um host de captura separado do elemento entregue ao html2pdf.');
assert.match(print, /wrapper\.style\.position\s*=\s*['"]relative['"]/, 'Elemento entregue ao html2pdf não deve permanecer fixed no clone interno.');
assert.match(print, /wrapper\.style\.zIndex\s*=\s*['"]auto['"]/, 'Elemento entregue ao html2pdf deve usar plano normal de empilhamento.');
assert.match(print, /host\.style\.zIndex\s*=\s*['"]2147483646['"]/, 'Host temporário deve ficar em plano visível durante a captura.');
assert.doesNotMatch(print, /zIndex\s*=\s*['"]-1['"]/, 'Captura direta não pode voltar a usar z-index negativo.');
assert.doesNotMatch(print, /left\s*=\s*['"]-200vw['"]/, 'Captura do PDF não pode voltar a posicionar conteúdo fora da viewport.');
assert.doesNotMatch(print, /Math\.max\(window\.innerWidth|\b1024\b/, 'Captura não pode usar largura do monitor nem mínimo arbitrário de 1024px.');
assert.match(print, /const captureRect = wrapper\.getBoundingClientRect\(\)/, 'Viewport de captura precisa ser derivada do próprio wrapper.');
assert.match(print, /windowWidth: captureWidth/, 'html2canvas precisa usar a largura real do wrapper como viewport.');
assert.match(print, /width: captureWidth/, 'Canvas precisa limitar a captura à largura útil medida.');
assert.match(print, /x: 0/, 'Captura deve começar na origem horizontal.');
assert.match(print, /scrollX: 0/, 'Captura não pode herdar deslocamento horizontal da tela.');
assert.match(print, /waitForImages\(wrapper, \{ strict: true \}\)/, 'PDF deve aguardar pictogramas e tratar falha de carregamento.');
assert.match(print, /naturalWidth <= 0|naturalHeight <= 0/, 'Falha real de imagem deve ser detectada antes da captura.');
assert.match(print, /assertPdfCaptureReady\(wrapper\)/, 'PDF deve validar o DOM antes de chamar html2pdf.');
assert.match(print, /assertNoHorizontalOverflow\(wrapper/, 'Wrapper deve rejeitar overflow horizontal antes da captura.');
assert.match(print, /assertNoHorizontalOverflow\(cardSheet/, 'Folha deve rejeitar overflow horizontal antes da captura.');
assert.match(print, /slots\.forEach\(\(slot\) => assertNoHorizontalOverflow/, 'Slots devem rejeitar overflow horizontal.');
assert.match(print, /cards\.forEach\(\(card\) => assertNoHorizontalOverflow/, 'Carteirinhas devem rejeitar overflow horizontal.');
assert.match(print, /PDF_HORIZONTAL_OVERFLOW/, 'Overflow horizontal precisa produzir erro identificável.');
assert.match(print, /O conteúdo não coube corretamente na página A4/, 'Erro de overflow deve ser compreensível.');
assert.match(print, /cardsInsideSheet/, 'Validação deve confirmar que os cards permanecem dentro da folha.');
assert.match(print, /slotRects/, 'Validação precisa medir os slots da folha, não somente o wrapper.');
assert.match(print, /cardRects/, 'Validação precisa medir as carteirinhas, não somente o wrapper.');
assert.match(print, /expectedCount/, 'Validação precisa conferir a quantidade real 2/4/8/12 antes da captura.');
assert.match(print, /\.from\(wrapper\)\.toCanvas\(\)/, 'Pipeline deve parar no canvas antes de criar o PDF.');
assert.match(print, /await worker\.get\(['"]canvas['"]\)/, 'Pipeline deve obter o canvas intermediário real do Worker.');
assert.match(print, /assertCanvasHasContent\(canvas\)/, 'Canvas intermediário precisa ser validado contra página branca.');
assert.match(print, /await worker\.toPdf\(\)\.save\(\)/, 'jsPDF só pode executar depois da validação do canvas.');
assert.match(print, /host\.remove\(\)/, 'Host e conteúdo temporários devem ser removidos no finally.');
assert.match(print, /withRequiredAttribution\(html\)/, 'Conteúdo capturado deve preservar atribuição obrigatória do Flaticon.');
assert.match(print, /export function printHtml/, 'Fluxo de impressão pelo navegador deve continuar separado.');
assert.match(print, /window\.print\(\)/, 'Imprimir A4 deve continuar usando a impressão nativa.');
assert.doesNotMatch(print, /printHtml\(html, \{ className, title \}\)/, 'Baixar PDF não pode mascarar falha abrindo a impressão.');

assert.match(canvasUtil, /getImageData/, 'Detector deve inspecionar pixels reais do canvas.');
assert.match(canvasUtil, /PDF_EMPTY_CANVAS/, 'Canvas vazio precisa produzir erro identificável.');
assert.match(canvasUtil, /A captura do PDF ficou vazia/, 'Erro de canvas vazio deve ser compreensível para a interface.');

assert.match(index, /pdf-capture\.css/, 'Aplicação deve carregar o CSS exclusivo da captura direta de PDF.');
assert.ok(index.indexOf('pdf-capture.css') > index.indexOf('card-collection.css'), 'CSS de captura precisa carregar depois do visual das carteirinhas.');
assert.match(css, /\.pdf-document\.cards-print/, 'CSS de PDF precisa ser isolado da tela e do @media print.');
assert.doesNotMatch(css, /width\s*:\s*194mm|height\s*:\s*281mm/, 'CSS não pode duplicar a área útil A4 com dimensões rígidas além do cálculo do JS.');
assert.match(css, /\.card-sheet\.count-2\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,[\s\S]*?grid-template-rows:\s*1fr/, '2/A4 deve permanecer 2 × 1.');
assert.match(css, /\.card-sheet\.count-4\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,[\s\S]*?grid-template-rows:\s*repeat\(2,/, '4/A4 deve permanecer 2 × 2.');
assert.match(css, /\.card-sheet\.count-8\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,[\s\S]*?grid-template-rows:\s*repeat\(4,/, '8/A4 deve permanecer 2 × 4.');
assert.match(css, /\.card-sheet\.count-12\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,[\s\S]*?grid-template-rows:\s*repeat\(4,/, '12/A4 deve permanecer 3 × 4.');
assert.match(css, /\.sheet-slot\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0;/, 'Cada slot deve caber integralmente na coluna da grade.');
assert.match(css, /\.generated-card\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%;[\s\S]*?min-width:\s*0!important;/, 'Cada carteirinha deve respeitar integralmente a largura do slot.');
assert.match(css, /overflow-wrap:\s*anywhere/, 'Textos longos não podem expandir horizontalmente a grade do PDF.');
assert.match(css, /print-flaticon-attribution/, 'Créditos do Flaticon devem permanecer visíveis no PDF.');

const captureBlock = css.match(/\.pdf-document\.pdf-capture\s*\{([^}]*)\}/)?.[1] || '';
const cardsPrintBlock = css.match(/\.pdf-document\.cards-print\s*\{([^}]*)\}/)?.[1] || '';
assert.ok(captureBlock, 'CSS precisa declarar o container principal de captura.');
assert.ok(cardsPrintBlock, 'CSS precisa declarar o container das carteirinhas no PDF.');
assert.doesNotMatch(captureBlock, /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$)/,
  'Container principal do PDF não pode ser ocultado por CSS.');
assert.doesNotMatch(cardsPrintBlock, /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\D|$)/,
  'Área A4 das carteirinhas não pode ser ocultada por CSS.');

console.log('Contrato de PDF OK: canvas validado, viewport alinhada à área A4, overflow rejeitado e grades 2/4/8/12 protegidas.');
