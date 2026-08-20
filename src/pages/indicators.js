import { appLayout, mountAppLayout } from '../core/layout.js';
import { indicatorNames } from '../data/education.js';
import { escapeHtml, formToObject } from '../lib/dom.js';
import { printHtml, downloadPdf } from '../utils/print.js';

export function renderIndicatorsPage({ state }) {
  const profile = state.profile || {};
  const content = `
    <section class="two-column wide-left">
      <article class="panel"><p class="eyebrow">Planejamento</p><h2>Indicadores da microárea</h2><p>Preencha somente os números disponíveis. O formulário é temporário e não é salvo automaticamente.</p><form id="indicator-form" class="indicator-grid"><label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}"></label>${indicatorNames.map((name, index) => `<label>${escapeHtml(name)}<input name="i${index}" type="number" min="0" inputmode="numeric"></label>`).join('')}</form><div class="actions"><button class="button primary" id="indicators-print" type="button">Imprimir</button><button class="button" id="indicators-pdf" type="button">Baixar PDF</button></div></article>
      <article class="panel"><p class="eyebrow">Sistema × território</p><h2>O número sozinho não explica.</h2><form id="reflection-form" class="stack-form"><label>O sistema mostra<textarea name="system" rows="4"></textarea></label><label>No território observamos<textarea name="territory" rows="4"></textarea></label><label>O que ainda não sabemos<textarea name="unknown" rows="4"></textarea></label><label>Próxima ação<textarea name="action" rows="4"></textarea></label></form></article>
    </section>`;
  return appLayout({ title: 'Indicadores', subtitle: 'Números como apoio ao planejamento, não como ranking.', activePath: '/app/indicadores', content });
}

export function mountIndicatorsPage({ root, state }) {
  mountAppLayout(root);
  const build = () => buildIndicatorPrint(root, state);
  root.querySelector('#indicators-print').addEventListener('click', () => printHtml(build(), { title: 'Indicadores da microárea', className: 'indicators-print' }));
  root.querySelector('#indicators-pdf').addEventListener('click', () => downloadPdf(build(), { title: 'Indicadores da microárea', className: 'indicators-print' }));
}

function buildIndicatorPrint(root, state) {
  const values = formToObject(root.querySelector('#indicator-form'));
  const reflection = formToObject(root.querySelector('#reflection-form'));
  const profile = state.profile || {};
  const context = state.context || {};
  const heading = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name, values.microarea ? `Microárea ${values.microarea}` : ''].filter(Boolean).join(' • ');
  const rows = indicatorNames.map((name, index) => ({ name, value: values[`i${index}`] })).filter((item) => item.value !== '');
  return `<article class="indicator-print-sheet"><header><strong>Território Vivo • Indicadores</strong><span>${escapeHtml(heading)}</span></header><section><h2>Indicadores informados</h2>${rows.length ? `<table><tbody>${rows.map((row) => `<tr><th>${escapeHtml(row.name)}</th><td>${escapeHtml(row.value)}</td></tr>`).join('')}</tbody></table>` : '<p>Nenhum valor preenchido.</p>'}</section><section><h2>Leitura do território</h2><dl><div><dt>O sistema mostra</dt><dd>${escapeHtml(reflection.system || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>No território observamos</dt><dd>${escapeHtml(reflection.territory || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>O que ainda não sabemos</dt><dd>${escapeHtml(reflection.unknown || '—').replace(/\n/g,'<br>')}</dd></div><div><dt>Próxima ação</dt><dd>${escapeHtml(reflection.action || '—').replace(/\n/g,'<br>')}</dd></div></dl></section><footer>Avaliar a ferramenta e a necessidade do território, não comparar trabalhadores.</footer></article>`;
}
