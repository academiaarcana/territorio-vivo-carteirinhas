import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml, setStatus } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { accessStatusLabel, canChangeAccessStatus, isMaster } from '../core/permissions.js';
import { listAccessProfiles, setProfileAccessStatus } from '../services/access.js';

export function renderAccessManagementPage({ state }) {
  const master = isMaster(state.profile);
  const content = `
    <section class="page-toolbar">
      <div><p class="eyebrow">Controle de acesso</p><h2>Aprovações profissionais</h2><p>${master ? 'Confirme vínculos profissionais antes de liberar o conteúdo interno do território.' : 'Confirme somente profissionais vinculados à sua UBS.'}</p></div>
      <label>Buscar<input id="access-search" type="search" placeholder="Nome, unidade, equipe ou microárea"></label>
    </section>
    <div id="access-kpis" class="kpi-grid"></div>
    <section class="panel">
      <div class="filter-row" role="group" aria-label="Filtrar por status">
        <button class="filter-button active" type="button" data-access-filter="all" aria-pressed="true">Todos</button>
        <button class="filter-button" type="button" data-access-filter="pending" aria-pressed="false">Pendentes</button>
        <button class="filter-button" type="button" data-access-filter="active" aria-pressed="false">Ativos</button>
        <button class="filter-button" type="button" data-access-filter="suspended" aria-pressed="false">Suspensos</button>
      </div>
      <div id="access-list"><p>Carregando perfis…</p></div>
      <p id="access-status" class="form-status" aria-live="polite"></p>
    </section>`;
  return appLayout({ title: 'Aprovações', subtitle: 'Validação de vínculo antes do acesso às áreas internas.', activePath: '/app/aprovacoes', content });
}

export async function mountAccessManagementPage({ root, state }) {
  mountAppLayout(root);
  const target = root.querySelector('#access-list');
  const status = root.querySelector('#access-status');
  const search = root.querySelector('#access-search');
  let rows = [];
  let filter = 'all';
  let refreshing = false;

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    target.setAttribute('aria-busy', 'true');
    target.innerHTML = '<p>Carregando perfis…</p>';
    try {
      rows = await listAccessProfiles();
      renderKpis();
      renderRows();
    } catch (error) {
      console.error(error);
      target.innerHTML = '<div class="empty-state"><h3>Não foi possível carregar os acessos</h3><p>Atualize a página ou confira sua permissão.</p></div>';
    } finally {
      refreshing = false;
      target.removeAttribute('aria-busy');
    }
  }

  function renderKpis() {
    const kpis = root.querySelector('#access-kpis');
    const manageable = rows.filter((profile) => canChangeAccessStatus(state.profile, profile));
    const values = [
      ['Pendentes', manageable.filter((p) => p.access_status === 'pending').length],
      ['Ativos', manageable.filter((p) => p.access_status === 'active').length],
      ['Suspensos', manageable.filter((p) => p.access_status === 'suspended').length],
      ['Visíveis no escopo', rows.length]
    ];
    kpis.innerHTML = values.map(([label, value]) => `<article class="kpi"><small>${label}</small><strong>${value}</strong></article>`).join('');
  }

  function renderRows() {
    const query = search.value.trim().toLowerCase();
    const filtered = rows.filter((profile) => {
      if (filter !== 'all' && profile.access_status !== filter) return false;
      if (!query) return true;
      return [profile.full_name, profile.unit_name, profile.team_name, profile.microarea, profile.acs_phone]
        .filter(Boolean).join(' ').toLowerCase().includes(query);
    });

    target.innerHTML = filtered.length ? `<div class="table-wrap"><table><thead><tr><th>Profissional</th><th>Vínculo solicitado</th><th>Status</th><th>Ações</th></tr></thead><tbody>${filtered.map((profile) => renderProfileRow(profile, state.profile)).join('')}</tbody></table></div>` : '<div class="empty-state"><h3>Nenhum perfil neste filtro</h3><p>Altere o filtro ou a busca.</p></div>';
  }

  root.querySelectorAll('[data-access-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.accessFilter;
    root.querySelectorAll('[data-access-filter]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderRows();
  }));
  search.addEventListener('input', renderRows);

  target.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-access-action]');
    if (!action || action.disabled) return;
    const profile = rows.find((row) => row.id === action.dataset.profileId);
    if (!profile || !canChangeAccessStatus(state.profile, profile)) return;

    const nextStatus = action.dataset.accessAction;
    const message = nextStatus === 'active'
      ? `Aprovar o acesso profissional de ${profile.full_name || 'este perfil'}?`
      : nextStatus === 'suspended'
        ? `Suspender o acesso de ${profile.full_name || 'este perfil'}?`
        : 'Alterar o status deste acesso?';
    if (!window.confirm(message)) return;

    setButtonBusy(action, true, 'Atualizando…');
    setStatus(status, 'Atualizando acesso…', 'info');
    try {
      await setProfileAccessStatus(profile.id, nextStatus);
      await refresh();
      setStatus(status, nextStatus === 'active' ? 'Acesso aprovado.' : 'Acesso suspenso.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(status, 'Não foi possível alterar o acesso. O banco protege escopos e privilégios.', 'error');
    } finally {
      setButtonBusy(action, false);
    }
  });

  await refresh();
}

function renderProfileRow(profile, actor) {
  const manageable = canChangeAccessStatus(actor, profile);
  const territory = [profile.unit_name, profile.team_name, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ') || 'Vínculo incompleto';
  const actions = !manageable ? '<span>—</span>' : profile.access_status === 'pending'
    ? `<button class="button primary" type="button" data-access-action="active" data-profile-id="${escapeHtml(profile.id)}">Aprovar</button>`
    : profile.access_status === 'active'
      ? `<button class="button" type="button" data-access-action="suspended" data-profile-id="${escapeHtml(profile.id)}">Suspender</button>`
      : `<button class="button primary" type="button" data-access-action="active" data-profile-id="${escapeHtml(profile.id)}">Reativar</button>`;

  return `<tr><td><strong>${escapeHtml(profile.full_name || '—')}</strong>${profile.acs_phone ? `<br><small>${escapeHtml(profile.acs_phone)}</small>` : ''}</td><td>${escapeHtml(territory)}</td><td>${escapeHtml(accessStatusLabel(profile))}</td><td><div class="actions">${actions}</div></td></tr>`;
}
