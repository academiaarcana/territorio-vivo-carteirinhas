import { appLayout, mountAppLayout } from '../core/layout.js';
import { applyNamedFormValues, clearVolatileDraft, readNamedFormValues, readVolatileDraft, writeVolatileDraft } from '../core/volatile-drafts.js';
import {
  getPrescriptionRoute,
  getPrescriptionSchedule,
  getPrescriptionSupportItem,
  prescriptionRoutes,
  prescriptionSchedules,
  prescriptionQuickTemplates,
  prescriptionSupportCategories,
  prescriptionSupportItemsFor
} from '../data/prescription-support.js';
import { escapeHtml, setStatus } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { renderFlaticonIcon } from '../lib/visual-support.js';
import { ROLES, roleLabel } from '../core/permissions.js';
import { printHtml, downloadPdf } from '../utils/print.js';

const PRESCRIPTION_DRAFT_KEY = 'accessible-prescription-builder';
const MAX_OPTIONAL_SUPPORTS = 4;

const emptyDraft = () => ({
  values: { source_text: '', medication: '', dose: '', route: 'oral', schedule: 'morning', observation: '', support_ids: '' },
  items: []
});

export function renderPrescriptionsPage({ state }) {
  const profile = state.profile || {};
  const nurse = profile.role === ROLES.NURSE;
  const professionalNotice = nurse
    ? 'A prescrição de enfermagem deve ocorrer no contexto da consulta de enfermagem e seguir os protocolos e rotinas aprovados pelo serviço, os programas de saúde pública e os limites da habilitação profissional.'
    : 'A emissão e a assinatura de receitas devem seguir as regras profissionais aplicáveis, o registro do conselho e os requisitos de validade do serviço.';
  const content = `
    <section class="prescription-hero panel">
      <div class="prescription-hero-icon">${renderFlaticonIcon('prescription')}</div>
      <div><p class="eyebrow">Apoio visual à prescrição</p><h2>Transforme a orientação escrita em uma sequência mais fácil de entender.</h2><p>Copie somente a linha necessária do PEC, confirme cada informação e combine texto com pictogramas autorais. O conteúdo permanece apenas nesta aba.</p></div>
      <span class="prescription-role-badge">${escapeHtml(roleLabel(profile))}</span>
    </section>
    <section class="prescription-boundary" aria-labelledby="prescription-boundary-title">
      <div><p class="eyebrow">Fronteira de privacidade</p><h2 id="prescription-boundary-title">Dados temporários: nada é salvo no Supabase</h2></div>
      <p>O texto colado do PEC e as orientações montadas permanecem somente nesta aba. Não inclua nome, CPF, diagnóstico ou outro dado que identifique a pessoa.</p>
    </section>
    <section class="prescription-workbench">
      <article class="panel prescription-builder-panel">
        <header class="prescription-section-heading"><div><p class="eyebrow">1 · Texto clínico</p><h2>Monte uma orientação por vez</h2><p>O sistema não interpreta nem corrige a prescrição. Confira a linha original e preencha os campos manualmente.</p></div></header>
        <form id="prescription-builder-form" class="stack-form prescription-builder-form" autocomplete="off">
          ${renderQuickTemplates()}
          <label class="prescription-source-field">Cole o texto da receita do PEC (opcional)
            <textarea name="source_text" rows="4" maxlength="3000" placeholder="Cole somente as linhas necessárias, sem nome ou CPF do paciente"></textarea>
            <small>Use o texto apenas como referência de conferência. Nenhuma informação é interpretada automaticamente.</small>
          </label>
          <div class="prescription-fields-row">
            <label>Medicamento ou orientação<input name="medication" maxlength="180" required placeholder="Ex.: medicamento conforme a receita"></label>
            <label>Dose / quantidade<input name="dose" maxlength="120" required placeholder="Ex.: 1 comprimido ou 5 gotas"></label>
          </div>
          ${renderChoiceGroup('route', '2 · Escolha a via de uso', prescriptionRoutes)}
          ${renderChoiceGroup('schedule', '3 · Escolha o período', prescriptionSchedules)}
          <label>Horário, intervalo ou observação
            <input name="observation" maxlength="220" placeholder="Ex.: a cada 8 horas, por 7 dias, 30 min antes do almoço">
          </label>
          <input type="hidden" name="support_ids" value="">
          ${renderSupportLibraryShell()}
          <div class="actions prescription-form-actions"><button class="button primary" type="submit">Adicionar orientação</button><button class="button" type="button" data-clear-fields>Limpar campos</button></div>
        </form>
      </article>
      <aside class="panel prescription-preview-panel" aria-labelledby="prescription-preview-heading">
        <header class="prescription-section-heading"><div><p class="eyebrow">4 · Revise</p><h2 id="prescription-preview-heading">Prévia dos adesivos</h2><p>Texto e imagens devem transmitir a mesma orientação.</p></div><strong class="prescription-item-count" data-prescription-count>0 itens</strong></header>
        <div class="prescription-current-preview" data-current-preview></div>
        <ol class="prescription-items" data-prescription-items></ol>
        <div class="prescription-empty-state" data-prescription-empty>${renderFlaticonIcon('document')}<strong>Nenhuma orientação adicionada</strong><span>Preencha e revise o primeiro item ao lado.</span></div>
        <section class="prescription-output" aria-labelledby="prescription-output-heading"><h3 id="prescription-output-heading">Preparar para entrega</h3><p><strong>Apoio visual não substitui o texto da prescrição.</strong> Revise dose, via, frequência, duração e observações antes de imprimir.</p><div class="actions"><button class="button" type="button" data-prescription-pdf>Baixar PDF</button><button class="button primary" type="button" data-prescription-print>Imprimir adesivos</button><button class="button danger-link" type="button" data-clear-draft>Apagar rascunho</button></div><p class="form-status" data-prescription-status aria-live="polite"></p></section>
      </aside>
    </section>
    <section class="panel prescription-guidance">
      <div>${renderFlaticonIcon('warning')}<div><p class="eyebrow">Responsabilidade profissional</p><h2>O apoio visual não amplia atribuições clínicas</h2></div></div>
      <p>${escapeHtml(professionalNotice)} Confira identificação profissional, assinatura, registro no prontuário e entrega do documento original.</p>
      <div class="prescription-library-origin"><strong>Biblioteca própria do Território Vivo</strong><span>As imagens autorais ficam dentro deste site. A referência externa foi estudada apenas para compreender categorias e fluxo; nenhum código, logotipo ou banco de imagens de terceiros foi incorporado.</span></div>
    </section>`;

  return appLayout({ title: 'Prescrições e receitas', subtitle: 'Acesso exclusivo para médicas(os) e enfermeiras(os) com perfil ativo.', activePath: '/app/prescricoes', content });
}

export function mountPrescriptionsPage({ root, state }) {
  mountAppLayout(root);
  const form = root.querySelector('#prescription-builder-form');
  const status = root.querySelector('[data-prescription-status]');
  let draft = readVolatileDraft(PRESCRIPTION_DRAFT_KEY, emptyDraft());
  draft.items = Array.isArray(draft.items) ? draft.items : [];
  let activeSupportCategory = 'combined';
  let selectedSupportIds = parseSupportIds(draft.values?.support_ids);
  applyNamedFormValues(form, draft.values || {});
  syncSupportField(form, selectedSupportIds);

  const persist = () => {
    syncSupportField(form, selectedSupportIds);
    draft.values = readNamedFormValues(form);
    writeVolatileDraft(PRESCRIPTION_DRAFT_KEY, draft);
  };
  const refresh = () => {
    const values = readNamedFormValues(form);
    renderCurrentPreview(root, values);
    renderPrescriptionItems(root, draft.items);
    renderSupportLibrary(root, {
      category: activeSupportCategory,
      query: root.querySelector('[data-support-search]')?.value || '',
      values,
      selectedSupportIds
    });
  };

  form.addEventListener('input', () => { persist(); refresh(); });
  form.addEventListener('change', () => { persist(); refresh(); });
  root.querySelector('[data-prescription-quick-templates]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-prescription-template]');
    if (!button) return;
    const template = getPrescriptionSupportItem(button.dataset.prescriptionTemplate);
    if (!template || template.action !== 'preset') return;
    applyPrescriptionTemplate(form, template);
    persist();
    refresh();
    setStatus(status, 'Modelo aplicado. Agora informe medicamento e dose e confira todos os campos.', 'success');
    form.elements.medication.focus();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = readNamedFormValues(form);
    const medication = String(values.medication || '').trim();
    const dose = String(values.dose || '').trim();
    if (!medication || !dose) {
      setStatus(status, 'Informe o medicamento ou orientação e a dose antes de adicionar.', 'error');
      return;
    }
    draft.items.push({
      id: `${Date.now()}-${draft.items.length}`,
      medication,
      dose,
      route: getPrescriptionRoute(values.route).id,
      schedule: getPrescriptionSchedule(values.schedule).id,
      observation: String(values.observation || '').trim(),
      supports: selectedSupportIds.slice(0, MAX_OPTIONAL_SUPPORTS)
    });
    values.medication = '';
    values.dose = '';
    values.observation = '';
    values.support_ids = '';
    selectedSupportIds = [];
    draft.values = values;
    writeVolatileDraft(PRESCRIPTION_DRAFT_KEY, draft);
    applyNamedFormValues(form, values);
    refresh();
    setStatus(status, 'Orientação adicionada. Revise o texto e os pictogramas.', 'success');
    form.elements.medication.focus();
  });

  root.querySelector('[data-clear-fields]').addEventListener('click', () => {
    const sourceText = form.elements.source_text.value;
    draft.values = { ...emptyDraft().values, source_text: sourceText };
    selectedSupportIds = [];
    applyNamedFormValues(form, draft.values);
    persist();
    refresh();
    form.elements.medication.focus();
  });

  root.querySelector('[data-prescription-items]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-prescription-item]');
    if (!button) return;
    draft.items = draft.items.filter((item) => item.id !== button.dataset.removePrescriptionItem);
    persist();
    refresh();
    setStatus(status, 'Orientação removida do rascunho.', 'success');
  });

  root.querySelector('[data-clear-draft]').addEventListener('click', () => {
    draft = emptyDraft();
    selectedSupportIds = [];
    clearVolatileDraft(PRESCRIPTION_DRAFT_KEY);
    applyNamedFormValues(form, draft.values);
    refresh();
    setStatus(status, 'Rascunho temporário apagado.', 'success');
  });

  root.querySelector('[data-prescription-print]').addEventListener('click', () => {
    if (!ensurePrintable(draft.items, status)) return;
    persist();
    printHtml(buildPrescriptionPrint(draft.items, state), { className: 'prescription-print', title: 'Orientações visuais da prescrição' });
    setStatus(status, 'Janela de impressão aberta.', 'success');
  });

  root.querySelector('[data-prescription-pdf]').addEventListener('click', async (event) => {
    if (!ensurePrintable(draft.items, status)) return;
    const button = event.currentTarget;
    setButtonBusy(button, true, 'Gerando PDF…');
    setStatus(status, 'Gerando PDF…', 'info');
    try {
      persist();
      await downloadPdf(buildPrescriptionPrint(draft.items, state), { className: 'prescription-print', title: 'Orientações visuais da prescrição' });
      setStatus(status, 'PDF gerado.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(status, 'Não foi possível gerar o PDF.', 'error');
    } finally {
      setButtonBusy(button, false);
    }
  });

  root.querySelector('[data-support-tabs]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-support-category]');
    if (!button) return;
    activeSupportCategory = button.dataset.supportCategory;
    refresh();
  });
  root.querySelector('[data-support-tabs]').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...root.querySelectorAll('[data-support-category]')];
    const current = buttons.indexOf(event.target.closest('[data-support-category]'));
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    activeSupportCategory = buttons[next].dataset.supportCategory;
    refresh();
    buttons[next].focus();
  });

  root.querySelector('[data-support-search]').addEventListener('input', refresh);

  root.querySelector('[data-support-library]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-support-item]');
    if (!button) return;
    const item = getPrescriptionSupportItem(button.dataset.supportItem);
    if (!item) return;

    if (item.action === 'preset') {
      applyPrescriptionTemplate(form, item);
      setStatus(status, 'Modelo aplicado. Informe medicamento e dose e confira todos os campos.', 'success');
    } else if (item.action === 'route') {
      form.elements.route.value = item.id;
      setStatus(status, 'Via de uso selecionada. Confira com a prescrição original.', 'success');
    } else if (item.action === 'schedule') {
      form.elements.schedule.value = item.id;
      setStatus(status, 'Período selecionado. Informe também horário, intervalo e duração quando necessário.', 'success');
    } else if (item.action === 'observation') {
      form.elements.observation.value = appendObservation(form.elements.observation.value, item.observation);
      setStatus(status, 'Intervalo acrescentado ao texto. Complete a duração e confira a receita.', 'success');
    } else if (item.action === 'support') {
      const alreadySelected = selectedSupportIds.includes(item.id);
      if (alreadySelected) selectedSupportIds = selectedSupportIds.filter((id) => id !== item.id);
      else if (selectedSupportIds.length < MAX_OPTIONAL_SUPPORTS) selectedSupportIds.push(item.id);
      else {
        setStatus(status, `Escolha no máximo ${MAX_OPTIONAL_SUPPORTS} apoios adicionais por orientação.`, 'error');
        return;
      }
      setStatus(status, alreadySelected ? 'Apoio visual removido.' : 'Apoio visual selecionado. Confira se ele corresponde ao texto.', 'success');
    }

    persist();
    refresh();
  });

  refresh();
}

function renderQuickTemplates() {
  return `<section class="prescription-quick-templates" aria-labelledby="prescription-templates-heading">
    <header><div><p class="eyebrow">Começo rápido</p><h3 id="prescription-templates-heading">Escolha um modelo frequente</h3></div><p>O modelo não escolhe medicamento, dose nem duração. Ele somente marca a via e o período para você completar e conferir.</p></header>
    <div data-prescription-quick-templates>${prescriptionQuickTemplates.map((template) => `<button type="button" data-prescription-template="${escapeHtml(template.id)}"><span>${renderSupportVisual(template)}</span><strong>${escapeHtml(template.label)}</strong><small>${escapeHtml(template.hint)}</small></button>`).join('')}</div>
    <p><strong>Precisa de outro?</strong> Veja todos os ${prescriptionSupportItemsFor('combined').length} modelos na categoria “Modelos prontos” da biblioteca visual.</p>
  </section>`;
}

function renderSupportLibraryShell() {
  return `<section class="prescription-support-library" aria-labelledby="prescription-library-heading">
    <header><div><p class="eyebrow">4 · Biblioteca visual</p><h3 id="prescription-library-heading">Acrescente imagens de apoio</h3><p>Escolha até ${MAX_OPTIONAL_SUPPORTS} apoios. Via, dose, horário, intervalo e duração continuam escritos e conferidos pela(o) profissional.</p></div><label>Buscar na biblioteca<input type="search" data-support-search maxlength="80" placeholder="Ex.: dor, água, criança, 8 horas"></label></header>
    <div class="prescription-support-tabs" role="tablist" aria-label="Categorias da biblioteca" data-support-tabs>${prescriptionSupportCategories.map((category, index) => `<button id="prescription-tab-${escapeHtml(category.id)}" type="button" role="tab" aria-controls="prescription-support-panel" aria-selected="${index === 0 ? 'true' : 'false'}" tabindex="${index === 0 ? '0' : '-1'}" data-support-category="${escapeHtml(category.id)}">${escapeHtml(category.label)}</button>`).join('')}</div>
    <p class="prescription-support-description" data-support-description></p>
    <div id="prescription-support-panel" class="prescription-support-grid" role="tabpanel" aria-labelledby="prescription-tab-combined" data-support-library></div>
    <p class="prescription-cultural-note" data-cultural-note hidden><strong>Validação cultural necessária:</strong> estas imagens não representam todos os povos indígenas. Antes de usar, confirme linguagem, cena e significado com a comunidade atendida.</p>
    <p class="prescription-taper-note" data-taper-note hidden><strong>Retirada de corticoide:</strong> o desenho não define etapas. Escreva dose, datas e duração de cada redução exatamente como prescritas.</p>
  </section>`;
}

function renderSupportLibrary(root, { category, query, values, selectedSupportIds }) {
  const categoryData = prescriptionSupportCategories.find((item) => item.id === category) || prescriptionSupportCategories[0];
  const items = prescriptionSupportItemsFor(categoryData.id, query);
  const target = root.querySelector('[data-support-library]');
  const description = root.querySelector('[data-support-description]');
  if (!target || !description) return;

  root.querySelectorAll('[data-support-category]').forEach((button) => {
    const selected = button.dataset.supportCategory === categoryData.id;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  target.setAttribute('aria-labelledby', `prescription-tab-${categoryData.id}`);
  description.textContent = categoryData.description;
  root.querySelector('[data-cultural-note]').hidden = categoryData.id !== 'indigenous';
  root.querySelector('[data-taper-note]').hidden = categoryData.id !== 'taper';

  if (!items.length) {
    target.innerHTML = '<p class="prescription-support-empty">Nenhuma imagem encontrada nesta categoria.</p>';
    return;
  }

  target.innerHTML = items.map((item) => {
    const selected = item.action === 'support'
      ? selectedSupportIds.includes(item.id)
      : (item.action === 'route' && values.route === item.id) || (item.action === 'schedule' && values.schedule === item.id);
    const actionLabel = item.action === 'support' ? (selected ? 'Remover' : 'Selecionar') : 'Aplicar';
    return `<button type="button" class="prescription-support-card" data-support-item="${escapeHtml(item.id)}" aria-pressed="${selected ? 'true' : 'false'}">
      <span class="prescription-support-card-visual">${renderSupportVisual(item)}</span>
      <strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.hint || '')}</small><span class="prescription-support-card-action">${actionLabel}</span>
    </button>`;
  }).join('');
}

function renderSupportVisual(item) {
  if (item?.image) return `<img src="${escapeHtml(item.image)}" alt="" aria-hidden="true">`;
  if (item?.icon) return renderFlaticonIcon(item.icon);
  return '';
}

function parseSupportIds(value) {
  return String(value || '').split(',').map((id) => id.trim()).filter((id) => getPrescriptionSupportItem(id)?.action === 'support').slice(0, MAX_OPTIONAL_SUPPORTS);
}

function syncSupportField(form, selectedSupportIds) {
  if (form?.elements?.support_ids) form.elements.support_ids.value = selectedSupportIds.join(',');
}

function appendObservation(current, addition) {
  const cleanCurrent = String(current || '').trim();
  const cleanAddition = String(addition || '').trim();
  if (!cleanAddition || cleanCurrent.toLocaleLowerCase('pt-BR').includes(cleanAddition.toLocaleLowerCase('pt-BR'))) return cleanCurrent;
  return [cleanCurrent, cleanAddition].filter(Boolean).join('; ').slice(0, 220);
}

function applyPrescriptionTemplate(form, template) {
  form.elements.route.value = template.route;
  form.elements.schedule.value = template.schedule;
  if (template.observation) form.elements.observation.value = appendObservation(form.elements.observation.value, template.observation);
}

function renderChoiceGroup(name, legend, options) {
  const mealHelp = name === 'schedule'
    ? '<p class="prescription-choice-help"><strong>Se for antes ou depois do café da manhã, almoço, jantar ou em jejum:</strong> escreva na observação quanto tempo antes ou depois e se pode beber água.</p>'
    : '';
  return `<fieldset class="prescription-choice-group"><legend>${escapeHtml(legend)}</legend><div>${options.map((option, index) => `<label class="prescription-choice"><input type="radio" name="${name}" value="${escapeHtml(option.id)}" ${index === 0 ? 'checked' : ''}><span><img src="${escapeHtml(option.image)}" alt="" aria-hidden="true"><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.hint)}</small></span></label>`).join('')}</div>${mealHelp}</fieldset>`;
}

function renderCurrentPreview(root, values) {
  const target = root.querySelector('[data-current-preview]');
  const medication = String(values.medication || '').trim();
  const dose = String(values.dose || '').trim();
  if (!medication && !dose) {
    target.innerHTML = '<span>Prévia do item atual</span><p>Comece informando o medicamento e a dose.</p>';
    return;
  }
  target.innerHTML = renderVisualInstruction({ medication: medication || 'Medicamento', dose: dose || 'Dose a confirmar', route: values.route, schedule: values.schedule, observation: String(values.observation || '').trim() }, { compact: true });
}

function renderPrescriptionItems(root, items) {
  const list = root.querySelector('[data-prescription-items]');
  const empty = root.querySelector('[data-prescription-empty]');
  const count = root.querySelector('[data-prescription-count]');
  count.textContent = `${items.length} ${items.length === 1 ? 'item' : 'itens'}`;
  empty.hidden = items.length > 0;
  list.hidden = items.length === 0;
  list.innerHTML = items.map((item, index) => `<li><span class="prescription-item-number">${index + 1}</span>${renderVisualInstruction(item, { compact: true })}<button type="button" class="prescription-remove-item" data-remove-prescription-item="${escapeHtml(item.id)}" aria-label="Remover orientação ${index + 1}">Remover</button></li>`).join('');
}

function renderVisualInstruction(item, { compact = false } = {}) {
  const route = getPrescriptionRoute(item.route);
  const schedule = getPrescriptionSchedule(item.schedule);
  const supports = (Array.isArray(item.supports) ? item.supports : parseSupportIds(item.support_ids)).map(getPrescriptionSupportItem).filter(Boolean);
  const figures = [
    `<figure><img src="${escapeHtml(route.image)}" alt=""><figcaption>${escapeHtml(route.label)}</figcaption></figure>`,
    `<figure><img src="${escapeHtml(schedule.image)}" alt=""><figcaption>${escapeHtml(schedule.label)}</figcaption></figure>`,
    ...supports.map((support) => `<figure>${renderSupportVisual(support)}<figcaption>${escapeHtml(support.label)}</figcaption></figure>`)
  ];
  return `<article class="prescription-visual-instruction${compact ? ' compact' : ''}"><div class="prescription-instruction-text"><strong>${escapeHtml(item.medication)}</strong><span>${escapeHtml(item.dose)}</span>${item.observation ? `<small>${escapeHtml(item.observation)}</small>` : ''}</div><div class="prescription-pictograms">${figures.join('')}</div></article>`;
}

function ensurePrintable(items, status) {
  if (items.length) return true;
  setStatus(status, 'Adicione ao menos uma orientação antes de imprimir ou baixar o PDF.', 'error');
  return false;
}

function buildPrescriptionPrint(items, state) {
  const profile = state.profile || {};
  const context = state.context || {};
  const professional = [profile.full_name, roleLabel(profile), context.unit?.short_name || profile.unit_name].filter(Boolean).join(' • ');
  return `<article class="prescription-print-sheet"><header><strong>Território Vivo • Orientações visuais</strong><span>${escapeHtml(professional)}</span></header><h1>Como usar os medicamentos</h1><p class="prescription-print-warning">Confira estas orientações com a receita original. Os desenhos ajudam na compreensão, mas não substituem a prescrição nem a orientação profissional.</p><ol>${items.map((item) => `<li>${renderVisualInstruction(item)}</li>`).join('')}</ol><footer>Revise dose, via, frequência, duração e observações antes de entregar. Em caso de dúvida, procure a equipe de saúde.</footer></article>`;
}
