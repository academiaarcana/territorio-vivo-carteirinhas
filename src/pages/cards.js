import { appLayout, mountAppLayout } from '../core/layout.js';
import { cardCategories, cardTemplates, getCardTemplate } from '../data/cards.js';
import { escapeHtml } from '../lib/dom.js';
import { printHtml, downloadPdf, repeatForSheet } from '../utils/print.js';

export function renderCardsPage() {
  const content = `
    <section class="page-toolbar"><div><p class="eyebrow">Biblioteca</p><h2>Carteirinhas</h2><p>Os campos desta área são temporários e não são gravados no banco.</p></div></section>
    <div class="filter-row">${cardCategories.map((category) => `<button type="button" class="filter-button ${category.id === 'all' ? 'active' : ''}" data-filter="${category.id}">${escapeHtml(category.label)}</button>`).join('')}</div>
    <section id="card-library" class="card-library">${renderLibrary('all')}</section>
    <dialog id="card-editor" class="editor-dialog"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Fechar">×</button></form><div id="card-editor-body"></div></dialog>`;
  return appLayout({ title: 'Carteirinhas', subtitle: 'Modelos prontos para situações recorrentes do território.', activePath: '/app/carteirinhas', content });
}

export function mountCardsPage({ root, state }) {
  mountAppLayout(root);
  const library = root.querySelector('#card-library');
  const dialog = root.querySelector('#card-editor');
  const editorBody = root.querySelector('#card-editor-body');
  root.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    root.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
    library.innerHTML = renderLibrary(button.dataset.filter);
  }));
  library.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-template]');
    if (!trigger) return;
    const template = getCardTemplate(trigger.dataset.template);
    if (!template) return;
    mountEditor(dialog, editorBody, template, state);
  });
}

function renderLibrary(filter) {
  return cardTemplates.filter((template) => filter === 'all' || template.category === filter).map((template) => `
    <article class="template-card"><div><span class="category-label">${escapeHtml(categoryLabel(template.category))}</span><h3>${escapeHtml(template.title)}</h3><p>${escapeHtml(template.description)}</p></div><div class="template-meta"><small>${template.defaultCount}/A4 sugerido</small><button class="button" type="button" data-template="${template.id}">Abrir</button></div></article>`).join('');
}

function mountEditor(dialog, body, template, state) {
  body.innerHTML = `
    <header class="editor-header"><div><p class="eyebrow">${escapeHtml(categoryLabel(template.category))}</p><h2>${escapeHtml(template.title)}</h2><p>${escapeHtml(template.description)}</p></div></header>
    <div class="editor-grid">
      <form id="card-form" class="panel stack-form">${template.fields.map(renderField).join('')}</form>
      <section class="panel preview-panel"><div class="preview-controls"><label>Unidades/A4<select id="sheet-count"><option value="2">2</option><option value="4">4</option><option value="8">8</option></select></label><label class="check"><input id="easy-read" type="checkbox"> Leitura fácil</label><label class="check"><input id="economy" type="checkbox"> Econômica</label></div><div id="card-preview"></div><div class="actions"><button type="button" class="button" id="card-pdf">Baixar PDF</button><button type="button" class="button primary" id="card-print">Imprimir A4</button></div><p class="privacy-note">Nenhum campo digitado neste gerador é salvo no Supabase.</p></section>
    </div>`;
  const form = body.querySelector('#card-form');
  const preview = body.querySelector('#card-preview');
  const count = body.querySelector('#sheet-count');
  count.value = String(template.defaultCount || 4);

  const update = () => {
    preview.innerHTML = buildCardHtml(template, Object.fromEntries(new FormData(form).entries()), state, {
      easyRead: body.querySelector('#easy-read').checked,
      economy: body.querySelector('#economy').checked
    });
  };
  form.addEventListener('input', update);
  body.querySelector('#easy-read').addEventListener('change', update);
  body.querySelector('#economy').addEventListener('change', update);
  body.querySelector('#card-print').addEventListener('click', () => {
    const card = buildCardHtml(template, Object.fromEntries(new FormData(form).entries()), state, options(body));
    printHtml(repeatForSheet(card, Number(count.value)), { className: 'cards-print', title: template.title });
  });
  body.querySelector('#card-pdf').addEventListener('click', async () => {
    const card = buildCardHtml(template, Object.fromEntries(new FormData(form).entries()), state, options(body));
    await downloadPdf(repeatForSheet(card, Number(count.value)), { className: 'cards-print', title: template.title });
  });
  update();
  dialog.showModal();
}

function renderField(field) {
  const required = field.required ? 'required' : '';
  if (field.type === 'textarea') return `<label>${escapeHtml(field.label)}<textarea name="${field.id}" rows="3" ${required}></textarea></label>`;
  if (field.type === 'select') return `<label>${escapeHtml(field.label)}<select name="${field.id}" ${required}><option value="">Selecione</option>${field.options.map((option) => `<option>${escapeHtml(option)}</option>`).join('')}</select></label>`;
  return `<label>${escapeHtml(field.label)}<input name="${field.id}" type="${field.type || 'text'}" ${required}></label>`;
}

function buildCardHtml(template, values, state, { easyRead = false, economy = false } = {}) {
  const profile = state.profile || {};
  const context = state.context || {};
  const unit = context.unit?.short_name || profile.unit_name || 'Unidade de saúde';
  const team = context.team?.name || profile.team_name || '';
  const territory = [unit, team, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ');
  const fields = template.fields.map((field) => ({ label: field.label, value: values[field.id] || '' })).filter((item) => item.value);
  return `
    <article class="generated-card ${easyRead ? 'easy-read' : ''} ${economy ? 'economy' : ''}">
      <header><span>Território Vivo</span><strong>${escapeHtml(template.title)}</strong></header>
      <div class="generated-card-context"><b>${escapeHtml(territory)}</b>${profile.full_name ? `<span>Referência: ${escapeHtml(profile.full_name)}${profile.acs_phone ? ` • ${escapeHtml(profile.acs_phone)}` : ''}</span>` : ''}</div>
      <div class="generated-card-fields">${fields.length ? fields.map((item) => `<div><small>${escapeHtml(item.label)}</small><p>${escapeHtml(item.value).replace(/\n/g, '<br>')}</p></div>`).join('') : '<p class="placeholder-copy">Preencha os campos ao lado para montar a carteirinha.</p>'}</div>
      <footer>${escapeHtml(template.note || '')}</footer>
    </article>`;
}

function options(body) {
  return { easyRead: body.querySelector('#easy-read').checked, economy: body.querySelector('#economy').checked };
}

function categoryLabel(category) {
  return ({ family: 'Família', territory: 'Território', meeting: '5 minutos', management: 'Gestão' })[category] || category;
}
