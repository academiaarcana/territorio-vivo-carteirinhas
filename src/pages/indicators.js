import { appLayout, mountAppLayout } from '../core/layout.js';
import { indicatorDefinitions, indicatorGroups, indicatorScopes } from '../data/indicators.js';
import { escapeHtml, formToObject, setStatus } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { printHtml, downloadPdf } from '../utils/print.js';

export function renderIndicatorsPage({ state }) {
  const profile = state.profile || {};
  const grouped = Object.entries(indicatorGroups).map(([groupId, groupLabel]) => `
    <fieldset class="indicator-group"><legend>${escapeHtml(groupLabel)}</legend><div class="indicator-grid">${indicatorDefinitions.filter((item) => item.group === groupId).map((item) => `<label>${escapeHtml(item.label)}<input name="${escapeHtml(item.id)}" type="number" min="0" step="1" inputmode="numeric"></label>`).join('')}</div></fieldset>`).join('');
  const content = `
    <section class="two-column wide-left">
      <article class="panel"><p class="eyebrow">Planejamento</p><h2>Indicadores do território</h2><p>Preencha somente os números disponíveis. O formulário é temporário e não é salvo automaticamente.</p>
        <form id="indicator-form" class="profile-sections" autocomplete="off">
          <fieldset><legend>Referência</legend><div class="form-grid"><label>Escopo<select name="scope">${indicatorScopes.map((item) => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('')}</select></label><label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}" maxlength="40"></label><label>Período / referência<input name="period" maxlength="80" placeholder="Ex.: agosto/2026"></label></div></fieldset>
          ${grouped}
        </form>
        <div class="actions"><button class="button primary" id="indicators-print" type="button">Imprimir</button><button class="button" id="indicators-pdf" type="button">Baixar PDF</button><button class="button" id="indicators-clear" type="button">Limpar</button></div><p id="indicators-status" class="form-status" aria-live="polite"></p>
      </article>
      <article class="panel"><p class="eyebrow">Sistema × território</p><h2>O número sozinho não explica.</h2><p class="privacy-note">Use esta reflexão para planejamento. Ela é temporária e não é gravada no Supabase.</p><form id="reflection-form" class="stack-form" autocomplete="off"><label>O sistema mostra<textarea name="system" rows="4" maxlength="1600"></textarea></label><label>No território observamos<textarea name="territory" rows="4" maxlength="1600"></textarea></label><label>O que ainda não sabemos<textarea name="unknown" rows="4" maxlength="1600"></textarea></label><label>Próxima ação<textarea name="action" rows="4" maxlength="1600"></textarea></label></form></article>
    </section>`;
  return appLayout({ title: 'Indicadores', subtitle: 'Números como apoio ao planejamento, não como ranking.', activePath: '/app/indicadores', content });
}

export function mountIndicatorsPage({ root, state }) {
  mountAppLayout(root);
  const form = root.querySelector('#indicator-form');
  const reflection = root.querySelector('#reflection-form');
  const status = root.querySelector('#indicators-status');
  const scope = form.elements.scope;
  const microarea = form.elements.microarea;
  const build = () => buildIndicatorPrint(root, state);

  function syncScope() {
    const team = scope.value === 'team';
    microarea.disabled = team;
    if (team) microarea.value = '';
    else if (!microarea.value) microarea.value = state.profile?.microarea || '';
  }
  scope.addEventListener('change', syncScope);
  syncScope();

  root.querySelector('#indicators-print').addEventListener('click', () => {
    printHtml(build(), { title: 'Indicadores do território', className: 'indicators-print' });
    setStatus(status, 'Janela de impressão aberta.', 'success');
  });
  root.querySelector('#indicators-pdf').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (button.disabled) return;
    setButtonBusy(button, true, 'Gerando PDF…');
    setStatus(status, 'Gerando PDF…', 'info');
    try {
      const result = await downloadPdf(build(), { title: 'Indicadores do território', className: 'indicators-print' });
      setStatus(status, result.mode === 'pdf' ? 'PDF gerado.' : 'Gerador de PDF indisponível; a impressão foi aberta como alternativa.', result.mode === 'pdf' ? 'success' : 'info');
    } catch (error) {
      console.error(error);
      setStatus(status, 'Não foi possível gerar o PDF.', 'error');
    } finally {
      setButtonBusy(button, false);
    }
  });
  root.querySelector('#indicators-clear').addEventListener('click', () => {
    form.reset();
    reflection.reset();
    form.elements.microarea.value = state.profile?.microarea || '';
    syncScope();
    setStatus(status, '', '');
  });
}

function buildIndicatorPrint(root, state) {
  const values = formToObject(root.querySelector('#indicator-form'));
  const reflection = formToObject(root.querySelector('#reflection-form'));
  const profile = state.profile || {};
  const context = state.context || {};
  const scopeLabel = values.scope === 'team' ? 'Equipe' : (values.microarea ? `Microárea ${values.microarea}` : 'Microárea');
  const heading = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name, scopeLabel].filter(Boolean).join(' • ');
  const rows = indicatorDefinitions.map((item) => ({ ...item, value: values[item.id] })).filter((item) => item.value !== '');
  const groupedRows = Object.entries(indicatorGroups).map(([groupId, groupLabel]) => {
    const groupRows = rows.filter((row) => row.group === groupId);
    if (!groupRows.length) return '';
    return `<h3>${escapeHtml(groupLabel)}</h3><table><tbody>${groupRows.map((row) => `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`).join('')}</tbody></table>`;
  }).join('');
  return `<article class="indicator-print-sheet"><header><strong>Território Vivo • Indicadores</strong><span>${escapeHtml(heading)}</span></header>${values.period ? `<p><strong>Período:</strong> ${escapeHtml(values.period)}</p>` : ''}<section><h2>Indicadores informados</h2>${groupedRows || '<p>Nenhum valor preenchido.</p>'}</section><section><h2>Leitura do território</h2><dl><div><dt>O sistema mostra</dt><dd>${escapeHtml(reflection.system || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>No território observamos</dt><dd>${escapeHtml(reflection.territory || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>O que ainda não sabemos</dt><dd>${escapeHtml(reflection.unknown || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>Próxima ação</dt><dd>${escapeHtml(reflection.action || '—').replace(/\n/g,'<br>')}</dd></div></dl></section><footer>Avaliar a ferramenta e a necessidade do território, não comparar trabalhadores.</footer></article>`;
}
