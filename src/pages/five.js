import { appLayout, mountAppLayout } from '../core/layout.js';
import { applyNamedFormValues, clearVolatileDraft, readNamedFormValues, readVolatileDraft, writeVolatileDraft } from '../core/volatile-drafts.js';
import { escapeHtml, formToObject, setStatus, formatDateBr } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { applyPrintAccessibilityOptions, printAccessibilityClasses, readPrintAccessibilityOptions, renderPrintAccessibilityOptions } from '../lib/print-accessibility.js';
import { renderVisualSupports } from '../lib/visual-support.js';
import { printHtml, downloadPdf } from '../utils/print.js';

const FIVE_DRAFT_KEY = 'five-minutes';

export function renderFivePage({ state }) {
  const profile = state.profile || {};
  const content = `
    <section class="two-column">
      <article class="panel"><p class="eyebrow">Rotina curta</p><h2>5 minutos do território</h2><p>Um achado territorial entra na conversa, ganha significado, vira um próximo passo e volta para revisão.</p><ol class="process-list"><li>O que mudou?</li><li>Por que isso importa agora?</li><li>Há risco, barreira, recurso ou potencialidade?</li><li>Quem pode colaborar dentro ou fora da saúde?</li><li>Qual decisão cabe agora?</li><li>Quando a equipe vai revisar?</li></ol><div class="decision-tags"><span>Atualizar</span><span>Visitar território</span><span>Buscar informação</span><span>Articular rede</span><span>Comunicar</span><span>Acompanhar</span></div><p class="field-hint"><strong>Não registre nomes de pacientes ou famílias.</strong> Situações individuais identificáveis devem permanecer nos sistemas e fluxos assistenciais adequados.</p></article>
      <article class="panel"><h2>Nota para a reunião</h2><p class="privacy-note">Este formulário é temporário e não é salvo no banco. Ao navegar por outras telas, o rascunho continua nesta aba; ele desaparece ao recarregar, fechar a aba ou sair da conta.</p><form id="five-form" class="stack-form" autocomplete="off"><label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}" maxlength="40"></label><label>Situação / onde<input name="where" maxlength="240" placeholder="Ex.: acesso à ponte, praça, escola, trecho da microárea"></label><label>O que mudou?<textarea name="finding" rows="3" maxlength="1200" placeholder="Descreva o achado territorial sem identificar pessoas"></textarea></label><label>Por que isso importa agora?<textarea name="importance" rows="3" maxlength="1200" placeholder="Impacto, barreira, oportunidade ou necessidade percebida"></textarea></label><label>O que precisa ser decidido?<textarea name="decision" rows="3" maxlength="1200" placeholder="Próximo passo possível para a equipe"></textarea></label><label>Responsável / articulação<input name="responsible" maxlength="200" placeholder="Função, equipe, serviço ou parceiro — evite nomes pessoais"></label><label>Revisar quando<input name="review" type="date"></label>${renderPrintAccessibilityOptions('five')}<div class="actions"><button type="button" class="button primary" id="five-print">Imprimir nota</button><button type="button" class="button" id="five-pdf">Baixar PDF</button><button type="reset" class="button">Limpar</button></div><p id="five-status" class="form-status" aria-live="polite"></p></form></article>
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
