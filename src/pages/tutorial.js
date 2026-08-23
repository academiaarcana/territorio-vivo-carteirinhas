import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml } from '../lib/dom.js';
import { listTeams, listUnits } from '../services/repository.js';
import {
  professionalFunctions,
  publicTeamTypes,
  quickTutorial,
  researchNote,
  systemFunctions,
  territoryVivoObjectives,
  verifiedPublicTeams
} from '../data/tutorial-content.js';

export function renderTutorialPage() {
  const content = `
    <section class="hero-panel">
      <p class="eyebrow">Objetivo</p>
      <h2>Reconhecer, compreender e planejar a partir do território.</h2>
      <p>O Território Vivo organiza conhecimento territorial para apoiar decisões da Atenção Primária. Ele aproxima o que a equipe observa, os dados disponíveis e os próximos passos, sem substituir e-SUS APS, PEC, prontuário ou outros sistemas oficiais.</p>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Por que existe</p><h2>Do território observado ao cuidado organizado</h2></header>
      <div class="feature-grid">${territoryVivoObjectives.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Tutorial rápido</p><h2>Uma apresentação guiada em poucos minutos</h2><p>Esta sequência pode ser usada tanto para aprender quanto para demonstrar o sistema para uma equipe.</p></header>
      <div class="feature-grid">${quickTutorial.map(([step, title, text]) => `<article><span class="status-badge">Passo ${escapeHtml(step)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Todas as funções</p><h2>O que o Território Vivo faz</h2></header>
      <div class="feature-grid">${systemFunctions.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Equipes e trabalho multiprofissional</p><h2>Composições identificadas em fontes públicas</h2><p>Esta parte serve como referência para a apresentação. Equipes do CNES podem ser apresentadas como referência pública sem transformar automaticamente a pesquisa em lotação operacional do sistema.</p></header>
      <div class="feature-grid">${publicTeamTypes.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div>
      <article class="panel"><h3>Equipes verificadas na consulta pública do CNES</h3><div class="summary-list">${verifiedPublicTeams.map((team) => `<div><dt>${escapeHtml(team.type)} • INE ${escapeHtml(team.ine)}</dt><dd><strong>${escapeHtml(team.name)}</strong><small>${escapeHtml(team.source)}</small></dd></div>`).join('')}</div><p class="field-hint">A lista é referência para a apresentação. O cadastro operacional continua separado e sujeito às regras de gestão e confirmação do sistema.</p></article>
      <article class="panel"><h3>Funções profissionais identificadas</h3><div class="filter-row">${professionalFunctions.map((role) => `<span class="status-badge">${escapeHtml(role)}</span>`).join('')}</div><p class="field-hint">${escapeHtml(researchNote)}</p></article>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Rede pública cadastrada</p><h2>Unidades e equipes disponíveis no catálogo operacional</h2><p>Esta seção é diferente da pesquisa pública acima: ela mostra somente o que está efetivamente cadastrado no banco do Território Vivo.</p></header>
      <div id="tutorial-network-summary" class="kpi-grid" aria-live="polite"></div>
      <div id="tutorial-network" class="unit-grid" aria-live="polite"><p>Carregando rede…</p></div>
    </section>

    <section class="clinical-disclaimer">
      <strong>Limite importante</strong>
      <span>Território Vivo é ferramenta de apoio à Atenção Primária. Dados clínicos identificáveis e registros assistenciais devem permanecer nos sistemas oficiais adequados.</span>
    </section>`;

  return appLayout({
    title: 'Objetivo e tutorial',
    subtitle: 'Guia rápido para entender, demonstrar e usar as funções do Território Vivo.',
    activePath: '/app/tutorial',
    content
  });
}

export async function mountTutorialPage({ root }) {
  mountAppLayout(root);
  const target = root.querySelector('#tutorial-network');
  const summary = root.querySelector('#tutorial-network-summary');
  try {
    const [units, teams] = await Promise.all([listUnits(), listTeams()]);
    const activeTeams = teams.filter((team) => team.active);
    summary.innerHTML = [
      ['Unidades/pontos cadastrados', units.length],
      ['Equipes nominais cadastradas', activeTeams.length],
      ['Fontes públicas', units.filter((unit) => unit.data_status === 'public_source').length],
      ['A revisar', units.filter((unit) => unit.data_status === 'needs_review').length]
    ].map(([label, value]) => `<article class="kpi"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></article>`).join('');

    target.innerHTML = units.length ? units.map((unit) => {
      const unitTeams = activeTeams.filter((team) => team.unit_cnes === unit.cnes);
      const source = unit.source_label || 'Fonte institucional cadastrada';
      const status = unit.data_status === 'needs_review' ? 'A revisar' : unit.data_status === 'team_confirmed' ? 'Confirmado localmente' : 'Fonte pública';
      return `<article class="unit-card"><div><span class="status-badge">${escapeHtml(status)}</span><h3>${escapeHtml(unit.short_name || unit.name)}</h3><small>CNES ${escapeHtml(unit.cnes || '—')}</small></div><p>${unitTeams.length ? `<strong>Equipes cadastradas:</strong> ${unitTeams.map((team) => `${escapeHtml(team.name)}${team.ine ? ` — INE ${escapeHtml(team.ine)}` : ''}`).join(' • ')}` : 'Equipe nominal ainda não cadastrada no catálogo operacional.'}</p><small>Fonte: ${escapeHtml(source)}</small></article>`;
    }).join('') : '<div class="empty-state"><h3>Rede ainda não cadastrada</h3><p>O tutorial continua disponível mesmo sem catálogo institucional.</p></div>';
  } catch (error) {
    console.error(error);
    summary.innerHTML = '';
    target.innerHTML = '<div class="empty-state"><h3>Rede indisponível</h3><p>Não foi possível carregar o catálogo agora. As demais partes do tutorial continuam disponíveis.</p></div>';
  }
}
