import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml } from '../lib/dom.js';
import { listTeams, listUnits } from '../services/repository.js';
import {
  professionalFunctions,
  publicTeamResearch,
  publicTeamTypes,
  quickTutorial,
  researchNote,
  systemFunctions,
  territoryVivoObjectives,
  territoryVivoProblem
} from '../data/tutorial-content.js';

export function renderTutorialPage() {
  const content = `
    <section class="hero-panel">
      <p class="eyebrow">Objetivo</p>
      <h2>Reconhecer, compreender e planejar a partir do território.</h2>
      <p>O Território Vivo organiza conhecimento territorial para apoiar decisões da Atenção Primária. Ele aproxima o que a equipe observa, os dados disponíveis e os próximos passos, sem substituir e-SUS APS, PEC, prontuário ou outros sistemas oficiais.</p>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">O problema</p><h2>O território produz informação todos os dias — mas ela nem sempre chega organizada à decisão.</h2><p>O ponto de partida não é criar mais um sistema clínico. É aproximar conhecimento territorial, conversa de equipe e planejamento.</p></header>
      <div class="feature-grid">${territoryVivoProblem.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Como o sistema responde</p><h2>Do território observado ao cuidado organizado</h2></header>
      <div class="feature-grid">${territoryVivoObjectives.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Tutorial rápido</p><h2>Uma apresentação guiada em poucos minutos</h2><p>Esta sequência pode ser usada tanto para aprender quanto para demonstrar o sistema para uma equipe.</p></header>
      <div class="feature-grid">${quickTutorial.map(([step, title, text]) => `<article><span class="status-badge">Passo ${escapeHtml(step)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Ferramentas</p><h2>O que o Território Vivo faz</h2><p>Funções do sistema e funções profissionais são apresentadas separadamente para evitar confusão entre ferramenta, papel de acesso e composição de equipe.</p></header>
      <div class="feature-grid">${systemFunctions.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Equipes e trabalho multiprofissional</p><h2>Composições identificadas em fontes públicas</h2><p>Esta parte é referência documental para a apresentação. Pesquisa pública não cria automaticamente lotação, vínculo de usuário ou cadastro operacional no Território Vivo.</p></header>
      <div class="kpi-grid">${publicTeamResearch.map((item) => `<article class="kpi"><small>${escapeHtml(item.label)}</small><strong>${escapeHtml(item.value)}</strong></article>`).join('')}</div>
      <div class="feature-grid">${publicTeamTypes.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div>
      <article class="panel"><h3>Funções profissionais identificadas</h3><div class="filter-row">${professionalFunctions.map((role) => `<span class="status-badge">${escapeHtml(role)}</span>`).join('')}</div><p class="field-hint">${escapeHtml(researchNote)}</p></article>
    </section>

    <section class="section-block">
      <header><p class="eyebrow">Catálogo operacional</p><h2>Unidades e equipes efetivamente cadastradas</h2><p>Esta seção é diferente da pesquisa pública acima: ela lê somente o catálogo atual do Supabase. O software continua multi-município e não depende de uma UBS fixa no código.</p></header>
      <div id="tutorial-network-summary" class="kpi-grid" aria-live="polite"></div>
      <div id="tutorial-network" class="unit-grid" aria-live="polite"><p>Carregando rede…</p></div>
    </section>

    <section class="clinical-disclaimer">
      <strong>Privacidade e limite da ferramenta</strong>
      <span>Território Vivo é ferramenta de apoio à Atenção Primária à Saúde. Não constitui sistema oficial do Ministério da Saúde. Dados clínicos identificáveis e registros assistenciais devem permanecer nos sistemas oficiais adequados.</span>
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
