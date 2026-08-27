import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml } from '../lib/dom.js';
import { navigate } from '../core/router.js';
import { isManagement, isMaster, isMasterAccount, roleLabel } from '../core/permissions.js';
import { listTerritoryPoints } from '../services/repository.js';
import { renderFlaticonIcon } from '../lib/visual-support.js';
import { CAPABILITIES, hasCapability } from '../core/access-control.js';

export function renderDashboard({ state }) {
  const profile = state.profile || {};
  const context = state.context || {};
  const networkAdmin = isMaster(profile);
  const masterAccount = isMasterAccount(profile);
  const territory = networkAdmin
    ? 'Toda a rede cadastrada'
    : [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ') || 'Complete seu perfil territorial';
  const management = isManagement(profile);
  const prescriptions = hasCapability(profile, CAPABILITIES.USE_EXTERNAL_PRESCRIPTIONS);
  const missingTerritory = !networkAdmin && (!profile.municipality_code || !profile.unit_cnes);
  const journey = networkAdmin
    ? [
        ['population', 'Ler a rede', 'Reconheça necessidades e potências nos territórios cadastrados.'],
        ['group', 'Organizar prioridades', 'Apoie unidades e equipes sem transformar informação em ranking.'],
        ['action', 'Acompanhar decisões', 'Defina responsáveis, próximos passos e momentos de reavaliação.']
      ]
    : [
        ['location', 'Conhecer o território', 'Abra o território e identifique o que importa agora.'],
        ['group', 'Levar para a equipe', 'Converse com o time e alinhe um próximo passo.'],
        ['action', 'Agir e reavaliar', 'Transforme informação em ação e acompanhe os resultados.']
      ];
  const journeyMarkup = `<ol class="dashboard-journey" aria-label="Ciclo rápido de trabalho territorial">
    ${journey.map(([icon, title, description], index) => `<li><span class="journey-number" aria-hidden="true">${index + 1}</span>${renderFlaticonIcon(icon, { className: 'journey-icon' })}<div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p></div></li>`).join('')}
  </ol>`;
  const hero = networkAdmin
    ? `<section class="hero-panel hero-territory"><p class="eyebrow">${masterAccount ? 'Master / Desenvolvimento' : 'Gestão municipal'}</p><h2>${masterAccount ? 'Administração técnica da rede cadastrada.' : 'Planejamento da rede a partir do território.'}</h2><p>${masterAccount ? 'Conta técnica protegida para administração superior e manutenção do modelo de acesso.' : 'Use a visão agregada para organizar rede, acompanhar necessidades territoriais e apoiar decisões sem transformar informação em ranking punitivo.'}</p>${journeyMarkup}<div class="actions"><button class="button primary" data-go="/app/gestao">Abrir gestão da rede</button><button class="button" data-go="/app/territorio">Abrir território</button><button class="button" data-go="/app/aprovacoes">Revisar aprovações</button></div></section>`
    : `<section class="hero-panel hero-territory"><p class="eyebrow">Território Vivo</p><h2>Conhecimento do território orienta planejamento e ação.</h2><p>Reconheça mudanças, recursos e barreiras; leve o que importa para a equipe; combine um próximo passo e reavalie.</p>${journeyMarkup}<div class="actions"><button class="button primary" data-go="/app/territorio">Abrir território</button><button class="button" data-go="/app/5-minutos">Levar aos 5 minutos</button><button class="button" data-go="/app/tutorial">Ver objetivo e tutorial</button></div></section>`;
  const accountSummary = networkAdmin
    ? `<article class="panel"><h3>Conta e escopo</h3><dl class="summary-list"><div><dt>Responsável</dt><dd>${escapeHtml(profile.full_name || '—')}</dd></div><div><dt>Conta</dt><dd>${escapeHtml(roleLabel(profile))}</dd></div><div><dt>Escopo</dt><dd>${escapeHtml(territory)}</dd></div><div><dt>Status</dt><dd>${masterAccount ? 'Administração técnica ativa' : 'Gestão municipal ativa'}</dd></div></dl><button class="link-button" data-go="/app/perfil">Configurar conta</button></article>`
    : `<article class="panel"><h3>Seu contexto</h3><dl class="summary-list"><div><dt>Profissional</dt><dd>${escapeHtml(profile.full_name || '—')}</dd></div><div><dt>Acesso</dt><dd>${escapeHtml(roleLabel(profile))}</dd></div><div><dt>Território</dt><dd>${escapeHtml(territory)}</dd></div><div><dt>Contato</dt><dd>${escapeHtml(profile.acs_phone || 'Não informado')}</dd></div></dl><button class="link-button" data-go="/app/perfil">Atualizar perfil</button></article>`;
  const content = `
    ${missingTerritory ? '<section class="clinical-disclaimer"><strong>Complete seu vínculo territorial.</strong><span>Município e UBS são necessários para registrar achados do território com o escopo correto.</span><div class="actions"><button class="link-button" data-go="/app/perfil">Completar perfil</button></div></section>' : ''}
    ${hero}
    <section class="territory-now-block" aria-labelledby="territory-now-title">
      <div class="section-actions"><div><p class="eyebrow">O território agora</p><h2 id="territory-now-title">Uma leitura rápida do que pede atenção</h2><p>Contagens de achados não pessoais visíveis no seu escopo. Servem para orientar conversa e planejamento, não para avaliar desempenho individual.</p></div><button class="link-button" data-go="/app/territorio">Ver todos os achados</button></div>
      <div id="dashboard-territory-kpis" class="dashboard-briefing-list" aria-live="polite"><article class="dashboard-briefing-row"><div><small>Carregando</small><strong>Leitura territorial</strong></div><b>…</b></article></div>
    </section>
    <section class="dashboard-grid">
      ${accountSummary}
      <article class="panel panel-planning"><h3>Próximo passo territorial</h3><p>Use uma sequência simples: <strong>observar → interpretar → priorizar → agir → reavaliar</strong>. O sistema organiza o raciocínio sem substituir a discussão da equipe.</p><div class="actions"><button class="link-button" data-go="/app/5-minutos">Abrir 5 minutos</button><button class="link-button" data-go="/app/indicadores">Interpretar indicador</button></div></article>
      <article class="panel"><h3>Objetivo e tutorial</h3><p>Veja a proposta do Território Vivo, o ciclo de territorialização, o roteiro de demonstração, as funções do sistema e o papel da gestão pública.</p><button class="link-button" data-go="/app/tutorial">Abrir tutorial</button></article>
      <article class="panel"><h3>Território e rede</h3><p>Consulte unidades e equipes e registre recursos, barreiras, riscos, parceiros e potencialidades não pessoais.</p><button class="link-button" data-go="/app/territorio">Abrir território</button></article>
      <article class="panel"><h3>5 minutos do território</h3><p>Transforme um achado territorial em significado, decisão, responsável e reavaliação.</p><button class="link-button" data-go="/app/5-minutos">Registrar nota rápida</button></article>
      <article class="panel"><h3>Carteirinhas</h3><p>Materiais temporários com impressão A4, leitura fácil, apoio visual, modo econômico e diferentes densidades por folha.</p><button class="link-button" data-go="/app/carteirinhas">Abrir biblioteca</button></article>
      <article class="panel"><h3>Indicadores</h3><p>Transforme números em perguntas e ações, sem usar indicador como ranking de trabalhadores.</p><button class="link-button" data-go="/app/indicadores">Abrir indicadores</button></article>
      <article class="panel"><h3>Educação em saúde</h3><p>Acesse materiais educativos com fonte técnica, data de revisão, impressão e PDF.</p><button class="link-button" data-go="/app/educacao">Abrir materiais</button></article>
      ${prescriptions ? '<article class="panel"><h3>Prescrições e receitas</h3><p>Abra o Cuidado Para Todos sem transferir receitas, dados clínicos ou credenciais para o Território Vivo.</p><button class="link-button" data-go="/app/prescricoes">Abrir acesso clínico</button></article>' : ''}
      ${management ? `<article class="panel panel-management"><h3>${networkAdmin ? 'Gestão da rede' : 'Gestão da UBS'}</h3><p>${networkAdmin ? 'Administre municípios, unidades, equipes, acessos e acompanhe necessidades territoriais agregadas.' : 'Administre dados, equipes e profissionais somente da sua UBS e acompanhe o território da unidade.'}</p><button class="link-button" data-go="/app/gestao">Abrir gestão</button></article>` : ''}
    </section>`;
  const title = masterAccount ? 'Painel Master' : networkAdmin ? 'Painel Gestor' : 'Início';
  const subtitle = masterAccount ? 'Administração técnica da rede cadastrada.' : networkAdmin ? 'Gestão municipal orientada pelo território.' : 'Contexto, território e próximos passos.';
  return appLayout({ title, subtitle, activePath: '/app/inicio', content });
}

export function mountDashboard({ root, state }) {
  mountAppLayout(root);
  root.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.go)));
  loadTerritorySnapshot(root, state);
}

async function loadTerritorySnapshot(root, state) {
  const target = root.querySelector('#dashboard-territory-kpis');
  if (!target) return;
  const profile = state.profile || {};
  const networkAdmin = isMaster(profile);
  if (!networkAdmin && (!profile.municipality_code || !profile.unit_cnes)) {
    target.innerHTML = '<div class="empty-state"><h3>Vínculo territorial necessário</h3><p>Complete seu vínculo para ver a leitura rápida do território.</p></div>';
    return;
  }
  try {
    const points = await listTerritoryPoints(networkAdmin ? {} : {
      municipalityCode: profile.municipality_code,
      unitCnes: profile.unit_cnes
    });
    const active = points.filter((point) => point.status === 'active');
    const needsReview = points.filter((point) => point.status === 'needs_review');
    const barriers = active.filter((point) => point.kind === 'access_barrier' || point.kind === 'critical_point' || point.kind === 'risk');
    const assets = active.filter((point) => point.kind === 'resource' || point.kind === 'potentiality' || point.kind === 'partner');
    target.innerHTML = [
      ['location', 'Achados ativos', 'Situações territoriais disponíveis no seu escopo.', active.length, 'tone-info'],
      ['warning', 'Barreiras / riscos', 'Pontos que podem dificultar acesso, cuidado ou circulação.', barriers.length, 'tone-warning'],
      ['partner', 'Recursos / potencialidades', 'Apoios e forças do território que podem ser mobilizados.', assets.length, 'tone-territory'],
      ['action', 'Precisam de revisão', 'Registros que pedem atualização ou nova leitura da equipe.', needsReview.length, 'tone-planning']
    ].map(([icon, label, description, value, tone]) => `<article class="dashboard-briefing-row ${tone}">${renderFlaticonIcon(icon, { className: 'briefing-icon' })}<div><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></div><b aria-label="${value} ${escapeHtml(label.toLowerCase())}">${value}</b></article>`).join('');
  } catch (error) {
    console.error(error);
    target.innerHTML = '<div class="empty-state"><h3>Leitura territorial indisponível</h3><p>Não foi possível carregar os achados agora. As demais funções continuam disponíveis.</p></div>';
  }
}
