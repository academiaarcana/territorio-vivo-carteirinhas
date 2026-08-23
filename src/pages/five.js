import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml, formToObject, setStatus, formatDateBr } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { printHtml, downloadPdf } from '../utils/print.js';

export function renderFivePage({ state }) {
  const profile = state.profile || {};
  const content = `
    <section class="two-column">
      <article class="panel"><p class="eyebrow">Rotina curta</p><h2>5 minutos do território</h2><p>Uma pessoa traz um achado. A equipe decide o próximo passo. Na reunião seguinte, revisa o que aconteceu.</p><ol class="process-list"><li>O que mudou?</li><li>Quem precisa de atenção?</li><li>Há risco, barreira, recurso ou potencialidade?</li><li>Qual dado está faltando?</li><li>Qual decisão cabe agora?</li></ol><div class="decision-tags"><span>Atualizar</span><span>Visitar</span><span>Buscar</span><span>Notificar</span><span>Articular</span><span>Acompanhar</span></div></article>
      <article class="panel"><h2>Nota para a reunião</h2><p class="privacy-note">Este formulário é temporário e não é salvo no banco. Registre somente o necessário para a discussão da equipe.</p><form id="five-form" class="stack-form" autocomplete="off"><label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}" maxlength="40"></label><label>Quem / onde<input name="where" maxlength="240" placeholder="Pessoa, família ou ponto do território"></label><label>O que mudou?<textarea name="finding" rows="4" maxlength="1200" placeholder="Registre somente o essencial"></textarea></label><label>O que precisa ser decidido?<textarea name="decision" rows="4" maxlength="1200"></textarea></label><label>Responsável / retorno<input name="responsible" maxlength="200"></label><label>Revisar quando<input name="review" type="date"></label><div class="actions"><button type="button" class="button primary" id="five-print">Imprimir nota</button><button type="button" class="button" id="five-pdf">Baixar PDF</button><button type="reset" class="button">Limpar</button></div><p id="five-status" class="form-status" aria-live="polite"></p></form></article>
    </section>`;
  return appLayout({ title: '5 minutos do território', subtitle: 'Achado curto, decisão clara e reavaliação.', activePath: '/app/5-minutos', content });
}

export function mountFivePage({ root, state }) {
  mountAppLayout(root);
  const form = root.querySelector('#five-form');
  const status = root.querySelector('#five-status');
  const build = () => buildFivePrint(form, state);

  root.querySelector('#five-print').addEventListener('click', () => {
    printHtml(build(), { className: 'five-print', title: '5 minutos do território' });
    setStatus(status, 'Janela de impressão aberta.', 'success');
  });

  root.querySelector('#five-pdf').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (button.disabled) return;
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

  form.addEventListener('reset', () => setTimeout(() => setStatus(status, '', ''), 0));
}

function buildFivePrint(form, state) {
  const values = formToObject(form);
  const profile = state.profile || {};
  const context = state.context || {};
  const location = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name, values.microarea ? `Microárea ${values.microarea}` : ''].filter(Boolean).join(' • ');
  return `<article class="five-print-sheet"><header><strong>Território Vivo • 5 minutos do território</strong><span>${escapeHtml(location)}</span></header><dl><div><dt>Quem / onde</dt><dd>${escapeHtml(values.where || '—')}</dd></div><div><dt>Achado / mudança</dt><dd>${escapeHtml(values.finding || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>Decisão necessária</dt><dd>${escapeHtml(values.decision || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>Responsável / retorno</dt><dd>${escapeHtml(values.responsible || '—')}</dd></div><div><dt>Revisar</dt><dd>${values.review ? escapeHtml(formatDateBr(values.review)) : '—'}</dd></div></dl><footer>Transforme o achado em decisão, ação e reavaliação. Esta nota é apoio temporário e não substitui o registro assistencial adequado.</footer></article>`;
}
