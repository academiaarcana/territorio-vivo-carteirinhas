import { slugify } from '../lib/dom.js';
import { hasFlaticonVisualSupport, renderFlaticonAttribution } from '../lib/visual-support.js';

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
    printHtml(html, { className, title });
    return { mode: 'print-fallback' };
  }
  const wrapper = document.createElement('section');
  wrapper.className = `pdf-document ${className}`;
  wrapper.innerHTML = withRequiredAttribution(html);
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-200vw';
  wrapper.style.top = '0';
  wrapper.style.width = '210mm';
  wrapper.setAttribute('aria-hidden', 'true');
  document.body.appendChild(wrapper);
  try {
    await waitForImages(wrapper);
    await window.html2pdf().set({
      margin,
      filename: filename || `${slugify(title)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(wrapper).save();
    return { mode: 'pdf' };
  } finally {
    wrapper.remove();
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

async function waitForImages(root, timeoutMs = 3500) {
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
