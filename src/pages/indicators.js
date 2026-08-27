import { appLayout, mountAppLayout } from '../core/layout.js';
import { applyNamedFormValues, clearVolatileDraft, readNamedFormValues, readVolatileDraft, writeVolatileDraft } from '../core/volatile-drafts.js';
import { indicatorDefinitions, indicatorGroups, indicatorScopes } from '../data/indicators.js';
import { escapeHtml, formToObject, setStatus } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { applyPrintAccessibilityOptions, printAccessibilityClasses, readPrintAccessibilityOptions, renderPrintAccessibilityOptions } from '../lib/print-accessibility.js';
import { renderFlaticonIcon, renderVisualSupports } from '../lib/visual-support.js';
import { printHtml, downloadPdf } from '../utils/print.js';

const INDICATORS_DRAFT_KEY = 'indicators';

const indicatorGroupIcons = {
  population: 'population',
  conditions: 'hypertension',
  care: 'visit',
  work: 'action'
};

export function renderIndicatorsPage({ state }) {
  const profile = state.profile || {};
  const grouped = Object.entries(indicatorGroups).map(([groupId, groupLabel]) => `
    <fieldset class="indicator-group" data-indicator-group="${escapeHtml(groupId)}"><legend>${renderFlaticonIcon(indicatorGroupIcons[groupId], { className: 'indicator-group-icon' })}<span>${escapeHtml(groupLabel)}</span></legend><div class="indicator-grid">${indicatorDefinitions.filter((item) => item.group === groupId).map((item) => `<label>${escapeHtml(item.label)}<input name="${escapeHtml(item.id)}" type="number" min="0" step="1" inputmode="numeric"></label>`).join('')}</div></fieldset>`).join('');
  const content = `
    <section class="panel indicators-intro-panel">
      <div class="indicators-intro-icon">${renderFlaticonIcon('population')}</div>
      <div><p class="eyebrow">Leitura para planejamento</p><h2>Transforme números em perguntas para o território.</h2><p>Contextualize o recorte, informe apenas o que está disponível e confronte o dado com o conhecimento da equipe antes de combinar uma ação.</p></div>
      <div class="indicators-intro-metrics" aria-label="Estrutura da ferramenta"><span><strong>${Object.keys(indicatorGroups).length}</strong><small>grupos de leitura</small></span><span><strong>${indicatorDefinitions.length}</strong><small>indicadores disponíveis</small></span></div>
    </section>
    <ol class="indicators-journey" aria-label="Ciclo de leitura dos indicadores"><li><span>1</span>${renderFlaticonIcon('location', { className: 'indicators-step-icon' })}<div><strong>Contextualizar</strong><p>Defina escopo e período.</p></div></li><li><span>2</span>${renderFlaticonIcon('results', { className: 'indicators-step-icon' })}<div><strong>Informar</strong><p>Use somente dados disponíveis.</p></div></li><li><span>3</span>${renderFlaticonIcon('warning', { className: 'indicators-step-icon' })}<div><strong>Interpretar</strong><p>Compare sistema e território.</p></div></li><li><span>4</span>${renderFlaticonIcon('action', { className: 'indicators-step-icon' })}<div><strong>Agir e reavaliar</strong><p>Combine o próximo passo.</p></div></li></ol>
    <section class="two-column indicators-workbench">
      <article class="panel indicators-data-panel"><header class="indicators-panel-heading"><p class="eyebrow">1 · Contextualize e informe</p><h2>Números disponíveis</h2><p>Campos vazios continuam vazios: ausência de informação não deve ser tratada como zero.</p></header><p class="privacy-note indicators-draft-note"><strong>Rascunho temporário.</strong> O rascunho não é salvo automaticamente em banco ou armazenamento persistente: ele continua nesta aba ao navegar por outras telas e desaparece ao recarregar, fechar a aba ou sair da conta.</p>
        <form id="indicator-form" class="profile-sections indicators-data-form" autocomplete="off">
          <fieldset class="indicator-reference"><legend>${renderFlaticonIcon('location', { className: 'indicator-group-icon' })}<span>Referência</span></legend><div class="form-grid"><label>Escopo<select name="scope">${indicatorScopes.map((item) => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('')}</select></label><label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}" maxlength="40"></label><label>Período / referência<input name="period" maxlength="80" placeholder="Ex.: agosto/2026"></label></div></fieldset>
          ${grouped}
        </form>
      </article>
      <article class="panel indicators-reading-panel"><header class="indicators-panel-heading"><p class="eyebrow">2 · Interprete e combine</p><h2>O número sozinho não explica.</h2><p>Faça a leitura na ordem abaixo e registre apenas o necessário para orientar a conversa da equipe.</p></header><p class="privacy-note indicators-reflection-note">Use esta reflexão para planejamento. Ela é temporária e não é gravada no Supabase.</p><form id="reflection-form" class="stack-form indicators-reflection-form" autocomplete="off"><section class="indicator-reflection-step" aria-labelledby="indicator-system-heading"><header><span>1</span><div><h3 id="indicator-system-heading">O sistema mostra</h3><p>Descreva o dado sem concluir sozinho.</p></div></header><label>Leitura do sistema<textarea name="system" rows="3" maxlength="1600" placeholder="Ex.: quantidade observada no período"></textarea></label></section><section class="indicator-reflection-step" aria-labelledby="indicator-territory-heading"><header><span>2</span><div><h3 id="indicator-territory-heading">No território observamos</h3><p>Acrescente contexto, barreiras e recursos conhecidos.</p></div></header><label>Leitura do território<textarea name="territory" rows="3" maxlength="1600" placeholder="O que a equipe percebe nesse mesmo recorte?"></textarea></label></section><section class="indicator-reflection-step" aria-labelledby="indicator-unknown-heading"><header><span>3</span><div><h3 id="indicator-unknown-heading">O que ainda não sabemos</h3><p>Explicite lacunas antes de tomar uma decisão.</p></div></header><label>Informação que falta<textarea name="unknown" rows="3" maxlength="1600" placeholder="O que precisa ser confirmado ou qualificado?"></textarea></label></section><section class="indicator-reflection-step indicator-action-step" aria-labelledby="indicator-action-heading"><header><span>4</span><div><h3 id="indicator-action-heading">Próxima ação</h3><p>Combine um passo possível e volte ao indicador depois.</p></div></header><label>Ação combinada<textarea name="action" rows="3" maxlength="1600" placeholder="Ex.: atualizar, buscar informação, articular ou acompanhar"></textarea></label></section></form><section class="indicators-output-section" aria-labelledby="indicators-output-heading"><header><p class="eyebrow">Saída para a equipe</p><h3 id="indicators-output-heading">Prepare a leitura compartilhada</h3></header>${renderPrintAccessibilityOptions('indicators')}<div class="actions indicators-actions"><button class="button" id="indicators-pdf" type="button">Baixar PDF</button><button class="button primary" id="indicators-print" type="button">Imprimir leitura</button><button class="button indicators-clear-button" id="indicators-clear" type="button">Limpar</button></div><p id="indicators-status" class="form-status" aria-live="polite"></p></section></article>
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
  const draft = readVolatileDraft(INDICATORS_DRAFT_KEY, {});
  applyNamedFormValues(form, draft.values || {});
  applyNamedFormValues(reflection, draft.reflection || {});
  applyPrintAccessibilityOptions(root, 'indicators', draft.options || {});

  const persist = () => writeVolatileDraft(INDICATORS_DRAFT_KEY, {
    values: readNamedFormValues(form),
    reflection: readNamedFormValues(reflection),
    options: readPrintAccessibilityOptions(root, 'indicators')
  });
  const build = () => buildIndicatorPrint(root, state, readPrintAccessibilityOptions(root, 'indicators'));

  function syncScope() {
    const team = scope.value === 'team';
    microarea.disabled = team;
    if (team) microarea.value = '';
    else if (!microarea.value) microarea.value = state.profile?.microarea || '';
  }
  scope.addEventListener('change', syncScope);
  syncScope();

  form.addEventListener('input', persist);
  form.addEventListener('change', persist);
  reflection.addEventListener('input', persist);
  reflection.addEventListener('change', persist);
  root.querySelector('[data-print-options="indicators"]')?.addEventListener('change', persist);

  root.querySelector('#indicators-print').addEventListener('click', () => {
    persist();
    printHtml(build(), { title: 'Indicadores do território', className: 'indicators-print' });
    setStatus(status, 'Janela de impressão aberta.', 'success');
  });
  root.querySelector('#indicators-pdf').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (button.disabled) return;
    persist();
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
    clearVolatileDraft(INDICATORS_DRAFT_KEY);
    setStatus(status, '', '');
  });
}

function buildIndicatorPrint(root, state, options = {}) {
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
    return `<h3>${escapeHtml(groupLabel)}</h3><table><tbody>${groupRows.map((row) => `<tr><th>${options.visualSupport ? `<span class="indicator-support-label">${renderVisualSupports({ label: row.label, value: row.label }, { max: 1 })}<span>${escapeHtml(row.label)}</span></span>` : escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`).join('')}</tbody></table>`;
  }).join('');
  const classes = printAccessibilityClasses(options);
  return `<article class="indicator-print-sheet ${classes}"><header><strong>Território Vivo • Indicadores</strong><span>${escapeHtml(heading)}</span></header>${values.period ? `<p><strong>Período:</strong> ${escapeHtml(values.period)}</p>` : ''}<section><h2>Indicadores informados</h2>${groupedRows || '<p>Nenhum valor preenchido.</p>'}</section><section><h2>Leitura do território</h2><dl><div><dt>O sistema mostra</dt><dd>${escapeHtml(reflection.system || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>No território observamos</dt><dd>${escapeHtml(reflection.territory || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>O que ainda não sabemos</dt><dd>${escapeHtml(reflection.unknown || '—').replace(/\n/g,'<br>')}</dd></div><div class="${options.visualSupport ? 'has-visual-support' : ''}">${options.visualSupport ? renderVisualSupports({ label: 'Próxima ação', value: reflection.action }, { max: 2 }) : ''}<dt>Próxima ação</dt><dd>${escapeHtml(reflection.action || '—').replace(/\n/g,'<br>')}</dd></div></dl></section><footer>Avaliar a ferramenta e a necessidade do território, não comparar trabalhadores.</footer></article>`;
}
