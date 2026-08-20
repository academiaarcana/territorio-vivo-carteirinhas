import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml, formatDateBr, formToObject, setStatus } from '../lib/dom.js';
import { listUnits, listTeams, listTerritoryPoints, createTerritoryPoint, updateTerritoryPoint, deleteTerritoryPoint } from '../services/repository.js';

const pointKinds = [
  ['resource','Recurso do território'],
  ['potentiality','Potencialidade'],
  ['partner','Parceiro'],
  ['risk','Risco ambiental/estrutural'],
  ['critical_point','Ponto crítico'],
  ['access_barrier','Barreira de acesso'],
  ['other','Outro achado não pessoal']
];

export function renderTerritoryPage({ state }) {
  const profile = state.profile || {};
  const context = state.context || {};
  const own = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ') || 'Território ainda não vinculado';
  const canCreate = Boolean(profile.municipality_code);
  const content = `
    <section class="panel"><p class="eyebrow">Meu território</p><h2>${escapeHtml(own)}</h2><p>Esta área organiza referências territoriais <strong>não pessoais</strong>. Não registre nomes de pacientes, famílias, diagnósticos, condições clínicas ou informações identificáveis.</p></section>

    <section class="two-column wide-left">
      <article class="panel"><div class="page-toolbar"><div><p class="eyebrow">Camadas do mapa inteligente</p><h2>Achados territoriais</h2><p>Recursos, potencialidades, parceiros, riscos ambientais/estruturais, pontos críticos e barreiras de acesso.</p></div><label>Filtrar<input id="point-search" type="search" placeholder="Tipo, nome, endereço ou descrição"></label></div><div id="point-kpis" class="kpi-grid"></div><div id="territory-points" class="territory-point-list"><p>Carregando achados…</p></div></article>
      <article class="panel"><p class="eyebrow">Novo ponto</p><h2>Registrar achado territorial</h2>${canCreate ? `
        <form id="territory-point-form" class="stack-form">
          <label>Classificação<select name="kind" required>${pointKinds.map(([value,label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('')}</select></label>
          <label>Nome curto do ponto<input name="name" required maxlength="160" placeholder="Ex.: Praça do bairro, ponte danificada, associação"></label>
          <label>Descrição não pessoal<textarea name="description" rows="4" maxlength="1000" placeholder="Descreva o recurso, barreira ou situação sem identificar pessoas."></textarea></label>
          <label>Endereço / referência geográfica<input name="address" maxlength="300"></label>
          <label>Data da observação<input name="observed_on" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
          <input name="municipality_code" type="hidden" value="${escapeHtml(profile.municipality_code || '')}">
          <input name="unit_cnes" type="hidden" value="${escapeHtml(profile.unit_cnes || '')}">
          <input name="team_id" type="hidden" value="${escapeHtml(profile.team_id || '')}">
          <button class="button primary" type="submit">Registrar ponto</button>
          <p id="point-status" class="form-status" aria-live="polite"></p>
        </form>` : '<p>Vincule primeiro seu perfil a um município para registrar pontos territoriais.</p>'}<p class="clinical-disclaimer"><strong>Não use este formulário para pessoas ou famílias.</strong> Situações individuais devem permanecer nos fluxos assistenciais e sistemas oficiais adequados.</p></article>
    </section>

    <section class="page-toolbar"><div><p class="eyebrow">Rede institucional</p><h2>Unidades e equipes</h2><p>Filtre a rede para revisar fontes, pontos de atenção e equipes cadastradas.</p></div><label>Filtrar<input id="network-search" type="search" placeholder="Unidade, bairro, CNES ou equipe"></label></section>
    <div id="territory-kpis" class="kpi-grid"></div>
    <section id="territory-network" class="unit-grid"><p>Carregando rede…</p></section>
    <section class="panel"><h2>Próxima camada: visualização cartográfica</h2><p>A estrutura de dados já suporta endereço e coordenadas. Na fase de design, esta mesma base será apresentada em mapa com filtros por tipo, unidade, equipe e status, sem adicionar dados pessoais.</p></section>`;
  return appLayout({ title: 'Território e rede', subtitle: 'Base institucional e achados não pessoais para o mapa inteligente.', activePath: '/app/territorio', content });
}

export async function mountTerritoryPage({ root, state }) {
  mountAppLayout(root);
  const target = root.querySelector('#territory-network');
  const networkSearch = root.querySelector('#network-search');
  const pointsTarget = root.querySelector('#territory-points');
  const pointSearch = root.querySelector('#point-search');
  const pointForm = root.querySelector('#territory-point-form');
  const pointStatus = root.querySelector('#point-status');
  let networkRows = [];
  let points = [];

  try {
    const [units, teams] = await Promise.all([listUnits(), listTeams()]);
    networkRows = units.map((unit) => ({ ...unit, teams: teams.filter((team) => team.unit_cnes === unit.cnes && team.active) }));
    renderNetwork(networkRows);
    root.querySelector('#territory-kpis').innerHTML = [
      ['Unidades/pontos', units.length],
      ['Equipes cadastradas', teams.filter((team) => team.active).length],
      ['Confirmadas localmente', units.filter((unit) => unit.data_status === 'team_confirmed').length],
      ['A revisar', units.filter((unit) => unit.data_status === 'needs_review').length]
    ].map(([label,value]) => `<article class="kpi"><small>${label}</small><strong>${value}</strong></article>`).join('');
  } catch {
    target.innerHTML = '<p>Não foi possível carregar a rede agora.</p>';
  }

  async function refreshPoints() {
    if (!state.profile?.municipality_code) {
      pointsTarget.innerHTML = '<p>Vincule seu perfil a um município para visualizar achados territoriais.</p>';
      return;
    }
    try {
      points = await listTerritoryPoints({ municipalityCode: state.profile.municipality_code });
      renderPoints(filterPoints(points, pointSearch.value));
      renderPointKpis(root, points);
    } catch {
      pointsTarget.innerHTML = '<p>Não foi possível carregar os achados territoriais.</p>';
    }
  }

  networkSearch.addEventListener('input', () => {
    const query = networkSearch.value.trim().toLowerCase();
    renderNetwork(networkRows.filter((row) => searchableNetwork(row).includes(query)));
  });
  pointSearch.addEventListener('input', () => renderPoints(filterPoints(points, pointSearch.value)));

  pointForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = formToObject(event.currentTarget);
    setStatus(pointStatus, 'Registrando…', 'info');
    try {
      await createTerritoryPoint(values);
      event.currentTarget.reset();
      event.currentTarget.elements.observed_on.value = new Date().toISOString().slice(0,10);
      event.currentTarget.elements.municipality_code.value = state.profile.municipality_code || '';
      event.currentTarget.elements.unit_cnes.value = state.profile.unit_cnes || '';
      event.currentTarget.elements.team_id.value = state.profile.team_id || '';
      setStatus(pointStatus, 'Ponto territorial registrado.', 'success');
      await refreshPoints();
    } catch {
      setStatus(pointStatus, 'Não foi possível registrar. Confira os campos e lembre-se: não inclua dados pessoais.', 'error');
    }
  });

  pointsTarget.addEventListener('click', async (event) => {
    const resolve = event.target.closest('[data-resolve-point]');
    const remove = event.target.closest('[data-delete-point]');
    if (resolve) {
      try { await updateTerritoryPoint(resolve.dataset.resolvePoint, { status: 'resolved' }); await refreshPoints(); } catch { /* RLS protege autoria/admin */ }
    }
    if (remove) {
      if (!window.confirm('Excluir este ponto territorial?')) return;
      try { await deleteTerritoryPoint(remove.dataset.deletePoint); await refreshPoints(); } catch { /* RLS protege autoria/admin */ }
    }
  });

  function renderNetwork(items) {
    target.innerHTML = items.map((unit) => `
      <article class="unit-card ${unit.cnes === state.profile?.unit_cnes ? 'own-unit' : ''}">
        <div><span class="status-badge">${unit.data_status === 'team_confirmed' ? 'Confirmado' : unit.data_status === 'needs_review' ? 'Revisar' : 'Fonte pública'}</span><h3>${escapeHtml(unit.short_name)}</h3><small>CNES ${escapeHtml(unit.cnes)}</small></div>
        <p>${escapeHtml([unit.address,unit.neighborhood].filter(Boolean).join(' — ') || 'Localização a confirmar')}</p>
        <p>${escapeHtml(unit.phone || 'Telefone a confirmar')}</p>
        <div><strong>Equipes</strong><p>${unit.teams.length ? unit.teams.map((team) => `${escapeHtml(team.name)}${team.ine ? ` • INE ${escapeHtml(team.ine)}` : ''}`).join('<br>') : 'Nenhuma equipe cadastrada'}</p></div>
        <small>${escapeHtml(unit.source_label || 'Fonte pública')}${unit.source_checked_on ? ` • ${formatDateBr(unit.source_checked_on)}` : ''}</small>
      </article>`).join('') || '<p>Nenhum ponto corresponde ao filtro.</p>';
  }

  function renderPoints(items) {
    pointsTarget.innerHTML = items.map((point) => {
      const canManage = point.created_by === state.user?.id || state.profile?.role === 'admin';
      return `<article class="territory-point-card"><div><span class="status-badge">${escapeHtml(kindLabel(point.kind))}</span><h3>${escapeHtml(point.name)}</h3><small>${formatDateBr(point.observed_on)} • ${point.status === 'resolved' ? 'Resolvido' : point.status === 'needs_review' ? 'Revisar' : 'Ativo'}</small></div>${point.description ? `<p>${escapeHtml(point.description)}</p>` : ''}${point.address ? `<p><strong>Referência:</strong> ${escapeHtml(point.address)}</p>` : ''}<div class="actions">${canManage && point.status !== 'resolved' ? `<button class="link-button" type="button" data-resolve-point="${escapeHtml(point.id)}">Marcar resolvido</button>` : ''}${canManage ? `<button class="link-button" type="button" data-delete-point="${escapeHtml(point.id)}">Excluir</button>` : ''}</div></article>`;
    }).join('') || '<p>Nenhum achado territorial registrado para este filtro.</p>';
  }

  await refreshPoints();
}

function renderPointKpis(root, points) {
  const target = root.querySelector('#point-kpis');
  target.innerHTML = [
    ['Achados', points.length],
    ['Ativos', points.filter((p) => p.status === 'active').length],
    ['Recursos/parceiros', points.filter((p) => ['resource','potentiality','partner'].includes(p.kind)).length],
    ['Riscos/barreiras', points.filter((p) => ['risk','critical_point','access_barrier'].includes(p.kind) && p.status !== 'resolved').length]
  ].map(([label,value]) => `<article class="kpi"><small>${label}</small><strong>${value}</strong></article>`).join('');
}

function filterPoints(points, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return points;
  return points.filter((point) => [kindLabel(point.kind), point.name, point.description, point.address, point.status].filter(Boolean).join(' ').toLowerCase().includes(q));
}

function kindLabel(kind) {
  return Object.fromEntries(pointKinds)[kind] || 'Outro';
}

function searchableNetwork(unit) {
  return [unit.cnes, unit.name, unit.short_name, unit.neighborhood, unit.address, unit.phone, ...unit.teams.flatMap((team) => [team.name, team.ine])].filter(Boolean).join(' ').toLowerCase();
}
