import { appLayout, mountAppLayout } from '../core/layout.js';
import { openAccessibleDialog } from '../core/a11y.js';
import { escapeHtml, formatDateBr, formToObject, setStatus } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { isMaster, canManageTerritoryPoint } from '../core/permissions.js';
import {
  listMunicipalities, listUnits, listTeams, listTerritoryPoints,
  createTerritoryPoint, updateTerritoryPoint, deleteTerritoryPoint
} from '../services/repository.js';

const pointKinds = [
  ['resource','Recurso do território'],
  ['potentiality','Potencialidade'],
  ['partner','Parceiro'],
  ['risk','Risco ambiental/estrutural'],
  ['critical_point','Ponto crítico'],
  ['access_barrier','Barreira de acesso']
];

const pointStatuses = [
  ['active','Ativo'],
  ['needs_review','Precisa revisão'],
  ['resolved','Resolvido']
];

export function renderTerritoryPage({ state }) {
  const profile = state.profile || {};
  const context = state.context || {};
  const master = isMaster(profile);
  const own = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ') || 'Território ainda não vinculado';
  const canCreate = master || Boolean(profile.municipality_code && profile.unit_cnes);

  const scopeFields = master ? `
    <label>Município<select name="municipality_code" id="point-municipality" required><option value="">Selecione</option></select></label>
    <label>Unidade<select name="unit_cnes" id="point-unit" required><option value="">Selecione o município</option></select></label>
    <label>Equipe<select name="team_id" id="point-team"><option value="">Sem equipe específica</option></select></label>` : `
    <input name="municipality_code" type="hidden" value="${escapeHtml(profile.municipality_code || '')}">
    <input name="unit_cnes" type="hidden" value="${escapeHtml(profile.unit_cnes || '')}">
    <input name="team_id" type="hidden" value="${escapeHtml(profile.team_id || '')}">`;

  const content = `
    <section class="panel"><p class="eyebrow">Meu território</p><h2>${escapeHtml(master ? 'Visão municipal' : own)}</h2><p>Esta área organiza referências territoriais <strong>não pessoais</strong>. Não registre nomes de pacientes, famílias, diagnósticos, condições clínicas ou informações identificáveis.</p></section>

    <section class="two-column wide-left">
      <article class="panel">
        <div class="page-toolbar"><div><p class="eyebrow">Camadas do mapa inteligente</p><h2>Achados territoriais</h2><p>Recursos, potencialidades, parceiros, riscos ambientais/estruturais, pontos críticos e barreiras de acesso.</p></div></div>
        <div class="filter-grid" aria-label="Filtros de achados territoriais">
          <label>Buscar<input id="point-search" type="search" placeholder="Nome, endereço ou descrição"></label>
          <label>Tipo<select id="point-kind-filter"><option value="">Todos</option>${pointKinds.map(([value,label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('')}</select></label>
          <label>Status<select id="point-status-filter"><option value="">Todos</option>${pointStatuses.map(([value,label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('')}</select></label>
        </div>
        <div id="point-kpis" class="kpi-grid" aria-live="polite"></div>
        <div id="territory-points" class="territory-point-list"><p>Carregando achados…</p></div>
      </article>

      <article class="panel"><p class="eyebrow">Novo ponto</p><h2>Registrar achado territorial</h2>${canCreate ? `
        <form id="territory-point-form" class="stack-form">
          ${scopeFields}
          <label>Classificação<select name="kind" required>${pointKinds.map(([value,label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('')}</select></label>
          <label>Nome curto do ponto<input name="name" required maxlength="160" placeholder="Ex.: Praça do bairro, ponte danificada, associação"></label>
          <label>Descrição não pessoal<textarea name="description" rows="4" maxlength="4000" placeholder="Descreva o recurso, barreira ou situação sem identificar pessoas."></textarea></label>
          <label>Endereço / referência geográfica<input name="address" maxlength="500"></label>
          <div class="form-grid two"><label>Latitude<input name="latitude" inputmode="decimal" placeholder="Ex.: -11.67"></label><label>Longitude<input name="longitude" inputmode="decimal" placeholder="Ex.: -61.19"></label></div>
          <label>Data da observação<input name="observed_on" type="date" value="${today()}"></label>
          <button class="button primary" type="submit">Registrar ponto</button>
          <p id="point-status" class="form-status" aria-live="polite"></p>
        </form>` : '<div class="empty-state"><h3>Vínculo territorial necessário</h3><p>Vincule seu perfil a município e UBS antes de registrar achados.</p></div>'}
        <p class="clinical-disclaimer"><strong>Não use este formulário para pessoas ou famílias.</strong> Situações individuais devem permanecer nos fluxos assistenciais e sistemas oficiais adequados.</p>
      </article>
    </section>

    <section class="page-toolbar"><div><p class="eyebrow">Rede institucional</p><h2>Unidades e equipes</h2><p>Filtre a rede para revisar fontes, pontos de atenção e equipes cadastradas.</p></div><label>Filtrar<input id="network-search" type="search" placeholder="Unidade, bairro, CNES ou equipe"></label></section>
    <div id="territory-kpis" class="kpi-grid"></div>
    <section id="territory-network" class="unit-grid"><p>Carregando rede…</p></section>
    <section class="panel"><h2>Base pronta para visualização cartográfica</h2><p>Os registros já aceitam endereço e coordenadas. Na etapa de design, esta mesma base será apresentada num mapa visual com filtros, sem adicionar dados pessoais.</p></section>

    <dialog id="point-dialog" class="editor-dialog" aria-labelledby="point-dialog-title"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Fechar">×</button></form><div id="point-dialog-body"></div></dialog>`;
  return appLayout({ title: 'Território e rede', subtitle: 'Base institucional e achados não pessoais para o mapa inteligente.', activePath: '/app/territorio', content });
}

export async function mountTerritoryPage({ root, state }) {
  mountAppLayout(root);
  const master = isMaster(state.profile);
  const target = root.querySelector('#territory-network');
  const networkSearch = root.querySelector('#network-search');
  const pointsTarget = root.querySelector('#territory-points');
  const pointSearch = root.querySelector('#point-search');
  const kindFilter = root.querySelector('#point-kind-filter');
  const statusFilter = root.querySelector('#point-status-filter');
  const pointForm = root.querySelector('#territory-point-form');
  const pointStatus = root.querySelector('#point-status');
  const dialog = root.querySelector('#point-dialog');
  const dialogBody = root.querySelector('#point-dialog-body');
  let networkRows = [];
  let points = [];
  let municipalities = [];
  let units = [];
  let teams = [];
  let mutationInFlight = false;
  let refreshPromise = null;

  try {
    [municipalities, units, teams] = await Promise.all([listMunicipalities(), listUnits(), listTeams()]);
    networkRows = units.map((unit) => ({ ...unit, teams: teams.filter((team) => team.unit_cnes === unit.cnes && team.active) }));
    renderNetwork(networkRows);
    root.querySelector('#territory-kpis').innerHTML = [
      ['Unidades/pontos', units.length],
      ['Equipes cadastradas', teams.filter((team) => team.active).length],
      ['Confirmadas localmente', units.filter((unit) => unit.data_status === 'team_confirmed').length],
      ['A revisar', units.filter((unit) => unit.data_status === 'needs_review').length]
    ].map(([label,value]) => `<article class="kpi"><small>${label}</small><strong>${value}</strong></article>`).join('');
  } catch (error) {
    console.error(error);
    target.innerHTML = '<div class="empty-state"><h3>Rede indisponível</h3><p>Não foi possível carregar as unidades agora.</p></div>';
  }

  if (master && pointForm) setupMasterScopeSelectors(pointForm, municipalities, units, teams);

  async function refreshPoints() {
    if (refreshPromise) return refreshPromise;
    if (!master && (!state.profile?.municipality_code || !state.profile?.unit_cnes)) {
      pointsTarget.innerHTML = '<div class="empty-state"><h3>Território não vinculado</h3><p>Vincule seu perfil a município e UBS para visualizar achados territoriais.</p></div>';
      renderPointKpis(root, []);
      return true;
    }
    pointsTarget.setAttribute('aria-busy', 'true');
    refreshPromise = (async () => {
      try {
        points = await listTerritoryPoints(master ? {} : { municipalityCode: state.profile.municipality_code, unitCnes: state.profile.unit_cnes });
        renderFilteredPoints();
        renderPointKpis(root, points);
        return true;
      } catch (error) {
        console.error(error);
        pointsTarget.innerHTML = '<div class="empty-state"><h3>Achados indisponíveis</h3><p>Não foi possível carregar os registros territoriais.</p></div>';
        return false;
      } finally {
        pointsTarget.removeAttribute('aria-busy');
      }
    })();
    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }

  function renderFilteredPoints() {
    const query = pointSearch.value.trim().toLowerCase();
    const kind = kindFilter.value;
    const status = statusFilter.value;
    const filtered = points.filter((point) => {
      if (kind && point.kind !== kind) return false;
      if (status && point.status !== status) return false;
      if (!query) return true;
      return [kindLabel(point.kind), point.name, point.description, point.address, point.status].filter(Boolean).join(' ').toLowerCase().includes(query);
    });
    renderPoints(filtered);
  }

  networkSearch.addEventListener('input', () => {
    const query = networkSearch.value.trim().toLowerCase();
    renderNetwork(networkRows.filter((row) => searchableNetwork(row).includes(query)));
  });
  [pointSearch, kindFilter, statusFilter].forEach((control) => control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', renderFilteredPoints));

  pointForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled || mutationInFlight || refreshPromise || !form.reportValidity()) return;
    const values = formToObject(form);
    mutationInFlight = true;
    pointsTarget.setAttribute('aria-busy', 'true');
    setButtonBusy(button, true, 'Registrando…');
    setStatus(pointStatus, 'Registrando…', 'info');
    try {
      await createTerritoryPoint(values);
      resetPointForm(form, { master, state });
      setStatus(pointStatus, 'Ponto territorial registrado.', 'success');
      await refreshPoints();
    } catch (error) {
      console.error(error);
      setStatus(pointStatus, 'Não foi possível registrar. Confira o vínculo territorial e não inclua dados pessoais.', 'error');
    } finally {
      mutationInFlight = false;
      pointsTarget.removeAttribute('aria-busy');
      setButtonBusy(button, false);
    }
  });

  pointsTarget.addEventListener('click', async (event) => {
    if (mutationInFlight || refreshPromise) return;
    const edit = event.target.closest('[data-edit-point]');
    const resolve = event.target.closest('[data-resolve-point]');
    const remove = event.target.closest('[data-delete-point]');
    if (edit) return openPointEditor(edit.dataset.editPoint, edit);
    if (resolve) {
      if (resolve.disabled) return;
      mutationInFlight = true;
      pointsTarget.setAttribute('aria-busy', 'true');
      setButtonBusy(resolve, true, 'Salvando…');
      try {
        await updateTerritoryPoint(resolve.dataset.resolvePoint, { status: 'resolved' });
        await refreshPoints();
      } catch (error) {
        console.error(error);
        window.alert('Você não tem permissão para alterar este ponto.');
      } finally {
        mutationInFlight = false;
        pointsTarget.removeAttribute('aria-busy');
        setButtonBusy(resolve, false);
      }
      return;
    }
    if (remove) {
      if (remove.disabled || !window.confirm('Excluir este ponto territorial? Esta ação não pode ser desfeita.')) return;
      mutationInFlight = true;
      pointsTarget.setAttribute('aria-busy', 'true');
      setButtonBusy(remove, true, 'Excluindo…');
      try {
        await deleteTerritoryPoint(remove.dataset.deletePoint);
        await refreshPoints();
      } catch (error) {
        console.error(error);
        window.alert('Você não tem permissão para excluir este ponto.');
      } finally {
        mutationInFlight = false;
        pointsTarget.removeAttribute('aria-busy');
        setButtonBusy(remove, false);
      }
    }
  });

  function openPointEditor(id, opener) {
    if (mutationInFlight || refreshPromise) return;
    const point = points.find((row) => row.id === id);
    if (!point || !canManageTerritoryPoint(state.profile, state.user?.id, point)) return;
    const editScopeFields = master ? `
      <label>Município<select name="municipality_code" id="edit-point-municipality" required></select></label>
      <label>Unidade<select name="unit_cnes" id="edit-point-unit" required></select></label>
      <label>Equipe<select name="team_id" id="edit-point-team"><option value="">Sem equipe específica</option></select></label>` : '';
    dialogBody.innerHTML = `<section><h2 id="point-dialog-title">Editar ponto territorial</h2><p>Edite apenas informação territorial não pessoal.</p><form id="point-edit-form" class="stack-form">
      ${editScopeFields}
      <label>Classificação<select name="kind">${pointKinds.map(([value,label]) => `<option value="${value}" ${point.kind === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></label>
      <label>Nome<input name="name" required maxlength="160" value="${escapeHtml(point.name)}"></label>
      <label>Descrição<textarea name="description" rows="4" maxlength="4000">${escapeHtml(point.description || '')}</textarea></label>
      <label>Endereço / referência<input name="address" maxlength="500" value="${escapeHtml(point.address || '')}"></label>
      <div class="form-grid two"><label>Latitude<input name="latitude" inputmode="decimal" value="${escapeHtml(point.latitude ?? '')}"></label><label>Longitude<input name="longitude" inputmode="decimal" value="${escapeHtml(point.longitude ?? '')}"></label></div>
      <label>Data da observação<input name="observed_on" type="date" value="${escapeHtml(point.observed_on || today())}"></label>
      <label>Status<select name="status">${pointStatuses.map(([value,label]) => `<option value="${value}" ${point.status === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></label>
      <button class="button primary" type="submit">Salvar alterações</button><p id="point-edit-status" class="form-status" aria-live="polite"></p>
    </form></section>`;
    const form = dialogBody.querySelector('#point-edit-form');
    if (master) setupEditScopeSelectors(form, municipalities, units, teams, point);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const editStatus = form.querySelector('#point-edit-status');
      const button = form.querySelector('button[type="submit"]');
      if (button.disabled || mutationInFlight || refreshPromise || !form.reportValidity()) return;
      mutationInFlight = true;
      pointsTarget.setAttribute('aria-busy', 'true');
      setButtonBusy(button, true, 'Salvando…');
      setStatus(editStatus, 'Salvando…', 'info');
      try {
        await updateTerritoryPoint(id, formToObject(form));
        dialog.close();
        await refreshPoints();
      } catch (error) {
        console.error(error);
        setStatus(editStatus, 'Não foi possível salvar. Verifique seu escopo e os campos.', 'error');
      } finally {
        mutationInFlight = false;
        pointsTarget.removeAttribute('aria-busy');
        setButtonBusy(button, false);
      }
    });
    openAccessibleDialog(dialog, opener);
  }

  function renderNetwork(items) {
    target.innerHTML = items.length ? items.map((unit) => `
      <article class="unit-card ${unit.cnes === state.profile?.unit_cnes ? 'own-unit' : ''}">
        <div><span class="status-badge">${unit.data_status === 'team_confirmed' ? 'Confirmado' : unit.data_status === 'needs_review' ? 'Revisar' : 'Fonte pública'}</span><h3>${escapeHtml(unit.short_name)}</h3><small>CNES ${escapeHtml(unit.cnes)}</small></div>
        <p>${escapeHtml([unit.address,unit.neighborhood].filter(Boolean).join(' — ') || 'Localização a confirmar')}</p>
        <p>${escapeHtml(unit.phone || 'Telefone a confirmar')}</p>
        <div><strong>Equipes</strong><p>${unit.teams.length ? unit.teams.map((team) => `${escapeHtml(team.name)}${team.ine ? ` • INE ${escapeHtml(team.ine)}` : ''}`).join('<br>') : 'Nenhuma equipe cadastrada'}</p></div>
        <small>${escapeHtml(unit.source_label || 'Fonte pública')}${unit.source_checked_on ? ` • ${formatDateBr(unit.source_checked_on)}` : ''}</small>
      </article>`).join('') : '<div class="empty-state"><h3>Nenhuma unidade encontrada</h3><p>Altere o filtro de busca.</p></div>';
  }

  function renderPoints(items) {
    pointsTarget.innerHTML = items.length ? items.map((point) => {
      const canManage = canManageTerritoryPoint(state.profile, state.user?.id, point);
      const coordinates = point.latitude !== null && point.longitude !== null ? `<p><strong>Coordenadas:</strong> ${escapeHtml(point.latitude)}, ${escapeHtml(point.longitude)}</p>` : '';
      const unit = units.find((item) => item.cnes === point.unit_cnes);
      const team = teams.find((item) => item.id === point.team_id);
      const scope = master ? `<p><strong>Escopo:</strong> ${escapeHtml(unit?.short_name || point.unit_cnes || 'Sem UBS')}${team ? ` • ${escapeHtml(team.name)}` : ''}</p>` : '';
      return `<article class="territory-point-card"><div><span class="status-badge">${escapeHtml(kindLabel(point.kind))}</span><h3>${escapeHtml(point.name)}</h3><small>${formatDateBr(point.observed_on)} • ${statusLabel(point.status)}</small></div>${scope}${point.description ? `<p>${escapeHtml(point.description)}</p>` : ''}${point.address ? `<p><strong>Referência:</strong> ${escapeHtml(point.address)}</p>` : ''}${coordinates}<div class="actions">${canManage ? `<button class="link-button" type="button" data-edit-point="${escapeHtml(point.id)}">Editar</button>` : ''}${canManage && point.status !== 'resolved' ? `<button class="link-button" type="button" data-resolve-point="${escapeHtml(point.id)}">Marcar resolvido</button>` : ''}${canManage ? `<button class="link-button danger-link" type="button" data-delete-point="${escapeHtml(point.id)}">Excluir</button>` : ''}</div></article>`;
    }).join('') : '<div class="empty-state"><h3>Nenhum achado territorial</h3><p>Não há registros para os filtros selecionados.</p></div>';
  }

  await refreshPoints();
}

function setupMasterScopeSelectors(form, municipalities, units, teams) {
  const municipality = form.querySelector('#point-municipality');
  const unit = form.querySelector('#point-unit');
  const team = form.querySelector('#point-team');
  municipality.innerHTML = '<option value="">Selecione</option>' + municipalities.map((item) => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.name)} — ${escapeHtml(item.state_code)}</option>`).join('');

  function syncUnits() {
    const rows = units.filter((item) => item.municipality_code === municipality.value && item.is_active);
    unit.innerHTML = '<option value="">Selecione</option>' + rows.map((item) => `<option value="${escapeHtml(item.cnes)}">${escapeHtml(item.short_name)}</option>`).join('');
    syncTeams();
  }
  function syncTeams() {
    const rows = teams.filter((item) => item.unit_cnes === unit.value && item.active);
    team.innerHTML = '<option value="">Sem equipe específica</option>' + rows.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
  }
  municipality.addEventListener('change', syncUnits);
  unit.addEventListener('change', syncTeams);
}

function setupEditScopeSelectors(form, municipalities, units, teams, point) {
  const municipality = form.querySelector('#edit-point-municipality');
  const unit = form.querySelector('#edit-point-unit');
  const team = form.querySelector('#edit-point-team');
  municipality.innerHTML = '<option value="">Selecione</option>' + municipalities.map((item) => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.name)} — ${escapeHtml(item.state_code)}</option>`).join('');
  municipality.value = point.municipality_code || '';

  function syncUnits(selectedUnit = '') {
    const rows = units.filter((item) => item.municipality_code === municipality.value && item.is_active);
    unit.innerHTML = '<option value="">Selecione</option>' + rows.map((item) => `<option value="${escapeHtml(item.cnes)}">${escapeHtml(item.short_name)}</option>`).join('');
    if (selectedUnit && rows.some((item) => item.cnes === selectedUnit)) unit.value = selectedUnit;
    syncTeams(selectedUnit ? point.team_id : '');
  }
  function syncTeams(selectedTeam = '') {
    const rows = teams.filter((item) => item.unit_cnes === unit.value && item.active);
    team.innerHTML = '<option value="">Sem equipe específica</option>' + rows.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
    if (selectedTeam && rows.some((item) => item.id === selectedTeam)) team.value = selectedTeam;
  }
  municipality.addEventListener('change', () => syncUnits(''));
  unit.addEventListener('change', () => syncTeams(''));
  syncUnits(point.unit_cnes || '');
}

function resetPointForm(form, { master, state }) {
  form.reset();
  form.elements.observed_on.value = today();
  if (master) {
    form.elements.unit_cnes.innerHTML = '<option value="">Selecione o município</option>';
    form.elements.team_id.innerHTML = '<option value="">Sem equipe específica</option>';
    return;
  }
  form.elements.municipality_code.value = state.profile.municipality_code || '';
  form.elements.unit_cnes.value = state.profile.unit_cnes || '';
  form.elements.team_id.value = state.profile.team_id || '';
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

function kindLabel(kind) {
  return Object.fromEntries(pointKinds)[kind] || 'Tipo não reconhecido';
}

function statusLabel(status) {
  return Object.fromEntries(pointStatuses)[status] || status;
}

function searchableNetwork(unit) {
  return [unit.cnes, unit.name, unit.short_name, unit.neighborhood, unit.address, unit.phone, ...unit.teams.flatMap((team) => [team.name, team.ine])].filter(Boolean).join(' ').toLowerCase();
}

function today() {
  return new Date().toISOString().slice(0,10);
}
