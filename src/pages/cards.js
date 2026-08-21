import { appLayout, mountAppLayout } from '../core/layout.js';
import { openAccessibleDialog } from '../core/a11y.js';
import { cardCategories, cardTemplates, getCardTemplate } from '../data/cards.js';
import { escapeHtml, formatDateBr } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { printHtml, downloadPdf, repeatForSheet } from '../utils/print.js';

export function renderCardsPage() {
  const content = `
    <section class="page-toolbar"><div><p class="eyebrow">Biblioteca</p><h2>Carteirinhas</h2><p>Os campos desta área são temporários e não são gravados no banco.</p></div><label>Buscar modelo<input id="card-search" type="search" placeholder="Ex.: agendamento, busca ativa, indicador"></label></section>
    <div class="filter-row" aria-label="Categorias de carteirinhas">${cardCategories.map((category) => `<button type="button" class="filter-button ${category.id === 'all' ? 'active' : ''}" data-filter="${category.id}" ${category.id === 'all' ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${escapeHtml(category.label)}</button>`).join('')}</div>
    <section id="card-library" class="card-library">${renderLibrary('all', '')}</section>
    <dialog id="card-editor" class="editor-dialog" aria-labelledby="card-editor-title"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Fechar">×</button></form><div id="card-editor-body"></div></dialog>`;
  return appLayout({ title: 'Carteirinhas', subtitle: 'Modelos prontos para situações recorrentes do território.', activePath: '/app/carteirinhas', content });
}

export function mountCardsPage({ root, state }) {
  mountAppLayout(root);
  const library = root.querySelector('#card-library');
  const dialog = root.querySelector('#card-editor');
  const editorBody = root.querySelector('#card-editor-body');
  const search = root.querySelector('#card-search');
  let filter = 'all';

  function refreshLibrary() {
    library.innerHTML = renderLibrary(filter, search.value);
  }

  root.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    root.querySelectorAll('[data-filter]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    refreshLibrary();
  }));
  search.addEventListener('input', refreshLibrary);

  library.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-template]');
    if (!trigger) return;
    const template = getCardTemplate(trigger.dataset.template);
    if (!template) return;
    mountEditor(dialog, editorBody, template, state, trigger);
  });
}

function renderLibrary(filter, query) {
  const q = String(query || '').trim().toLowerCase();
  const rows = cardTemplates.filter((template) => {
    if (filter !== 'all' && template.category !== filter) return false;
    if (!q) return true;
    return [template.title, template.description, categoryLabel(template.category), template.note].filter(Boolean).join(' ').toLowerCase().includes(q);
  });
  if (!rows.length) return '<div class="empty-state"><h3>Nenhum modelo encontrado</h3><p>Altere a busca ou a categoria.</p></div>';
  return rows.map((template) => `
    <article class="template-card"><div><span class="category-label">${escapeHtml(categoryLabel(template.category))}</span><h3>${escapeHtml(template.title)}</h3><p>${escapeHtml(template.description)}</p></div><div class="template-meta"><small>${template.defaultCount}/A4 sugerido</small><button class="button" type="button" data-template="${escapeHtml(template.id)}">Abrir</button></div></article>`).join('');
}

function mountEditor(dialog, body, template, state, opener) {
  body.innerHTML = `
    <header class="editor-header"><div><p class="eyebrow">${escapeHtml(categoryLabel(template.category))}</p><h2 id="card-editor-title">${escapeHtml(template.title)}</h2><p>${escapeHtml(template.description)}</p></div></header>
    <div class="editor-grid">
      <form id="card-form" class="panel stack-form" autocomplete="off">${template.fields.map(renderField).join('')}<button type="reset" class="button">Limpar campos</button></form>
      <section class="panel preview-panel"><div class="preview-controls"><label>Unidades/A4<select id="sheet-count"><option value="2">2</option><option value="4">4</option><option value="8">8</option><option value="12">12 mini</option></select></label><label class="check"><input id="easy-read" type="checkbox"> Leitura fácil</label><label class="check"><input id="economy" type="checkbox"> Econômica</label></div><div id="card-preview"></div><div class="actions"><button type="button" class="button" id="card-pdf">Baixar PDF</button><button type="button" class="button primary" id="card-print">Imprimir A4</button></div><p id="card-action-status" class="form-status" aria-live="polite"></p><p class="privacy-note">Nenhum campo digitado neste gerador é salvo no Supabase. Depois de fechar ou recarregar a página, esses dados não ficam no Território Vivo.</p></section>
    </div>`;
  const form = body.querySelector('#card-form');
  const preview = body.querySelector('#card-preview');
  const count = body.querySelector('#sheet-count');
  const status = body.querySelector('#card-action-status');
  count.value = String(template.defaultCount || 4);

  const currentValues = () => Object.fromEntries(new FormData(form).entries());
  const update = () => {
    preview.innerHTML = buildCardHtml(template, currentValues(), state, options(body));
  };
  form.addEventListener('input', update);
  form.addEventListener('reset', () => setTimeout(update, 0));
  body.querySelector('#easy-read').addEventListener('change', update);
  body.querySelector('#economy').addEventListener('change', update);

  body.querySelector('#card-print').addEventListener('click', () => {
    if (!validateForm(form, status)) return;
    const card = buildCardHtml(template, currentValues(), state, options(body));
    printHtml(repeatForSheet(card, Number(count.value)), { className: 'cards-print', title: template.title });
    status.textContent = 'Janela de impressão aberta.';
    status.dataset.status = 'success';
  });

  body.querySelector('#card-pdf').addEventListener('click', async (event) => {
    if (!validateForm(form, status)) return;
    const button = event.currentTarget;
    setButtonBusy(button, true, 'Gerando PDF…');
    status.textContent = 'Gerando PDF…';
    status.dataset.status = 'info';
    try {
      const card = buildCardHtml(template, currentValues(), state, options(body));
      const result = await downloadPdf(repeatForSheet(card, Number(count.value)), { className: 'cards-print', title: template.title });
      status.textContent = result.mode === 'pdf' ? 'PDF gerado.' : 'Gerador de PDF indisponível; a impressão foi aberta como alternativa.';
      status.dataset.status = result.mode === 'pdf' ? 'success' : 'info';
    } catch (error) {
      console.error(error);
      status.textContent = 'Não foi possível gerar o PDF.';
      status.dataset.status = 'error';
    } finally {
      setButtonBusy(button, false);
    }
  });

  update();
  openAccessibleDialog(dialog, opener);
}

function validateForm(form, status) {
  if (form.reportValidity()) {
    status.textContent = '';
    status.dataset.status = '';
    return true;
  }
  status.textContent = 'Revise os campos obrigatórios antes de imprimir ou baixar.';
  status.dataset.status = 'error';
  return false;
}

function renderField(field) {
  const required = field.required ? 'required' : '';
  if (field.type === 'textarea') return `<label>${escapeHtml(field.label)}<textarea name="${escapeHtml(field.id)}" rows="3" maxlength="1200" ${required}></textarea></label>`;
  if (field.type === 'select') return `<label>${escapeHtml(field.label)}<select name="${escapeHtml(field.id)}" ${required}><option value="">Selecione</option>${field.options.map((option) => `<option>${escapeHtml(option)}</option>`).join('')}</select></label>`;
  if (field.type === 'number') return `<label>${escapeHtml(field.label)}<input name="${escapeHtml(field.id)}" type="number" min="0" inputmode="numeric" ${required}></label>`;
  return `<label>${escapeHtml(field.label)}<input name="${escapeHtml(field.id)}" type="${escapeHtml(field.type || 'text')}" maxlength="240" ${required}></label>`;
}

function buildCardHtml(template, values, state, { easyRead = false, economy = false } = {}) {
  const profile = state.profile || {};
  const context = state.context || {};
  const unit = context.unit?.short_name || profile.unit_name || 'Unidade de saúde';
  const team = context.team?.name || profile.team_name || '';
  const territory = [unit, team, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ');
  const fields = template.fields.map((field) => ({ label: field.label, value: displayValue(field, values[field.id]) })).filter((item) => item.value);
  return `
    <article class="generated-card ${easyRead ? 'easy-read' : ''} ${economy ? 'economy' : ''}">
      <header><span>Território Vivo</span><strong>${escapeHtml(template.title)}</strong></header>
      <div class="generated-card-context"><b>${escapeHtml(territory)}</b>${profile.full_name ? `<span>Referência: ${escapeHtml(profile.full_name)}${profile.acs_phone ? ` • ${escapeHtml(profile.acs_phone)}` : ''}</span>` : ''}</div>
      <div class="generated-card-fields">${fields.length ? fields.map((item) => `<div><small>${escapeHtml(item.label)}</small><p>${escapeHtml(item.value).replace(/\n/g, '<br>')}</p></div>`).join('') : '<p class="placeholder-copy">Preencha os campos ao lado para montar a carteirinha.</p>'}</div>
      <footer>${escapeHtml(template.note || '')}</footer>
    </article>`;
}

function displayValue(field, raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  if (field.type === 'date') return formatDateBr(raw);
  return String(raw);
}

function options(body) {
  return { easyRead: body.querySelector('#easy-read').checked, economy: body.querySelector('#economy').checked };
}

function categoryLabel(category) {
  return ({ family: 'Família', territory: 'Território', meeting: '5 minutos', indicator: 'Indicadores', management: 'Gestão' })[category] || category;
}
