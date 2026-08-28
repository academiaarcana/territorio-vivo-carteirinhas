import { appLayout, mountAppLayout } from '../core/layout.js';
import { clearVolatileDraft, readNamedFormValues, readVolatileDraft, writeVolatileDraft } from '../core/volatile-drafts.js';
import { getTreatmentGuide, treatmentGuideCategories, treatmentGuides, treatmentGuidesFor } from '../data/treatment-guides.js';
import { escapeHtml, setStatus } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { renderFlaticonIcon } from '../lib/visual-support.js';
import { ROLES, roleLabel } from '../core/permissions.js';
import { downloadPdf, printHtml } from '../utils/print.js';

const TREATMENT_DRAFT_KEY = 'illustrated-treatment-guides';
const CLINICAL_ROLES = [ROLES.PHYSICIAN, ROLES.NURSE];
const emptyProfessionalValues = () => ({ medication: '', laboratory: '', presentation: '', dose: '', when: '', duration: '', notes: '', breaths: '' });

export function renderTreatmentsPage({ state }) {
  const profile = state.profile || {};
  const clinical = CLINICAL_ROLES.includes(profile.role);
  const accessCopy = clinical
    ? 'Você pode consultar os passos e acrescentar medicamento, laboratório, dose e horários antes de imprimir.'
    : profile.role === ROLES.ACS
      ? 'Você pode consultar, ouvir, explicar e imprimir os passos gerais. A dose continua sendo definida por médica(o) ou enfermeira(o).'
      : 'Você pode consultar e imprimir os passos gerais para apoiar a orientação da equipe.';
  const content = `
    <section class="treatment-hero panel">
      <div class="treatment-hero-icon">${renderFlaticonIcon('medicine')}</div>
      <div><p class="eyebrow">Comunicação simples e segura</p><h2>Tratamentos Ilustrados Mais Frequentes</h2><p>Passos grandes, frases curtas e imagens originais para explicar sem depender de leitura difícil. ${escapeHtml(accessCopy)}</p></div>
      <span class="treatment-role-badge">${escapeHtml(roleLabel(profile))}</span>
    </section>
    <section class="treatment-safety-band" aria-labelledby="treatment-safety-title">
      ${renderFlaticonIcon('warning')}
      <div><p class="eyebrow">Antes de orientar</p><h2 id="treatment-safety-title">Confira sempre a receita, o produto e a demonstração da equipe</h2><p>Estas imagens ajudam a compreender. Não substituem prescrição, bula, protocolo do serviço ou treinamento presencial.</p></div>
    </section>
    <section class="panel treatment-browser" aria-labelledby="treatment-library-title">
      <header class="treatment-browser-heading">
        <div><p class="eyebrow">Escolha um assunto</p><h2 id="treatment-library-title">Guias disponíveis</h2><p>${treatmentGuides.length} orientações organizadas por tipo de cuidado.</p></div>
        <label>Buscar tratamento<input type="search" data-treatment-search maxlength="80" placeholder="Ex.: bombinha, insulina, olhos"></label>
      </header>
      <div class="treatment-category-tabs" role="tablist" aria-label="Categorias dos tratamentos" data-treatment-categories>
        ${treatmentGuideCategories.map((category, index) => `<button type="button" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" tabindex="${index === 0 ? '0' : '-1'}" data-treatment-category="${escapeHtml(category.id)}">${escapeHtml(category.label)}</button>`).join('')}
      </div>
      <div class="treatment-workbench">
        <div class="treatment-guide-list" data-treatment-list aria-live="polite"></div>
        <article class="treatment-guide-detail" data-treatment-detail></article>
      </div>
      <p class="form-status" data-treatment-status aria-live="polite"></p>
    </section>
    <section class="treatment-privacy panel">
      <div>${renderFlaticonIcon('document')}<div><p class="eyebrow">Privacidade</p><h2>Não escreva nome, CPF ou diagnóstico</h2></div></div>
      <p>A personalização fica apenas na memória desta aba. Nada desta página é salvo no Supabase, no PEC ou no navegador. Ao fechar ou recarregar a página, o conteúdo pode desaparecer.</p>
    </section>`;

  return appLayout({
    title: 'Tratamentos ilustrados',
    subtitle: 'Apoio acessível para ACS, médicas(os) e enfermeiras(os).',
    activePath: '/app/tratamentos',
    content
  });
}

export function mountTreatmentsPage({ root, state }) {
  mountAppLayout(root);
  const profile = state.profile || {};
  const clinical = CLINICAL_ROLES.includes(profile.role);
  const status = root.querySelector('[data-treatment-status]');
  const search = root.querySelector('[data-treatment-search]');
  let activeCategory = 'all';
  let selectedId = treatmentGuides[0].id;
  let draft = readVolatileDraft(TREATMENT_DRAFT_KEY, { byGuide: {} });
  draft.byGuide = draft?.byGuide && typeof draft.byGuide === 'object' ? draft.byGuide : {};

  const render = () => {
    const guides = treatmentGuidesFor(activeCategory, search.value);
    if (!guides.some((guide) => guide.id === selectedId)) selectedId = guides[0]?.id || treatmentGuides[0].id;
    renderTreatmentList(root, guides, selectedId);
    renderTreatmentDetail(root, getTreatmentGuide(selectedId), {
      clinical,
      profile,
      values: draft.byGuide[selectedId] || emptyProfessionalValues()
    });
    bindDetailEvents();
  };

  const persistForm = () => {
    const form = root.querySelector('[data-treatment-professional-form]');
    if (!form) return;
    draft.byGuide[selectedId] = readNamedFormValues(form);
    writeVolatileDraft(TREATMENT_DRAFT_KEY, draft);
  };

  const bindDetailEvents = () => {
    const form = root.querySelector('[data-treatment-professional-form]');
    form?.addEventListener('input', persistForm);
    form?.addEventListener('change', persistForm);

    root.querySelector('[data-treatment-listen]')?.addEventListener('click', () => {
      persistForm();
      speakGuide(getTreatmentGuide(selectedId), draft.byGuide[selectedId] || emptyProfessionalValues(), status);
    });

    root.querySelector('[data-treatment-print]')?.addEventListener('click', () => {
      persistForm();
      const values = draft.byGuide[selectedId] || emptyProfessionalValues();
      if (!validateProfessionalFields(values, clinical, status)) return;
      printHtml(buildTreatmentPrint(getTreatmentGuide(selectedId), values, state), { className: 'treatment-print', title: getTreatmentGuide(selectedId).shortTitle });
      setStatus(status, 'Janela de impressão aberta.', 'success');
    });

    root.querySelector('[data-treatment-pdf]')?.addEventListener('click', async (event) => {
      persistForm();
      const values = draft.byGuide[selectedId] || emptyProfessionalValues();
      if (!validateProfessionalFields(values, clinical, status)) return;
      const button = event.currentTarget;
      setButtonBusy(button, true, 'Gerando PDF…');
      setStatus(status, 'Gerando PDF…', 'info');
      try {
        await downloadPdf(buildTreatmentPrint(getTreatmentGuide(selectedId), values, state), { className: 'treatment-print', title: getTreatmentGuide(selectedId).shortTitle });
        setStatus(status, 'PDF gerado.', 'success');
      } catch (error) {
        console.error(error);
        setStatus(status, 'Não foi possível gerar o PDF.', 'error');
      } finally {
        setButtonBusy(button, false);
      }
    });

    root.querySelector('[data-treatment-clear]')?.addEventListener('click', () => {
      delete draft.byGuide[selectedId];
      if (Object.keys(draft.byGuide).length) writeVolatileDraft(TREATMENT_DRAFT_KEY, draft);
      else clearVolatileDraft(TREATMENT_DRAFT_KEY);
      render();
      setStatus(status, 'Campos temporários apagados.', 'success');
    });
  };

  root.querySelector('[data-treatment-list]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-treatment-guide]');
    if (!button) return;
    persistForm();
    selectedId = button.dataset.treatmentGuide;
    render();
    root.querySelector('[data-treatment-detail]')?.focus();
  });

  root.querySelector('[data-treatment-categories]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-treatment-category]');
    if (!button) return;
    persistForm();
    activeCategory = button.dataset.treatmentCategory;
    syncCategoryTabs(root, activeCategory);
    render();
  });

  root.querySelector('[data-treatment-categories]').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...root.querySelectorAll('[data-treatment-category]')];
    const current = buttons.indexOf(event.target.closest('[data-treatment-category]'));
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    activeCategory = buttons[next].dataset.treatmentCategory;
    syncCategoryTabs(root, activeCategory);
    render();
    buttons[next].focus();
  });

  search.addEventListener('input', render);
  render();
}

function syncCategoryTabs(root, activeCategory) {
  root.querySelectorAll('[data-treatment-category]').forEach((button) => {
    const active = button.dataset.treatmentCategory === activeCategory;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

function renderTreatmentList(root, guides, selectedId) {
  const target = root.querySelector('[data-treatment-list]');
  if (!guides.length) {
    target.innerHTML = '<p class="treatment-no-results">Nenhum tratamento encontrado. Tente outra palavra.</p>';
    return;
  }
  target.innerHTML = guides.map((guide) => `<button type="button" class="treatment-guide-card" data-treatment-guide="${escapeHtml(guide.id)}" aria-pressed="${guide.id === selectedId ? 'true' : 'false'}">
    <span class="treatment-guide-card-visual">${renderGuideImage(guide)}</span>
    <span><strong>${escapeHtml(guide.shortTitle)}</strong><small>${escapeHtml(guide.summary)}</small></span>
    <span class="treatment-open-label">${guide.id === selectedId ? 'Aberto' : 'Ver passos'}</span>
  </button>`).join('');
}

function renderTreatmentDetail(root, guide, { clinical, profile, values }) {
  const target = root.querySelector('[data-treatment-detail]');
  target.tabIndex = -1;
  target.innerHTML = `
    <header class="treatment-detail-heading">
      <div><p class="eyebrow">Passo a passo</p><h2>${escapeHtml(guide.title)}</h2><p>${escapeHtml(guide.summary)}</p></div>
      <span>${guide.steps.length} passos</span>
    </header>
    <div class="treatment-detail-visual">${renderGuideImage(guide)}</div>
    <ol class="treatment-steps">${guide.steps.map((step, index) => `<li><span class="treatment-step-number" aria-hidden="true">${index + 1}</span><div><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.detail)}</p></div></li>`).join('')}</ol>
    <section class="treatment-alerts" aria-label="Atenções importantes">
      <h3>${renderFlaticonIcon('warning')} Atenção</h3>
      <ul>${guide.alerts.map((alert) => `<li>${escapeHtml(alert)}</li>`).join('')}</ul>
    </section>
    ${clinical ? renderProfessionalForm(values, profile, guide) : renderReadOnlyRole(profile)}
    <section class="treatment-understanding" aria-labelledby="treatment-understanding-title">
      <h3 id="treatment-understanding-title">Confirme sem constranger</h3>
      <p>Peça: <strong>“Mostre com suas mãos como você vai fazer em casa.”</strong> Se a pessoa se confundir, explique novamente usando um passo de cada vez.</p>
    </section>
    <div class="actions treatment-actions">
      <button class="button" type="button" data-treatment-listen>🔊 Ouvir passo a passo</button>
      <button class="button" type="button" data-treatment-pdf>Baixar PDF</button>
      <button class="button primary" type="button" data-treatment-print>Imprimir guia</button>
      ${clinical ? '<button class="button danger-link" type="button" data-treatment-clear>Limpar campos</button>' : ''}
    </div>
    <p class="treatment-source">Fonte de referência: ${guide.sourceUrl ? `<a href="${escapeHtml(guide.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(guide.sourceLabel)}</a>` : escapeHtml(guide.sourceLabel)}.</p>`;
}

function renderGuideImage(guide) {
  if (guide.image) return `<img src="${escapeHtml(guide.image)}" alt="" aria-hidden="true">`;
  if (guide.icon) return renderFlaticonIcon(guide.icon);
  return '';
}

function renderProfessionalForm(values, profile, guide) {
  const field = (name, label, placeholder, required = false) => `<label>${escapeHtml(label)}<input name="${name}" maxlength="160" value="${escapeHtml(values[name] || '')}" placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''}></label>`;
  return `<section class="treatment-professional-box" aria-labelledby="treatment-professional-title">
    <header><div><p class="eyebrow">Preenchimento profissional temporário</p><h3 id="treatment-professional-title">Complete conforme a receita e o produto entregue</h3></div><span>${escapeHtml(roleLabel(profile))}</span></header>
    <p>Se começar a preencher, complete todos os campos obrigatórios antes de imprimir. Não coloque identificação da pessoa.</p>
    <form class="treatment-professional-form" data-treatment-professional-form autocomplete="off">
      ${field('medication', 'Medicamento / princípio ativo *', 'Ex.: conforme a receita', true)}
      ${field('laboratory', 'Laboratório / fabricante *', 'Leia na embalagem', true)}
      ${field('presentation', 'Apresentação e concentração *', 'Ex.: caneta, frasco, spray', true)}
      ${field('dose', 'Dose ou quantidade *', 'Copie exatamente da receita', true)}
      ${field('when', 'Horário, intervalo ou relação com refeição *', 'Copie exatamente da receita', true)}
      ${field('duration', 'Duração ou uso contínuo *', 'Ex.: número de dias ou uso contínuo', true)}
      ${guide.id.includes('spacer') ? field('breaths', 'Respirações por jato', 'Quantidade orientada pela equipe') : ''}
      <label class="treatment-notes-field">Observação profissional<textarea name="notes" rows="3" maxlength="500" placeholder="Somente informação necessária para usar corretamente">${escapeHtml(values.notes || '')}</textarea></label>
    </form>
  </section>`;
}

function renderReadOnlyRole(profile) {
  const acs = profile?.role === ROLES.ACS;
  return `<section class="treatment-readonly-box"><strong>${acs ? 'Orientação para o ACS' : 'Consulta do guia'}</strong><p>${acs ? 'Explique os passos e confirme se a pessoa consegue demonstrar. Não defina dose, intervalo, troca de marca ou duração.' : 'Use o guia como apoio. A personalização clínica fica disponível apenas para médica(o) e enfermeira(o).'}</p></section>`;
}

function validateProfessionalFields(values, clinical, status) {
  if (!clinical) return true;
  const required = ['medication', 'laboratory', 'presentation', 'dose', 'when', 'duration'];
  const anyFilled = Object.values(values).some((value) => String(value || '').trim());
  if (!anyFilled) return true;
  const missing = required.some((name) => !String(values[name] || '').trim());
  if (!missing) return true;
  setStatus(status, 'Complete medicamento, laboratório, apresentação, dose, horário e duração; ou limpe todos os campos para imprimir o guia geral.', 'error');
  return false;
}

function speakGuide(guide, values, status) {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    setStatus(status, 'A leitura em voz alta não está disponível neste navegador.', 'error');
    return;
  }
  window.speechSynthesis.cancel();
  const professional = ['medication', 'laboratory', 'presentation', 'dose', 'when', 'duration']
    .map((key) => String(values[key] || '').trim()).filter(Boolean).join('. ');
  const steps = guide.steps.map((step, index) => `Passo ${index + 1}. ${step.title}. ${step.detail}`).join(' ');
  const alerts = guide.alerts.map((alert) => `Atenção. ${alert}`).join(' ');
  const utterance = new SpeechSynthesisUtterance([guide.title, professional, steps, alerts].filter(Boolean).join('. '));
  utterance.lang = 'pt-BR';
  utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
  setStatus(status, 'Leitura em voz alta iniciada.', 'success');
}

function buildTreatmentPrint(guide, values, state) {
  const profile = state.profile || {};
  const unit = state.context?.unit?.short_name || profile.unit_name || '';
  const professionalValues = [
    ['Medicamento', values.medication],
    ['Laboratório', values.laboratory],
    ['Apresentação', values.presentation],
    ['Dose', values.dose],
    ['Quando usar', values.when],
    ['Duração', values.duration],
    ['Respirações por jato', values.breaths],
    ['Observação', values.notes]
  ].filter(([, value]) => String(value || '').trim());
  return `<article class="treatment-print-sheet">
    <header><strong>Território Vivo • Tratamento ilustrado</strong><span>${escapeHtml([roleLabel(profile), unit].filter(Boolean).join(' • '))}</span></header>
    <h1>${escapeHtml(guide.title)}</h1>
    <p class="treatment-print-summary">${escapeHtml(guide.summary)}</p>
    ${guide.image ? `<img class="treatment-print-image" src="${escapeHtml(guide.image)}" alt="">` : ''}
    ${professionalValues.length ? `<dl class="treatment-print-values">${professionalValues.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>` : '<p class="treatment-print-generic"><strong>Guia geral:</strong> confira dose, produto, horário e duração na receita original.</p>'}
    <ol class="treatment-print-steps">${guide.steps.map((step, index) => `<li><span>${index + 1}</span><div><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.detail)}</p></div></li>`).join('')}</ol>
    <section class="treatment-print-alerts"><h2>Atenção</h2><ul>${guide.alerts.map((alert) => `<li>${escapeHtml(alert)}</li>`).join('')}</ul></section>
    <footer>Os desenhos ajudam a compreender, mas não substituem receita, bula, protocolo ou demonstração da equipe. Peça para a pessoa mostrar como fará em casa.</footer>
  </article>`;
}
