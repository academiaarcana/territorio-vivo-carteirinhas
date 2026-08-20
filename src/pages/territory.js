import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml, formatDateBr } from '../lib/dom.js';
import { listUnits, listTeams } from '../services/repository.js';

export function renderTerritoryPage({ state }) {
  const profile = state.profile || {};
  const context = state.context || {};
  const own = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ') || 'Território ainda não vinculado';
  const content = `
    <section class="panel"><p class="eyebrow">Meu território</p><h2>${escapeHtml(own)}</h2><p>Esta área organiza referências territoriais não pessoais. Pessoas, famílias e condições clínicas não são cadastradas no mapa da rede.</p></section>
    <section class="page-toolbar"><div><p class="eyebrow">Mapa inteligente — estrutura de rede</p><h2>Unidades e equipes</h2><p>Filtre a rede para revisar fontes, pontos de atenção e equipes cadastradas.</p></div><label>Filtrar<input id="network-search" type="search" placeholder="Unidade, bairro, CNES ou equipe"></label></section>
    <div id="territory-kpis" class="kpi-grid"></div>
    <section id="territory-network" class="unit-grid"><p>Carregando rede…</p></section>
    <section class="panel"><h2>Camadas previstas para o mapa visual</h2><ul><li>Unidades e pontos de atendimento institucionais.</li><li>Equipes vinculadas às unidades.</li><li>Recursos e parceiros do território sem identificação de pacientes.</li><li>Pontos críticos ambientais/estruturais sem informação clínica individual.</li></ul><p class="field-hint">A camada cartográfica será construída na etapa de design/visualização. A estrutura de dados pessoais continuará fora dela.</p></section>`;
  return appLayout({ title: 'Território e rede', subtitle: 'Base institucional para o mapa inteligente.', activePath: '/app/territorio', content });
}

export async function mountTerritoryPage({ root, state }) {
  mountAppLayout(root);
  const target = root.querySelector('#territory-network');
  const search = root.querySelector('#network-search');
  let rows = [];
  try {
    const [units, teams] = await Promise.all([listUnits(), listTeams()]);
    rows = units.map((unit) => ({ ...unit, teams: teams.filter((team) => team.unit_cnes === unit.cnes && team.active) }));
    render(rows);
    root.querySelector('#territory-kpis').innerHTML = [
      ['Unidades/pontos', units.length],
      ['Equipes cadastradas', teams.filter((team) => team.active).length],
      ['Confirmadas localmente', units.filter((unit) => unit.data_status === 'team_confirmed').length],
      ['A revisar', units.filter((unit) => unit.data_status === 'needs_review').length]
    ].map(([label,value]) => `<article class="kpi"><small>${label}</small><strong>${value}</strong></article>`).join('');
  } catch {
    target.innerHTML = '<p>Não foi possível carregar a rede agora.</p>';
  }

  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    render(rows.filter((row) => searchable(row).includes(query)));
  });

  function render(items) {
    target.innerHTML = items.map((unit) => `
      <article class="unit-card ${unit.cnes === state.profile?.unit_cnes ? 'own-unit' : ''}">
        <div><span class="status-badge">${unit.data_status === 'team_confirmed' ? 'Confirmado' : unit.data_status === 'needs_review' ? 'Revisar' : 'Fonte pública'}</span><h3>${escapeHtml(unit.short_name)}</h3><small>CNES ${escapeHtml(unit.cnes)}</small></div>
        <p>${escapeHtml([unit.address,unit.neighborhood].filter(Boolean).join(' — ') || 'Localização a confirmar')}</p>
        <p>${escapeHtml(unit.phone || 'Telefone a confirmar')}</p>
        <div><strong>Equipes</strong><p>${unit.teams.length ? unit.teams.map((team) => `${escapeHtml(team.name)}${team.ine ? ` • INE ${escapeHtml(team.ine)}` : ''}`).join('<br>') : 'Nenhuma equipe cadastrada'}</p></div>
        <small>${escapeHtml(unit.source_label || 'Fonte pública')}${unit.source_checked_on ? ` • ${formatDateBr(unit.source_checked_on)}` : ''}</small>
      </article>`).join('') || '<p>Nenhum ponto corresponde ao filtro.</p>';
  }
}

function searchable(unit) {
  return [unit.cnes, unit.name, unit.short_name, unit.neighborhood, unit.address, unit.phone, ...unit.teams.flatMap((team) => [team.name, team.ine])].filter(Boolean).join(' ').toLowerCase();
}
