import { appLayout, mountAppLayout } from '../core/layout.js';
import { openAccessibleDialog } from '../core/a11y.js';
import { readVolatileDraft, writeVolatileDraft } from '../core/volatile-drafts.js';
import { cardCategories, cardTemplates, getCardTemplate } from '../data/cards.js';
import { escapeHtml, formatDateBr } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { renderFlaticonIcon, renderVisualSupports } from '../lib/visual-support.js';
import { printHtml, downloadPdf, repeatForSheet, cardsForSheet } from '../utils/print.js';

const CARD_DRAFT_PREFIX = 'card-template:';
const CARDS_PAGE_DRAFT_KEY = 'cards-page';

export function renderCardsPage() {
  const content = `
    <section class="panel cards-intro-panel">
      <div class="cards-intro-icon">${renderFlaticonIcon('document')}</div>
      <div><p class="eyebrow">Comunicação do cuidado</p><h2>Escolha, preencha e imprima</h2><p>Crie materiais claros para situações recorrentes do território. Os campos desta área são temporários e não são gravados no banco.</p></div>
      <div class="cards-intro-metrics" aria-label="Resumo da biblioteca"><span><strong>${cardTemplates.length}</strong><small>modelos</small></span><span><strong>2–12</strong><small>por A4</small></span></div>
    </section>
    <section class="cards-library-panel">
      <div class="page-toolbar cards-library-toolbar"><div><p class="eyebrow">Biblioteca</p><h2>Encontre um modelo</h2><p id="card-library-summary" aria-live="polite">${cardTemplates.length} modelos disponíveis.</p></div><label>Buscar modelo<input id="card-search" type="search" placeholder="Ex.: agendamento, busca ativa, indicador"></label></div>
      <div class="filter-row cards-filter-row" aria-label="Categorias de carteirinhas">${cardCategories.map((category) => `<button type="button" class="filter-button ${category.id === 'all' ? 'active' : ''}" data-filter="${category.id}" ${category.id === 'all' ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${escapeHtml(category.label)}</button>`).join('')}</div>
      <div id="card-library" class="card-library field-card-library">${renderLibrary('all', '')}</div>
    </section>
    <dialog id="card-editor" class="editor-dialog" aria-labelledby="card-editor-title"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Fechar">×</button></form><div id="card-editor-body"></div></dialog>`;
  return appLayout({ title: 'Carteirinhas', subtitle: 'Modelos prontos para situações recorrentes do território.', activePath: '/app/carteirinhas', content });
}

export function mountCardsPage({ root, state }) {
  mountAppLayout(root);
  const library = root.querySelector('#card-library');
  const dialog = root.querySelector('#card-editor');
  const editorBody = root.querySelector('#card-editor-body');
  const search = root.querySelector('#card-search');
  const summary = root.querySelector('#card-library-summary');
  const pageDraft = readVolatileDraft(CARDS_PAGE_DRAFT_KEY, {});
  let filter = 'all';

  function refreshLibrary() {
    const rows = matchingTemplates(filter, search.value);
    library.innerHTML = renderLibrary(filter, search.value);
    summary.textContent = `${rows.length} ${rows.length === 1 ? 'modelo disponível' : 'modelos disponíveis'}.`;
  }

  function rememberOpenTemplate(templateId) {
    writeVolatileDraft(CARDS_PAGE_DRAFT_KEY, { openTemplateId: templateId || null });
  }

  function openTemplate(template, opener = null) {
    if (!template) return;
    rememberOpenTemplate(template.id);
    mountEditor(dialog, editorBody, template, state, opener);
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
    openTemplate(template, trigger);
  });

  dialog.addEventListener('close', () => rememberOpenTemplate(null));

  const restoredTemplate = getCardTemplate(pageDraft.openTemplateId);
  if (restoredTemplate) openTemplate(restoredTemplate);
}

function renderLibrary(filter, query) {
  const rows = matchingTemplates(filter, query);
  if (!rows.length) return '<div class="empty-state"><h3>Nenhum modelo encontrado</h3><p>Altere a busca ou a categoria.</p></div>';
  return rows.map((template) => `
    <article class="template-card field-template-card" data-card-category="${escapeHtml(template.category)}"><header>${renderFlaticonIcon(cardCategoryIcon(template.category), { className: 'field-template-icon' })}<span class="category-label">${escapeHtml(categoryLabel(template.category))}</span></header><div><h3>${escapeHtml(template.title)}</h3><p>${escapeHtml(template.description)}</p></div><div class="template-meta"><small>${template.defaultCount}/A4 sugerido</small><button class="button" type="button" data-template="${escapeHtml(template.id)}">Criar</button></div></article>`).join('');
}

function matchingTemplates(filter, query) {
  const q = String(query || '').trim().toLowerCase();
  return cardTemplates.filter((template) => {
    if (filter !== 'all' && template.category !== filter) return false;
    if (!q) return true;
    return [template.title, template.description, categoryLabel(template.category), template.note].filter(Boolean).join(' ').toLowerCase().includes(q);
  });
}

function mountEditor(dialog, body, template, state, opener) {
  body.innerHTML = `
    <header class="editor-header field-card-editor-header"><div><p class="eyebrow">${escapeHtml(categoryLabel(template.category))}</p><h2 id="card-editor-title">${escapeHtml(template.title)}</h2><p>${escapeHtml(template.description)}</p></div><ol class="card-editor-steps" aria-label="Etapas para criar a carteirinha"><li><span>1</span>Preencha</li><li><span>2</span>Ajuste</li><li><span>3</span>Imprima</li></ol></header>
    <div class="editor-grid field-card-editor-grid">
      <form id="card-form" class="panel stack-form field-card-form" autocomplete="off">
        <header><p class="eyebrow">Conteúdo</p><h3>Informações da carteirinha</h3></header>
        <div id="batch-editor" class="batch-editor" hidden>
          <div><strong id="batch-position">Carteirinha 1</strong><small>Preencha uma pessoa por vez. Os dados ficam somente nesta aba.</small></div>
          <div id="batch-slots" class="batch-slots" aria-label="Carteirinhas do lote"></div>
        </div>
        ${template.fields.map(renderField).join('')}
        <button type="reset" class="button">Limpar esta carteirinha</button>
      </form>
      <section class="panel preview-panel field-card-preview-panel">
        <header class="field-card-preview-heading"><div><p class="eyebrow">Prévia em tempo real</p><h3>Revise antes de imprimir</h3></div></header>
        <div class="preview-controls field-card-preview-controls" role="group" aria-label="Opções de impressão e acessibilidade">
          <label>Carteirinhas/A4<select id="sheet-count"><option value="2">2</option><option value="4">4</option><option value="8">8</option><option value="12">12 mini</option></select></label>
          <label class="check"><input id="batch-mode" type="checkbox"> Lote: conteúdos diferentes</label>
          <label class="check"><input id="easy-read" type="checkbox"> Leitura fácil</label>
          <label class="check"><input id="visual-support" type="checkbox"> Apoio visual</label>
          <label class="check"><input id="large-print" type="checkbox"> Letra ampliada</label>
          <label class="check"><input id="economy" type="checkbox"> Econômica</label>
        </div>
        <p class="field-hint accessibility-hint">Apoio visual usa imagens específicas conforme o conteúdo — por exemplo vacina, dentista, exame, jejum, Cartão SUS, água ou acompanhante. Apoio visual e letra ampliada usam no máximo 4 carteirinhas por A4 para preservar compreensão e legibilidade.</p>
        <p id="preview-batch-label" class="field-hint" hidden></p>
        <div id="card-preview"></div>
        <div class="actions field-card-editor-actions"><button type="button" class="button" id="card-pdf">Baixar PDF</button><button type="button" class="button primary" id="card-print">Imprimir A4</button></div>
        <p id="card-action-status" class="form-status" aria-live="polite"></p>
        <p class="privacy-note">Nenhum campo digitado neste gerador é salvo no Supabase nem em armazenamento persistente do navegador. Ao navegar por outras telas, o rascunho continua apenas na memória desta aba; ele desaparece ao recarregar, fechar a aba ou sair da conta.</p>
      </section>
    </div>`;

  const form = body.querySelector('#card-form');
  const preview = body.querySelector('#card-preview');
  const count = body.querySelector('#sheet-count');
  const batchMode = body.querySelector('#batch-mode');
  const batchEditor = body.querySelector('#batch-editor');
  const batchSlots = body.querySelector('#batch-slots');
  const batchPosition = body.querySelector('#batch-position');
  const previewBatchLabel = body.querySelector('#preview-batch-label');
  const easyRead = body.querySelector('#easy-read');
  const visualSupport = body.querySelector('#visual-support');
  const largePrint = body.querySelector('#large-print');
  const economy = body.querySelector('#economy');
  const status = body.querySelector('#card-action-status');
  const draftKey = `${CARD_DRAFT_PREFIX}${template.id}`;
  const draft = readVolatileDraft(draftKey, {});
  const restoredEntries = Array.isArray(draft.entries) ? draft.entries.slice(0, 12) : [];
  const entries = Array.from({ length: 12 }, (_, index) => ({ ...(restoredEntries[index] || {}) }));
  let activeIndex = Number.isInteger(draft.activeIndex) ? Math.max(0, Math.min(11, draft.activeIndex)) : 0;
  const restoredCount = [2, 4, 8, 12].includes(Number(draft.count)) ? Number(draft.count) : Number(template.defaultCount || 4);
  count.value = String(restoredCount);
  batchMode.checked = Boolean(draft.batchMode);
  easyRead.checked = Boolean(draft.options?.easyRead);
  visualSupport.checked = Boolean(draft.options?.visualSupport);
  largePrint.checked = Boolean(draft.options?.largePrint);
  economy.checked = Boolean(draft.options?.economy);
  if ((largePrint.checked || visualSupport.checked) && Number(count.value) > 4) count.value = '4';
  activeIndex = Math.min(activeIndex, Number(count.value) - 1);

  const currentValues = () => Object.fromEntries(new FormData(form).entries());
  const saveActive = () => {
    entries[activeIndex] = currentValues();
  };
  const persistDraft = () => writeVolatileDraft(draftKey, {
    entries,
    activeIndex,
    count: Number(count.value),
    batchMode: batchMode.checked,
    options: options(body)
  });
  const hasValues = (entry) => Object.values(entry || {}).some((value) => String(value || '').trim());

  function loadActive() {
    const values = entries[activeIndex] || {};
    template.fields.forEach((field) => {
      const control = form.elements.namedItem(field.id);
      if (control) control.value = values[field.id] || '';
    });
    update();
  }

  function syncBatchUi() {
    const total = Number(count.value);
    const enabled = batchMode.checked;
    batchEditor.hidden = !enabled;
    previewBatchLabel.hidden = !enabled;
    if (!enabled) return;
    batchPosition.textContent = `Carteirinha ${activeIndex + 1} de ${total}`;
    previewBatchLabel.textContent = `Prévia da carteirinha ${activeIndex + 1} de ${total}. Na impressão, cada posição usa os dados preenchidos no próprio número.`;
    batchSlots.innerHTML = Array.from({ length: total }, (_, index) => {
      const active = index === activeIndex;
      const filled = hasValues(entries[index]);
      return `<button type="button" class="batch-slot ${active ? 'active' : ''}" data-batch-index="${index}" aria-pressed="${active}">${index + 1}${filled ? ' ✓' : ''}</button>`;
    }).join('');
  }

  function update() {
    preview.innerHTML = buildCardHtml(template, currentValues(), state, options(body));
    syncBatchUi();
  }

  function sheetHtml() {
    const sheetCount = Number(count.value);
    const opts = options(body);
    saveActive();
    persistDraft();
    if (!batchMode.checked) {
      return repeatForSheet(buildCardHtml(template, entries[0], state, opts), sheetCount);
    }
    const cards = Array.from({ length: sheetCount }, (_, index) => buildCardHtml(template, entries[index] || {}, state, opts));
    return cardsForSheet(cards, sheetCount);
  }

  form.addEventListener('input', () => {
    saveActive();
    persistDraft();
    update();
  });
  form.addEventListener('reset', () => setTimeout(() => {
    entries[activeIndex] = {};
    persistDraft();
    update();
  }, 0));

  batchSlots.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-batch-index]');
    if (!trigger) return;
    saveActive();
    activeIndex = Number(trigger.dataset.batchIndex);
    loadActive();
    persistDraft();
  });

  batchMode.addEventListener('change', () => {
    saveActive();
    activeIndex = 0;
    loadActive();
    persistDraft();
  });

  count.addEventListener('change', () => {
    saveActive();
    if ((largePrint.checked || visualSupport.checked) && Number(count.value) > 4) count.value = '4';
    activeIndex = Math.min(activeIndex, Number(count.value) - 1);
    loadActive();
    persistDraft();
  });

  easyRead.addEventListener('change', () => {
    persistDraft();
    update();
  });
  economy.addEventListener('change', () => {
    persistDraft();
    update();
  });
  visualSupport.addEventListener('change', () => {
    if (visualSupport.checked && Number(count.value) > 4) {
      count.value = '4';
      activeIndex = Math.min(activeIndex, 3);
      status.textContent = 'Apoio visual usa no máximo 4 carteirinhas por A4 para manter as imagens compreensíveis.';
      status.dataset.status = 'info';
    }
    loadActive();
    persistDraft();
  });
  largePrint.addEventListener('change', () => {
    if (largePrint.checked && Number(count.value) > 4) {
      count.value = '4';
      activeIndex = Math.min(activeIndex, 3);
      status.textContent = 'Letra ampliada usa no máximo 4 carteirinhas por A4.';
      status.dataset.status = 'info';
    }
    loadActive();
    persistDraft();
  });

  body.querySelector('#card-print').addEventListener('click', () => {
    if (!validateForm(form, status)) return;
    printHtml(sheetHtml(), { className: 'cards-print', title: template.title });
    status.textContent = batchMode.checked ? 'Janela de impressão aberta com o lote.' : 'Janela de impressão aberta.';
    status.dataset.status = 'success';
  });

  body.querySelector('#card-pdf').addEventListener('click', async (event) => {
    if (!validateForm(form, status)) return;
    const button = event.currentTarget;
    setButtonBusy(button, true, 'Gerando PDF…');
    status.textContent = 'Gerando PDF…';
    status.dataset.status = 'info';
    try {
      const result = await downloadPdf(sheetHtml(), { className: 'cards-print', title: template.title });
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

  loadActive();
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

function buildCardHtml(template, values, state, { easyRead = false, visualSupport = false, largePrint = false, economy = false } = {}) {
  const profile = state.profile || {};
  const context = state.context || {};
  const unit = context.unit?.short_name || profile.unit_name || 'Unidade de saúde';
  const team = context.team?.name || profile.team_name || '';
  const fields = template.fields.map((field) => ({ field, label: field.label, value: displayValue(field, values[field.id]) })).filter((item) => item.value);

  if (template.id === 'appointment') {
    return buildAppointmentCardHtml({ template, fields, profile, unit, team, easyRead, visualSupport, largePrint, economy });
  }

  return buildCollectionCardHtml({ template, fields, profile, unit, team, easyRead, visualSupport, largePrint, economy });
}

function buildCollectionCardHtml({ template, fields, profile, unit, team, easyRead, visualSupport, largePrint, economy }) {
  const teamAndMicroarea = [team, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ');
  const reference = profile.full_name
    ? `Referência: ${escapeHtml(profile.full_name)}${profile.acs_phone ? ` • ${escapeHtml(profile.acs_phone)}` : ''}`
    : '';
  const classes = [
    'generated-card',
    'collection-card',
    `collection-card-${template.category}`,
    `collection-template-${template.id}`,
    easyRead ? 'easy-read' : '',
    visualSupport ? 'visual-support' : '',
    largePrint ? 'large-print' : '',
    economy ? 'economy' : ''
  ].filter(Boolean).join(' ');

  return `
    <article class="${classes}">
      <header class="collection-card-header">
        <span class="collection-card-brand">
          <span class="collection-card-mark" aria-hidden="true">
            <svg class="collection-card-symbol" viewBox="0 0 52 52" focusable="false" aria-hidden="true">
              <rect x="1" y="1" width="50" height="50" rx="12" fill="currentColor"/>
              <path d="M26 7.5c-7.7 0-14 6.1-14 13.7 0 10.3 14 23.3 14 23.3s14-13 14-23.3c0-7.6-6.3-13.7-14-13.7Z" fill="#fff"/>
              <path d="m18.8 23.1 7.2-6 7.2 6v8.4H18.8v-8.4Z" fill="currentColor"/>
              <circle cx="23" cy="24.8" r="1.8" fill="#fff"/>
              <circle cx="29" cy="24.8" r="1.8" fill="#fff"/>
              <path d="M21.4 29.3c.5-1.7 1.6-2.6 3.1-2.6s2.6.9 3.1 2.6M27 29.3c.4-1.4 1.3-2.1 2.6-2.1 1.2 0 2.1.7 2.6 2.1" fill="none" stroke="#fff" stroke-width="1.45" stroke-linecap="round"/>
              <circle cx="39.5" cy="39.5" r="5.2" fill="#2e7d32" stroke="#fff" stroke-width="2"/>
            </svg>
          </span>
          <span class="collection-card-brand-copy">
            <small>Território Vivo</small>
            <strong>${escapeHtml(template.title)}</strong>
          </span>
        </span>
        <span class="collection-card-category">${escapeHtml(categoryLabel(template.category))}</span>
      </header>
      <div class="generated-card-context collection-card-context">
        <strong class="collection-card-unit">${escapeHtml(unit)}</strong>
        ${teamAndMicroarea ? `<span class="collection-card-territory">${escapeHtml(teamAndMicroarea)}</span>` : ''}
        ${reference ? `<span class="collection-card-reference">${reference}</span>` : ''}
      </div>
      <div class="generated-card-fields collection-card-fields">${fields.length ? fields.map((item) => renderCollectionCardField(item, visualSupport)).join('') : '<p class="placeholder-copy">Preencha os campos ao lado para montar a carteirinha.</p>'}</div>
      <footer class="collection-card-note">${escapeHtml(template.note || '')}</footer>
    </article>`;
}

function renderCollectionCardField(item, visualSupport) {
  const classes = [
    'generated-card-field',
    'collection-card-field',
    `collection-card-field-${item.field.id}`,
    item.field.type === 'textarea' ? 'collection-card-field-wide' : '',
    item.field.type === 'number' ? 'collection-card-field-number' : '',
    ['date', 'time'].includes(item.field.type) ? 'collection-card-field-compact' : ''
  ].filter(Boolean).join(' ');

  return `<div class="${classes}">${visualSupport ? renderVisualSupports({ label: item.label, value: item.value, type: item.field.type }, { max: 3, className: 'field-pictogram' }) : ''}<span class="generated-card-field-copy"><small>${escapeHtml(item.label)}</small><p>${escapeHtml(item.value).replace(/\n/g, '<br>')}</p></span></div>`;
}

function buildAppointmentCardHtml({ template, fields, profile, unit, team, easyRead, visualSupport, largePrint, economy }) {
  const teamAndMicroarea = [team, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ');
  const reference = profile.full_name
    ? `Referência: ${escapeHtml(profile.full_name)}${profile.acs_phone ? ` • ${escapeHtml(profile.acs_phone)}` : ''}`
    : '';
  const classes = [
    'generated-card',
    'appointment-card',
    easyRead ? 'easy-read' : '',
    visualSupport ? 'visual-support' : '',
    largePrint ? 'large-print' : '',
    economy ? 'economy' : ''
  ].filter(Boolean).join(' ');

  return `
    <article class="${classes}">
      <header class="appointment-card-header">
        <span class="appointment-card-brand">
          <span class="appointment-card-mark" aria-hidden="true">
            <svg class="appointment-card-symbol" viewBox="0 0 52 52" focusable="false" aria-hidden="true">
              <rect x="1" y="1" width="50" height="50" rx="12" fill="currentColor"/>
              <path d="M26 7.5c-7.7 0-14 6.1-14 13.7 0 10.3 14 23.3 14 23.3s14-13 14-23.3c0-7.6-6.3-13.7-14-13.7Z" fill="#fff"/>
              <path d="m18.8 23.1 7.2-6 7.2 6v8.4H18.8v-8.4Z" fill="currentColor"/>
              <circle cx="23" cy="24.8" r="1.8" fill="#fff"/>
              <circle cx="29" cy="24.8" r="1.8" fill="#fff"/>
              <path d="M21.4 29.3c.5-1.7 1.6-2.6 3.1-2.6s2.6.9 3.1 2.6M27 29.3c.4-1.4 1.3-2.1 2.6-2.1 1.2 0 2.1.7 2.6 2.1" fill="none" stroke="#fff" stroke-width="1.45" stroke-linecap="round"/>
              <circle cx="39.5" cy="39.5" r="5.2" fill="#2e7d32" stroke="#fff" stroke-width="2"/>
            </svg>
          </span>
          <span class="appointment-card-brand-copy"><small>Território Vivo</small><strong>${escapeHtml(template.title)}</strong></span>
        </span>
      </header>
      <div class="generated-card-context appointment-card-context">
        <strong class="appointment-card-unit">${escapeHtml(unit)}</strong>
        ${teamAndMicroarea ? `<span class="appointment-card-territory">${escapeHtml(teamAndMicroarea)}</span>` : ''}
        ${reference ? `<span class="appointment-card-reference">${reference}</span>` : ''}
      </div>
      <div class="generated-card-fields appointment-card-fields">${fields.length ? fields.map((item) => `<div class="generated-card-field appointment-card-field appointment-card-field-${escapeHtml(item.field.id)}">${visualSupport ? renderVisualSupports({ label: item.label, value: item.value, type: item.field.type }, { max: 3, className: 'field-pictogram' }) : ''}<span class="generated-card-field-copy"><small>${escapeHtml(item.label)}</small><p>${escapeHtml(item.value).replace(/\n/g, '<br>')}</p></span></div>`).join('') : '<p class="placeholder-copy">Preencha os campos ao lado para montar a carteirinha.</p>'}</div>
      <footer class="appointment-card-note">${escapeHtml(template.note || '')}</footer>
    </article>`;
}

function displayValue(field, raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  if (field.type === 'date') return formatDateBr(raw);
  return String(raw);
}

function options(body) {
  return {
    easyRead: body.querySelector('#easy-read').checked,
    visualSupport: body.querySelector('#visual-support').checked,
    largePrint: body.querySelector('#large-print').checked,
    economy: body.querySelector('#economy').checked
  };
}

function categoryLabel(category) {
  return ({ family: 'Família', territory: 'Território', meeting: '5 minutos', indicator: 'Indicadores', management: 'Gestão' })[category] || category;
}

function cardCategoryIcon(category) {
  return ({ family: 'family', territory: 'location', meeting: 'group', indicator: 'population', management: 'action' })[category] || 'document';
}
