import { appLayout, mountAppLayout } from '../core/layout.js';
import { openAccessibleDialog } from '../core/a11y.js';
import { cardCategories, cardTemplates, getCardTemplate } from '../data/cards.js';
import { escapeHtml, formatDateBr } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { printHtml, downloadPdf, repeatForSheet, cardsForSheet } from '../utils/print.js';

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
      <form id="card-form" class="panel stack-form" autocomplete="off">
        <div id="batch-editor" class="batch-editor" hidden>
          <div><strong id="batch-position">Carteirinha 1</strong><small>Preencha uma pessoa por vez. Os dados ficam somente nesta janela.</small></div>
          <div id="batch-slots" class="batch-slots" aria-label="Carteirinhas do lote"></div>
        </div>
        ${template.fields.map(renderField).join('')}
        <button type="reset" class="button">Limpar esta carteirinha</button>
      </form>
      <section class="panel preview-panel">
        <div class="preview-controls">
          <label>Carteirinhas/A4<select id="sheet-count"><option value="2">2</option><option value="4">4</option><option value="8">8</option><option value="12">12 mini</option></select></label>
          <label class="check"><input id="batch-mode" type="checkbox"> Lote: conteúdos diferentes</label>
          <label class="check"><input id="easy-read" type="checkbox"> Leitura fácil</label>
          <label class="check"><input id="visual-support" type="checkbox"> Apoio visual</label>
          <label class="check"><input id="large-print" type="checkbox"> Letra ampliada</label>
          <label class="check"><input id="economy" type="checkbox"> Econômica</label>
        </div>
        <p class="field-hint accessibility-hint">Apoio visual acrescenta pictogramas junto ao texto. Letra ampliada limita a folha a no máximo 4 carteirinhas para preservar legibilidade.</p>
        <p id="preview-batch-label" class="field-hint" hidden></p>
        <div id="card-preview"></div>
        <div class="actions"><button type="button" class="button" id="card-pdf">Baixar PDF</button><button type="button" class="button primary" id="card-print">Imprimir A4</button></div>
        <p id="card-action-status" class="form-status" aria-live="polite"></p>
        <p class="privacy-note">Nenhum campo digitado neste gerador é salvo no Supabase nem em armazenamento persistente do navegador. O lote existe somente na memória desta janela; ao fechar ou recarregar a página, ele desaparece.</p>
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
  const largePrint = body.querySelector('#large-print');
  const status = body.querySelector('#card-action-status');
  const entries = Array.from({ length: 12 }, () => ({}));
  let activeIndex = 0;
  count.value = String(template.defaultCount || 4);

  const currentValues = () => Object.fromEntries(new FormData(form).entries());
  const saveActive = () => {
    entries[activeIndex] = currentValues();
  };
  const hasValues = (entry) => Object.values(entry || {}).some((value) => String(value || '').trim());

  function loadActive() {
    const values = entries[activeIndex] || {};
    template.fields.forEach((field) => {
      const control = form.elements.namedItem(field.id);
      if (control) control.value = values[field.id] || '';
    });
    syncBatchUi();
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
    if (!batchMode.checked) {
      return repeatForSheet(buildCardHtml(template, entries[0], state, opts), sheetCount);
    }
    const cards = Array.from({ length: sheetCount }, (_, index) => buildCardHtml(template, entries[index] || {}, state, opts));
    return cardsForSheet(cards, sheetCount);
  }

  form.addEventListener('input', () => {
    saveActive();
    update();
  });
  form.addEventListener('reset', () => setTimeout(() => {
    entries[activeIndex] = {};
    update();
  }, 0));

  batchSlots.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-batch-index]');
    if (!trigger) return;
    saveActive();
    activeIndex = Number(trigger.dataset.batchIndex);
    loadActive();
  });

  batchMode.addEventListener('change', () => {
    saveActive();
    activeIndex = 0;
    loadActive();
  });

  count.addEventListener('change', () => {
    saveActive();
    if (largePrint.checked && Number(count.value) > 4) count.value = '4';
    activeIndex = Math.min(activeIndex, Number(count.value) - 1);
    loadActive();
  });

  body.querySelector('#easy-read').addEventListener('change', update);
  body.querySelector('#visual-support').addEventListener('change', update);
  body.querySelector('#economy').addEventListener('change', update);
  largePrint.addEventListener('change', () => {
    if (largePrint.checked && Number(count.value) > 4) {
      count.value = '4';
      activeIndex = Math.min(activeIndex, 3);
      status.textContent = 'Letra ampliada usa no máximo 4 carteirinhas por A4.';
      status.dataset.status = 'info';
    }
    loadActive();
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

function buildCardHtml(template, values, state, { easyRead = false, visualSupport = false, largePrint = false, economy = false } = {}) {
  const profile = state.profile || {};
  const context = state.context || {};
  const unit = context.unit?.short_name || profile.unit_name || 'Unidade de saúde';
  const team = context.team?.name || profile.team_name || '';
  const territory = [unit, team, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ');
  const fields = template.fields.map((field) => ({ field, label: field.label, value: displayValue(field, values[field.id]) })).filter((item) => item.value);
  return `
    <article class="generated-card ${easyRead ? 'easy-read' : ''} ${visualSupport ? 'visual-support' : ''} ${largePrint ? 'large-print' : ''} ${economy ? 'economy' : ''}">
      <header><span>Território Vivo</span><strong>${escapeHtml(template.title)}</strong></header>
      <div class="generated-card-context"><b>${escapeHtml(territory)}</b>${profile.full_name ? `<span>Referência: ${escapeHtml(profile.full_name)}${profile.acs_phone ? ` • ${escapeHtml(profile.acs_phone)}` : ''}</span>` : ''}</div>
      <div class="generated-card-fields">${fields.length ? fields.map((item) => `<div class="generated-card-field">${visualSupport ? pictogram(item.field) : ''}<span class="generated-card-field-copy"><small>${escapeHtml(item.label)}</small><p>${escapeHtml(item.value).replace(/\n/g, '<br>')}</p></span></div>`).join('') : '<p class="placeholder-copy">Preencha os campos ao lado para montar a carteirinha.</p>'}</div>
      <footer>${escapeHtml(template.note || '')}</footer>
    </article>`;
}

function pictogram(field) {
  const source = `${field.id} ${field.label}`.toLowerCase();
  let icon = 'info';
  if (field.type === 'date' || /dia|data|revis/.test(source)) icon = 'calendar';
  else if (field.type === 'time' || /hora/.test(source)) icon = 'clock';
  else if (/endereço|local|onde|location/.test(source)) icon = 'pin';
  else if (/nome|pessoa|família|responsável|referência|quem/.test(source)) icon = 'person';
  else if (/telefone|contato/.test(source)) icon = 'phone';
  else if (/serviço|atendimento|consulta|equipe|saúde/.test(source)) icon = 'health';
  return `<span class="field-pictogram" aria-hidden="true">${iconSvg(icon)}</span>`;
}

function iconSvg(icon) {
  const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  if (icon === 'calendar') return `<svg ${common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h2M14 14h2M8 18h2"/></svg>`;
  if (icon === 'clock') return `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>`;
  if (icon === 'pin') return `<svg ${common}><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11z"/><circle cx="12" cy="10" r="2"/></svg>`;
  if (icon === 'person') return `<svg ${common}><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-4.2 3.3-6.5 7.5-6.5s6.8 2.3 7.5 6.5"/></svg>`;
  if (icon === 'phone') return `<svg ${common}><path d="M6.5 3.5l3 3-2 2c1.7 3.4 4.1 5.8 7.5 7.5l2-2 3 3-1.7 3c-.4.7-1.2 1.1-2 1C9.5 20.1 3.9 14.5 3 7.7c-.1-.8.3-1.6 1-2l2.5-2.2z"/></svg>`;
  if (icon === 'health') return `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>`;
  return `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>`;
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
