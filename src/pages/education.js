import { appLayout, mountAppLayout } from '../core/layout.js';
import { openAccessibleDialog } from '../core/a11y.js';
import { educationTopics, getEducationTopic } from '../data/education.js';
import { escapeHtml, formatDateBr, setStatus } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { printHtml, downloadPdf } from '../utils/print.js';

export function renderEducationPage() {
  const content = `
    <section class="page-toolbar"><div><p class="eyebrow">Materiais de apoio</p><h2>Educação em saúde</h2><p>Conteúdos curtos, imprimíveis e separados das regras da aplicação para facilitar revisão técnica.</p></div></section>
    <section class="education-grid">${educationTopics.map((topic) => `<article class="education-card"><span class="category-label">${escapeHtml(topic.category)}</span><h3>${escapeHtml(topic.title)}</h3><p>${escapeHtml(topic.summary)}</p><small>Revisado ${formatDateBr(topic.reviewedOn)}</small><button class="button" type="button" data-topic="${topic.id}">Abrir</button></article>`).join('')}</section>
    <dialog id="education-dialog" class="editor-dialog" aria-labelledby="education-dialog-title"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Fechar">×</button></form><div id="education-body"></div></dialog>`;
  return appLayout({ title: 'Educação em saúde', subtitle: 'Materiais educativos com fontes registradas.', activePath: '/app/educacao', content });
}

export function mountEducationPage({ root, state }) {
  mountAppLayout(root);
  const dialog = root.querySelector('#education-dialog');
  const body = root.querySelector('#education-body');
  root.querySelectorAll('[data-topic]').forEach((button) => button.addEventListener('click', () => {
    const topic = getEducationTopic(button.dataset.topic);
    if (!topic) return;
    body.innerHTML = renderTopic(topic);
    const status = body.querySelector('[data-topic-status]');
    body.querySelector('[data-print-topic]').addEventListener('click', () => {
      printHtml(renderTopicPrint(topic, state), { title: topic.title, className: 'education-print' });
      setStatus(status, 'Janela de impressão aberta.', 'success');
    });
    body.querySelector('[data-pdf-topic]').addEventListener('click', async (event) => {
      const pdfButton = event.currentTarget;
      if (pdfButton.disabled) return;
      setButtonBusy(pdfButton, true, 'Gerando PDF…');
      setStatus(status, 'Gerando PDF…', 'info');
      try {
        const result = await downloadPdf(renderTopicPrint(topic, state), { title: topic.title, className: 'education-print' });
        setStatus(status, result.mode === 'pdf' ? 'PDF gerado.' : 'Gerador de PDF indisponível; a impressão foi aberta como alternativa.', result.mode === 'pdf' ? 'success' : 'info');
      } catch (error) {
        console.error(error);
        setStatus(status, 'Não foi possível gerar o PDF.', 'error');
      } finally {
        setButtonBusy(pdfButton, false);
      }
    });
    openAccessibleDialog(dialog, button);
  }));
}

function renderTopic(topic) {
  return `<article class="education-detail"><header><p class="eyebrow">${escapeHtml(topic.category)}</p><h2 id="education-dialog-title">${escapeHtml(topic.title)}</h2><p>${escapeHtml(topic.summary)}</p></header>${topic.blocks.map((block) => `<section><h3>${escapeHtml(block.title)}</h3><ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`).join('')}<p class="clinical-disclaimer">${escapeHtml(topic.disclaimer)}</p><section><h3>Fontes</h3><ul class="source-list">${topic.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`).join('')}</ul></section><div class="actions"><button class="button primary" type="button" data-print-topic>Imprimir</button><button class="button" type="button" data-pdf-topic>Baixar PDF</button></div><p class="form-status" data-topic-status aria-live="polite"></p></article>`;
}

function renderTopicPrint(topic, state) {
  const profile = state.profile || {};
  const context = state.context || {};
  const heading = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name].filter(Boolean).join(' • ');
  return `<article class="education-print-sheet"><header><strong>Território Vivo${heading ? ` • ${escapeHtml(heading)}` : ''}</strong><span>Material educativo • revisão ${formatDateBr(topic.reviewedOn)}</span></header><h1>${escapeHtml(topic.title)}</h1><p>${escapeHtml(topic.summary)}</p>${topic.blocks.map((block) => `<section><h2>${escapeHtml(block.title)}</h2><ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`).join('')}<p><strong>${escapeHtml(topic.disclaimer)}</strong></p><footer>Fontes: ${topic.sources.map((source) => escapeHtml(source.label)).join(' • ')}</footer></article>`;
}
