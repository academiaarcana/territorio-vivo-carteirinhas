import { slugify } from '../lib/dom.js';
import { hasFlaticonVisualSupport, renderFlaticonAttribution } from '../lib/visual-support.js';
import { assertCanvasHasContent } from './pdf-canvas.js';
import { assertCanvasAspect, assertFourUpGeometry, assertNoBoxOverflow, assertRectsInside } from './pdf-geometry.js';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_GEOMETRY_TOLERANCE_PX = 2;

export function printHtml(html, { className = '', title = 'Território Vivo' } = {}) {
  const root = ensurePrintRoot();
  const previousTitle = document.title;
  const printable = withRequiredAttribution(html);
  root.innerHTML = `<section class="print-document ${className}">${printable}</section>`;
  document.title = title;

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    root.innerHTML = '';
    document.title = previousTitle;
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup, { once: true });
  requestAnimationFrame(async () => {
    await waitForImages(root);
    window.print();
    setTimeout(cleanup, 5000);
  });
}

export async function downloadPdf(html, { className = '', title = 'Território Vivo', filename = null, margin = 8 } = {}) {
  if (!window.html2pdf) {
    throw new Error('Gerador de PDF indisponível no navegador.');
  }

  const safeMargin = Number.isFinite(Number(margin)) ? Math.max(0, Number(margin)) : 8;
  const captureWidthMm = A4_WIDTH_MM - (safeMargin * 2);
  const captureHeightMm = A4_HEIGHT_MM - (safeMargin * 2);
  if (captureWidthMm <= 0 || captureHeightMm <= 0) {
    throw new Error('Margem inválida para uma página A4.');
  }

  const host = createPdfCaptureHost(captureWidthMm, captureHeightMm);
  const wrapper = document.createElement('section');
  wrapper.className = `pdf-document pdf-capture ${className}`.trim();
  wrapper.innerHTML = withRequiredAttribution(html);
  const isCardsPdf = wrapper.classList.contains('cards-print');
  wrapper.style.position = 'relative';
  wrapper.style.left = 'auto';
  wrapper.style.top = 'auto';
  wrapper.style.zIndex = 'auto';
  wrapper.style.width = `${captureWidthMm}mm`;
  if (isCardsPdf) wrapper.style.height = `${captureHeightMm}mm`;
  wrapper.style.maxWidth = 'none';
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.background = '#fff';
  wrapper.style.color = '#000';
  wrapper.style.pointerEvents = 'none';
  wrapper.setAttribute('aria-hidden', 'true');
  host.appendChild(wrapper);
  document.body.appendChild(host);

  try {
    await nextPaint();
    await waitForImages(wrapper, { strict: true });
    await nextPaint();
    assertPdfCaptureReady(wrapper, { stage: 'source' });

    const captureRect = wrapper.getBoundingClientRect();
    const captureWidth = Math.ceil(captureRect.width);
    const captureHeight = Math.ceil(captureRect.height);
    if (captureWidth < 100 || captureHeight < 100) {
      throw new Error('Área temporária do PDF ficou sem dimensão para captura.');
    }

    const pagebreak = isCardsPdf
      ? { mode: [], before: [], after: [], avoid: [] }
      : { mode: ['css', 'legacy'] };

    const worker = window.html2pdf().set({
      margin: safeMargin,
      filename: filename || `${slugify(title)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        windowHeight: captureHeight
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak
    }).from(wrapper).toContainer();

    const html2pdfContainer = await worker.get('container');
    const clonedWrapper = html2pdfContainer?.firstElementChild;
    if (!clonedWrapper) {
      throw new Error('O html2pdf não criou uma área interna válida para captura.');
    }
    assertPdfCaptureReady(clonedWrapper, { stage: 'html2pdf-container' });

    await worker.toCanvas();
    const canvas = await worker.get('canvas');
    assertCanvasHasContent(canvas);
    if (isCardsPdf) assertCanvasAspect(canvas, captureWidth, captureHeight);
    await worker.toPdf().save();
    return { mode: 'pdf' };
  } finally {
    host.remove();
  }
}

export function cardsForSheet(cardHtmlList, count = 4) {
  const numeric = Number(count);
  const safeCount = [2, 4, 8, 12].includes(numeric) ? numeric : 4;
  const cards = Array.isArray(cardHtmlList) ? cardHtmlList.slice(0, safeCount) : [];
  return `<div class="card-sheet count-${safeCount}">${Array.from({ length: safeCount }, (_, index) => `<div class="sheet-slot">${cards[index] || ''}</div>`).join('')}</div>`;
}

export function repeatForSheet(cardHtml, count = 4) {
  const numeric = Number(count);
  const safeCount = [2, 4, 8, 12].includes(numeric) ? numeric : 4;
  return cardsForSheet(Array.from({ length: safeCount }, () => cardHtml), safeCount);
}

function withRequiredAttribution(html) {
  const source = String(html || '');
  if (!hasFlaticonVisualSupport(source)) return source;
  return `${source}${renderFlaticonAttribution({ className: 'print-flaticon-attribution' })}`;
}

async function waitForImages(root, { timeoutMs = 3500, strict = false } = {}) {
  const images = [...root.querySelectorAll('img')];
  if (!images.length) return;

  const pending = images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      const finish = () => resolve();
      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', finish, { once: true });
    });
  });

  await Promise.race([
    Promise.all(pending),
    new Promise((resolve) => setTimeout(resolve, timeoutMs))
  ]);

  if (strict) {
    const failed = images.filter((image) => !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0);
    if (failed.length) {
      throw new Error('Não foi possível carregar todos os pictogramas antes de gerar o PDF.');
    }
  }
}

function assertPdfCaptureReady(wrapper, { stage = 'source' } = {}) {
  if (!wrapper.isConnected) throw new Error('Área temporária do PDF não está conectada ao documento.');

  const style = window.getComputedStyle(wrapper);
  const rect = wrapper.getBoundingClientRect();
  const hasContent = Boolean(wrapper.textContent.trim() || wrapper.querySelector('img, svg, canvas'));
  const numericZIndex = Number.parseInt(style.zIndex, 10);

  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    throw new Error('Área temporária do PDF está oculta e não pode ser capturada.');
  }
  if (Number.isFinite(numericZIndex) && numericZIndex < 0) {
    throw new Error('Área temporária do PDF está atrás do plano de captura.');
  }
  if (!hasContent || rect.width < 100 || rect.height < 40) {
    throw new Error('Área temporária do PDF não possui conteúdo renderizável.');
  }

  assertNoBoxOverflow(wrapper, `Área temporária do PDF (${stage})`, { tolerance: PDF_GEOMETRY_TOLERANCE_PX });

  const cardSheet = wrapper.querySelector('.card-sheet');
  if (!cardSheet) return;

  const sheetRect = cardSheet.getBoundingClientRect();
  const slots = [...cardSheet.querySelectorAll('.sheet-slot')];
  const cards = [...cardSheet.querySelectorAll('.generated-card')];
  const countClass = [...cardSheet.classList].find((name) => /^count-(2|4|8|12)$/.test(name));
  const expectedCount = countClass ? Number(countClass.replace('count-', '')) : null;
  const slotRects = slots.map((slot) => slot.getBoundingClientRect());
  const cardRects = cards.map((card) => card.getBoundingClientRect());
  const populated = slots.every((slot) => slot.textContent.trim() || slot.querySelector('img, svg, canvas'));
  const slotsVisible = slotRects.every((slotRect) => slotRect.width >= 20 && slotRect.height >= 20);
  const cardsVisible = cardRects.every((cardRect) => cardRect.width >= 20 && cardRect.height >= 20);

  if (!slots.length || !cards.length || !populated || sheetRect.width < 100 || sheetRect.height < 100) {
    throw new Error('Folha de carteirinhas não está pronta para captura em PDF.');
  }
  if (expectedCount && (slots.length !== expectedCount || cards.length !== expectedCount)) {
    throw new Error(`Folha de carteirinhas esperava ${expectedCount} itens antes da captura do PDF.`);
  }
  if (!slotsVisible || !cardsVisible) {
    throw new Error('Uma ou mais carteirinhas ficaram sem dimensão antes da captura do PDF.');
  }

  assertNoBoxOverflow(cardSheet, `Folha de carteirinhas (${stage})`, { tolerance: PDF_GEOMETRY_TOLERANCE_PX });
  assertRectsInside(sheetRect, slotRects, `Slots da folha (${stage})`, { tolerance: PDF_GEOMETRY_TOLERANCE_PX });
  assertRectsInside(sheetRect, cardRects, `Carteirinhas da folha (${stage})`, { tolerance: PDF_GEOMETRY_TOLERANCE_PX });

  slots.forEach((slot, index) => {
    const card = cards[index];
    assertNoBoxOverflow(slot, `Espaço da carteirinha ${index + 1} (${stage})`, { tolerance: PDF_GEOMETRY_TOLERANCE_PX });
    if (card) {
      assertRectsInside(slotRects[index], [cardRects[index]], `Carteirinha ${index + 1} (${stage})`, { tolerance: PDF_GEOMETRY_TOLERANCE_PX });
    }
  });

  if (expectedCount === 4) {
    assertFourUpGeometry(slotRects, sheetRect, { tolerance: PDF_GEOMETRY_TOLERANCE_PX });
  }
}

function createPdfCaptureHost(captureWidthMm, captureHeightMm) {
  const host = document.createElement('div');
  host.className = 'pdf-capture-host';
  host.style.position = 'fixed';
  host.style.left = '0';
  host.style.top = '0';
  host.style.width = `${captureWidthMm}mm`;
  host.style.height = `${captureHeightMm}mm`;
  host.style.maxWidth = 'none';
  host.style.background = '#fff';
  host.style.pointerEvents = 'none';
  host.style.overflow = 'visible';
  host.style.zIndex = '2147483646';
  host.setAttribute('aria-hidden', 'true');
  return host;
}

function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function ensurePrintRoot() {
  let root = document.querySelector('#print-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'print-root';
    root.setAttribute('aria-hidden', 'true');
    document.body.appendChild(root);
  }
  return root;
}
