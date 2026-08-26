import { appLayout, mountAppLayout } from '../core/layout.js';
import { applyNamedFormValues, clearVolatileDraft, readNamedFormValues, readVolatileDraft, writeVolatileDraft } from '../core/volatile-drafts.js';
import { escapeHtml, formToObject, setStatus, formatDateBr } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { applyPrintAccessibilityOptions, printAccessibilityClasses, readPrintAccessibilityOptions, renderPrintAccessibilityOptions } from '../lib/print-accessibility.js';
import { renderFlaticonIcon, renderVisualSupports } from '../lib/visual-support.js';
import { printHtml, downloadPdf } from '../utils/print.js';

const FIVE_DRAFT_KEY = 'five-minutes';

export function renderFivePage({ state }) {
  const profile = state.profile || {};
  const content = `
    <section class="panel five-intro-panel">
      <div class="five-intro-icon">${renderFlaticonIcon('clock')}</div>
      <div><p class="eyebrow">Reunião rápida, decisão possível</p><h2>Leve um achado do território até um próximo passo.</h2><p>Uma conversa curta para observar, interpretar, combinar uma ação e definir quando a equipe vai reavaliar.</p></div>
      <div class="five-duration" aria-label="Duração sugerida: cinco minutos"><strong>5</strong><span>minutos<br>sugeridos</span></div>
    </section>
    <section class="two-column five-workbench">
      <article class="panel five-guide-panel"><p class="eyebrow">Roteiro da equipe</p><h2>Conduza a conversa em quatro movimentos</h2><p class="five-guide-intro">Comece pelo que foi observado e termine com uma revisão combinada. A nota serve como apoio para a conversa, não como prontuário.</p><ol class="five-journey"><li><span class="five-step-number">1</span>${renderFlaticonIcon('location', { className: 'five-step-icon' })}<div><strong>Observar</strong><p>O que mudou e onde isso foi percebido?</p></div></li><li><span class="five-step-number">2</span>${renderFlaticonIcon('warning', { className: 'five-step-icon' })}<div><strong>Interpretar</strong><p>Por que importa agora: risco, barreira, recurso ou potencialidade?</p></div></li><li><span class="five-step-number">3</span>${renderFlaticonIcon('action', { className: 'five-step-icon' })}<div><strong>Combinar ação</strong><p>Qual decisão cabe agora e quem pode colaborar?</p></div></li><li><span class="five-step-number">4</span>${renderFlaticonIcon('calendar', { className: 'five-step-icon' })}<div><strong>Reavaliar</strong><p>Quando a equipe vai retomar o assunto?</p></div></li></ol><div class="five-decision-block"><strong>Próximos passos possíveis</strong><div class="decision-tags"><span>Atualizar</span><span>Visitar território</span><span>Buscar informação</span><span>Articular rede</span><span>Comunicar</span><span>Acompanhar</span></div></div><p class="field-hint five-privacy-reminder"><strong>Não registre nomes de pacientes ou famílias.</strong> Situações individuais identificáveis devem permanecer nos sistemas e fluxos assistenciais adequados.</p></article>
      <article class="panel five-note-panel"><header class="five-note-heading"><p class="eyebrow">Registro temporário</p><h2>Nota para a reunião</h2><p>Preencha apenas o necessário para orientar a decisão da equipe.</p></header><p class="privacy-note">Este formulário é temporário e não é salvo no banco. Ao navegar por outras telas, o rascunho continua nesta aba; ele desaparece ao recarregar, fechar a aba ou sair da conta.</p><form id="five-form" class="stack-form five-note-form" autocomplete="off"><section class="five-form-section" aria-labelledby="five-observe-heading"><header><span>1</span><div><h3 id="five-observe-heading">Observe</h3><p>Localize o achado e descreva a mudança.</p></div></header><div class="five-form-grid"><label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}" maxlength="40"></label><label>Situação / onde<input name="where" maxlength="240" placeholder="Ex.: acesso à ponte, praça, escola, trecho da microárea"></label><label class="full">O que mudou?<textarea name="finding" rows="3" maxlength="1200" placeholder="Descreva o achado territorial sem identificar pessoas"></textarea></label></div></section><section class="five-form-section" aria-labelledby="five-interpret-heading"><header><span>2</span><div><h3 id="five-interpret-heading">Interprete</h3><p>Dê sentido ao achado para a realidade da equipe.</p></div></header><label>Por que isso importa agora?<textarea name="importance" rows="3" maxlength="1200" placeholder="Impacto, barreira, oportunidade ou necessidade percebida"></textarea></label></section><section class="five-form-section" aria-labelledby="five-action-heading"><header><span>3</span><div><h3 id="five-action-heading">Combine a ação</h3><p>Registre uma decisão possível e a articulação necessária.</p></div></header><div class="five-form-grid"><label class="full">O que precisa ser decidido?<textarea name="decision" rows="3" maxlength="1200" placeholder="Próximo passo possível para a equipe"></textarea></label><label>Responsável / articulação<input name="responsible" maxlength="200" placeholder="Função, equipe, serviço ou parceiro — evite nomes pessoais"></label><label>Revisar quando<input name="review" type="date"></label></div></section><section class="five-output-section" aria-labelledby="five-output-heading"><header><p class="eyebrow">4 · Reavalie</p><h3 id="five-output-heading">Prepare a nota para a equipe</h3></header>${renderPrintAccessibilityOptions('five')}<div class="actions five-note-actions"><button type="button" class="button" id="five-pdf">Baixar PDF</button><button type="button" class="button primary" id="five-print">Imprimir nota</button><button type="reset" class="button five-clear-button">Limpar</button></div><p id="five-status" class="form-status" aria-live="polite"></p></section></form></article>
    </section>`;
  return appLayout({ title: '5 minutos do território', subtitle: 'Achado, significado, decisão e reavaliação em uma conversa curta.', activePath: '/app/5-minutos', content });
}

export function mountFivePage({ root, state }) {
  mountAppLayout(root);
  const form = root.querySelector('#five-form');
  const status = root.querySelector('#five-status');
  const draft = readVolatileDraft(FIVE_DRAFT_KEY, {});
  applyNamedFormValues(form, draft.values || {});
  applyPrintAccessibilityOptions(root, 'five', draft.options || {});

  const persist = () => writeVolatileDraft(FIVE_DRAFT_KEY, {
    values: readNamedFormValues(form),
    options: readPrintAccessibilityOptions(root, 'five')
  });
  const build = () => buildFivePrint(form, state, readPrintAccessibilityOptions(root, 'five'));

  form.addEventListener('input', persist);
  form.addEventListener('change', persist);

  root.querySelector('#five-print').addEventListener('click', () => {
    persist();
    printHtml(build(), { className: 'five-print', title: '5 minutos do território' });
    setStatus(status, 'Janela de impressão aberta.', 'success');
  });

  root.querySelector('#five-pdf').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (button.disabled) return;
    persist();
    setButtonBusy(button, true, 'Gerando PDF…');
    setStatus(status, 'Gerando PDF…', 'info');
    try {
      const result = await downloadPdf(build(), { className: 'five-print', title: '5 minutos do território' });
      setStatus(status, result.mode === 'pdf' ? 'PDF gerado.' : 'Gerador de PDF indisponível; a impressão foi aberta como alternativa.', result.mode === 'pdf' ? 'success' : 'info');
    } catch (error) {
      console.error(error);
      setStatus(status, 'Não foi possível gerar o PDF.', 'error');
    } finally {
      setButtonBusy(button, false);
    }
  });

  form.addEventListener('reset', () => setTimeout(() => {
    clearVolatileDraft(FIVE_DRAFT_KEY);
    setStatus(status, '', '');
  }, 0));
}

function buildFivePrint(form, state, options = {}) {
  const values = formToObject(form);
  const profile = state.profile || {};
  const context = state.context || {};
  const location = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name, values.microarea ? `Microárea ${values.microarea}` : ''].filter(Boolean).join(' • ');
  const classes = printAccessibilityClasses(options);
  return `<article class="five-print-sheet ${classes}"><header><strong>Território Vivo • 5 minutos do território</strong><span>${escapeHtml(location)}</span></header><dl>${definition('Situação / onde', values.where || '—', { label: 'Situação / onde', value: values.where }, options)}${definition('Achado / mudança', escapeHtml(values.finding || '—').replace(/\n/g,'<br>'), { label: 'Achado / mudança', value: values.finding }, options, true)}${definition('Por que importa agora', escapeHtml(values.importance || '—').replace(/\n/g,'<br>'), { label: 'Importância', value: values.importance }, options, true)}${definition('Decisão necessária', escapeHtml(values.decision || '—').replace(/\n/g,'<br>'), { label: 'Próxima ação / decisão', value: values.decision }, options, true)}${definition('Responsável / articulação', values.responsible || '—', { label: 'Responsável / articulação', value: values.responsible }, options)}${definition('Revisar', values.review ? formatDateBr(values.review) : '—', { label: 'Data de revisão', value: values.review, type: 'date' }, options)}</dl><footer>Transforme o achado em significado, decisão, ação e reavaliação. Esta nota é apoio temporário e não substitui o registro assistencial adequado.</footer></article>`;
}

function definition(label, value, visualSubject, options, valueIsHtml = false) {
  const support = options.visualSupport ? renderVisualSupports(visualSubject, { max: 2 }) : '';
  const safeValue = valueIsHtml ? value : escapeHtml(value);
  return `<div class="${support ? 'has-visual-support' : ''}">${support}<dt>${escapeHtml(label)}</dt><dd>${safeValue}</dd></div>`;
}
