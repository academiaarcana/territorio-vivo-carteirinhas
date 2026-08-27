import { appLayout, mountAppLayout } from '../core/layout.js';
import { applyNamedFormValues, clearVolatileDraft, readNamedFormValues, readVolatileDraft, writeVolatileDraft } from '../core/volatile-drafts.js';
import { getPrescriptionRoute, getPrescriptionSchedule, prescriptionRoutes, prescriptionSchedules } from '../data/prescription-support.js';
import { escapeHtml, setStatus } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { renderFlaticonIcon } from '../lib/visual-support.js';
import { ROLES, roleLabel } from '../core/permissions.js';
import { printHtml, downloadPdf } from '../utils/print.js';

const CUIDADO_PARA_TODOS_URL = 'https://www.cuidadoparatodos.com.br/';
const PRESCRIPTION_DRAFT_KEY = 'accessible-prescription-builder';

const emptyDraft = () => ({
  values: { source_text: '', medication: '', dose: '', route: 'oral', schedule: 'morning', observation: '' },
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
      <div class="prescription-external-reference"><div><strong>Biblioteca externa de referência</strong><span>O Cuidado Para Todos continua disponível em outra página, com conta e políticas próprias.</span></div><a class="button" href="${CUIDADO_PARA_TODOS_URL}" target="_blank" rel="noopener noreferrer">Abrir Cuidado Para Todos <span aria-hidden="true">↗</span></a></div>
    </section>`;

  return appLayout({ title: 'Prescrições e receitas', subtitle: 'Acesso exclusivo para médicas(os) e enfermeiras(os) com perfil ativo.', activePath: '/app/prescricoes', content });
}

export function mountPrescriptionsPage({ root, state }) {
  mountAppLayout(root);
  const form = root.querySelector('#prescription-builder-form');
  const status = root.querySelector('[data-prescription-status]');
  let draft = readVolatileDraft(PRESCRIPTION_DRAFT_KEY, emptyDraft());
  draft.items = Array.isArray(draft.items) ? draft.items : [];
  applyNamedFormValues(form, draft.values || {});

  const persist = () => {
    draft.values = readNamedFormValues(form);
    writeVolatileDraft(PRESCRIPTION_DRAFT_KEY, draft);
  };
  const refresh = () => {
    renderCurrentPreview(root, readNamedFormValues(form));
    renderPrescriptionItems(root, draft.items);
  };

  form.addEventListener('input', () => { persist(); refresh(); });
  form.addEventListener('change', () => { persist(); refresh(); });
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
      observation: String(values.observation || '').trim()
    });
    values.medication = '';
    values.dose = '';
    values.observation = '';
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

  refresh();
}

function renderChoiceGroup(name, legend, options) {
  return `<fieldset class="prescription-choice-group"><legend>${escapeHtml(legend)}</legend><div>${options.map((option, index) => `<label class="prescription-choice"><input type="radio" name="${name}" value="${escapeHtml(option.id)}" ${index === 0 ? 'checked' : ''}><span><img src="${escapeHtml(option.image)}" alt="" aria-hidden="true"><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.hint)}</small></span></label>`).join('')}</div></fieldset>`;
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
  return `<article class="prescription-visual-instruction${compact ? ' compact' : ''}"><div class="prescription-instruction-text"><strong>${escapeHtml(item.medication)}</strong><span>${escapeHtml(item.dose)}</span>${item.observation ? `<small>${escapeHtml(item.observation)}</small>` : ''}</div><div class="prescription-pictograms"><figure><img src="${escapeHtml(route.image)}" alt=""><figcaption>${escapeHtml(route.label)}</figcaption></figure><span aria-hidden="true">+</span><figure><img src="${escapeHtml(schedule.image)}" alt=""><figcaption>${escapeHtml(schedule.label)}</figcaption></figure></div></article>`;
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
