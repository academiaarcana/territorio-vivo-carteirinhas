import { slugify } from '../lib/dom.js';

export function printHtml(html, { className = '', title = 'Território Vivo' } = {}) {
  const root = ensurePrintRoot();
  const previousTitle = document.title;
  root.innerHTML = `<section class="print-document ${className}">${html}</section>`;
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
  requestAnimationFrame(() => {
    window.print();
    setTimeout(cleanup, 5000);
  });
}

export async function downloadPdf(html, { className = '', title = 'Território Vivo', filename = null, margin = 8 } = {}) {
  if (!window.html2pdf) {
    printHtml(html, { className, title });
    return;
  }
  const wrapper = document.createElement('section');
  wrapper.className = `pdf-document ${className}`;
  wrapper.innerHTML = html;
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-200vw';
  wrapper.style.top = '0';
  wrapper.style.width = '210mm';
  wrapper.setAttribute('aria-hidden', 'true');
  document.body.appendChild(wrapper);
  try {
    await window.html2pdf().set({
      margin,
      filename: filename || `${slugify(title)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(wrapper).save();
  } finally {
    wrapper.remove();
  }
}

export function repeatForSheet(cardHtml, count = 4) {
  const numeric = Number(count);
  const safeCount = [2, 4, 8, 12].includes(numeric) ? numeric : 4;
  return `<div class="card-sheet count-${safeCount}">${Array.from({ length: safeCount }, () => `<div class="sheet-slot">${cardHtml}</div>`).join('')}</div>`;
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
