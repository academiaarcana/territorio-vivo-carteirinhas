import { slugify } from '../lib/dom.js';

export function printHtml(html, { className = '', title = 'Território Vivo' } = {}) {
  const root = ensurePrintRoot();
  root.innerHTML = `<section class="print-document ${className}">${html}</section>`;
  const previousTitle = document.title;
  document.title = title;
  requestAnimationFrame(() => {
    window.print();
    setTimeout(() => {
      root.innerHTML = '';
      document.title = previousTitle;
    }, 400);
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
  document.body.appendChild(wrapper);
  try {
    await window.html2pdf().set({
      margin,
      filename: filename || `${slugify(title)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(wrapper).save();
  } finally {
    wrapper.remove();
  }
}

export function repeatForSheet(cardHtml, count = 4) {
  const safeCount = [2, 4, 8].includes(Number(count)) ? Number(count) : 4;
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
