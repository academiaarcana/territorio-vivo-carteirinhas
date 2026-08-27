import { appLayout, mountAppLayout } from '../core/layout.js';
import { openAccessibleDialog } from '../core/a11y.js';
import { educationResources, educationTopics, getEducationTopic } from '../data/education.js';
import { escapeHtml, formatDateBr, setStatus } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { printAccessibilityClasses, readPrintAccessibilityOptions, renderPrintAccessibilityOptions } from '../lib/print-accessibility.js';
import { renderFlaticonIcon, renderVisualSupports } from '../lib/visual-support.js';
import { printHtml, downloadPdf } from '../utils/print.js';

export function renderEducationPage() {
  const content = `
    <section class="panel education-intro-panel"><div class="education-intro-icon">${renderFlaticonIcon('document')}</div><div><p class="eyebrow">Educação em saúde</p><h2>Orientação clara para apoiar conversas e cuidado.</h2><p>Use materiais internos revisáveis para imprimir e consulte ferramentas externas identificadas quando elas ajudarem o trabalho da equipe.</p></div><div class="education-intro-metrics" aria-label="Recursos disponíveis"><span><strong>${educationTopics.length}</strong><small>materiais internos</small></span><span><strong>${educationResources.length}</strong><small>ferramentas externas</small></span></div></section>
    <section class="panel education-registration-callout" aria-labelledby="education-registration-heading"><div class="education-registration-icon">${renderFlaticonIcon('person')}</div><div><p class="eyebrow">Novo guia da equipe</p><h2 id="education-registration-heading">Como preencher o cadastro</h2><p>Consulte as etapas do e-SUS Território e veja como perguntar sobre orientação sexual, identidade de gênero e nome social sem fazer suposições.</p></div><button class="button primary" type="button" data-nav="/app/guia-cadastro">Abrir guia de cadastro</button></section>
    <section class="panel education-library-panel" aria-labelledby="education-materials-heading"><header class="education-section-heading"><div><p class="eyebrow">Materiais da equipe</p><h2 id="education-materials-heading">Conteúdos curtos e imprimíveis</h2><p>Separados das regras da aplicação para facilitar revisão técnica, impressão e uso com apoio visual.</p></div></header><section class="education-grid field-education-grid">${educationTopics.map((topic) => `<article class="education-card field-education-card" data-education-topic="${escapeHtml(topic.id)}"><header>${renderFlaticonIcon(topic.id === 'pressure' ? 'hypertension' : 'diabetes', { className: 'education-card-icon' })}<span class="category-label">${escapeHtml(topic.category)}</span></header><h3>${escapeHtml(topic.title)}</h3><p>${escapeHtml(topic.summary)}</p><div class="education-card-meta"><small>Revisado ${formatDateBr(topic.reviewedOn)}</small><button class="button" type="button" data-topic="${topic.id}">Abrir material</button></div></article>`).join('')}</section></section>
    <section class="panel education-resources-panel" aria-labelledby="education-resources-heading"><header class="education-section-heading"><div><p class="eyebrow">Ferramentas externas</p><h2 id="education-resources-heading">Apoios complementares para profissionais</h2><p>Os recursos abaixo abrem em outro site e mantêm responsabilidade, conteúdo e políticas próprias.</p></div><span class="education-external-badge">2 recursos identificados</span></header><div class="education-resource-list">${educationResources.map((resource) => `<article class="education-resource-card"><div class="education-resource-icon">${renderFlaticonIcon(resource.icon)}</div><div><span class="category-label">${escapeHtml(resource.category)}</span><h3>${escapeHtml(resource.title)}</h3><p>${escapeHtml(resource.summary)}</p></div><a class="button education-resource-link" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">Acessar ferramenta <span aria-hidden="true">↗</span></a></article>`).join('')}</div><p class="field-hint education-external-note"><strong>Importante:</strong> ferramentas externas não integram prontuários, contas ou dados do Território Vivo.</p></section>
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
    const build = () => renderTopicPrint(topic, state, readPrintAccessibilityOptions(body, 'education'));
    body.querySelector('[data-print-topic]').addEventListener('click', () => {
      printHtml(build(), { title: topic.title, className: 'education-print' });
      setStatus(status, 'Janela de impressão aberta.', 'success');
    });
    body.querySelector('[data-pdf-topic]').addEventListener('click', async (event) => {
      const pdfButton = event.currentTarget;
      if (pdfButton.disabled) return;
      setButtonBusy(pdfButton, true, 'Gerando PDF…');
      setStatus(status, 'Gerando PDF…', 'info');
      try {
        const result = await downloadPdf(build(), { title: topic.title, className: 'education-print' });
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
  return `<article class="education-detail field-education-detail"><header class="education-detail-heading"><p class="eyebrow">${escapeHtml(topic.category)}</p><h2 id="education-dialog-title">${escapeHtml(topic.title)}</h2><p>${escapeHtml(topic.summary)}</p><small>Revisão técnica: ${formatDateBr(topic.reviewedOn)}</small></header><div class="education-detail-blocks">${topic.blocks.map((block, index) => `<section><header><span>${index + 1}</span><h3>${escapeHtml(block.title)}</h3></header><ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`).join('')}</div><p class="clinical-disclaimer">${escapeHtml(topic.disclaimer)}</p><section class="education-sources"><h3>Fontes registradas</h3><ul class="source-list">${topic.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`).join('')}</ul></section><section class="education-output-section" aria-labelledby="education-output-heading"><header><p class="eyebrow">Saída para orientação</p><h3 id="education-output-heading">Prepare o material</h3></header>${renderPrintAccessibilityOptions('education')}<div class="actions education-output-actions"><button class="button" type="button" data-pdf-topic>Baixar PDF</button><button class="button primary" type="button" data-print-topic>Imprimir material</button></div><p class="form-status" data-topic-status aria-live="polite"></p></section></article>`;
}

function renderTopicPrint(topic, state, options = {}) {
  const profile = state.profile || {};
  const context = state.context || {};
  const heading = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name].filter(Boolean).join(' • ');
  const classes = printAccessibilityClasses(options);
  const topicSupport = options.visualSupport ? renderVisualSupports({ label: topic.category, value: `${topic.title} ${topic.category}` }, { max: 2 }) : '';
  return `<article class="education-print-sheet ${classes}"><header><strong>Território Vivo${heading ? ` • ${escapeHtml(heading)}` : ''}</strong><span>Material educativo • revisão ${formatDateBr(topic.reviewedOn)}</span></header><div class="${topicSupport ? 'print-field-with-support' : ''}">${topicSupport}<div><h1>${escapeHtml(topic.title)}</h1><p>${escapeHtml(topic.summary)}</p></div></div>${topic.blocks.map((block) => renderEducationBlock(block, options)).join('')}<p><strong>${escapeHtml(topic.disclaimer)}</strong></p><footer>Fontes: ${topic.sources.map((source) => escapeHtml(source.label)).join(' • ')}</footer></article>`;
}

function renderEducationBlock(block, options) {
  const blockSupport = options.visualSupport ? renderVisualSupports({ label: block.title, value: block.title }, { max: 1 }) : '';
  const listClass = options.visualSupport ? 'education-visual-list' : '';
  return `<section><div class="${blockSupport ? 'print-field-with-support' : ''}">${blockSupport}<h2>${escapeHtml(block.title)}</h2></div><ul class="${listClass}">${block.items.map((item) => {
    const support = options.visualSupport ? renderVisualSupports({ value: item }, { max: 2 }) : '';
    return `<li class="${support ? 'print-step-with-support' : ''}">${support}<span>${escapeHtml(item)}</span></li>`;
  }).join('')}</ul></section>`;
}
