import { appLayout, mountAppLayout } from '../core/layout.js';
import { openAccessibleDialog } from '../core/a11y.js';
import { escapeHtml, formToObject, setStatus, formatDateBr } from '../lib/dom.js';
import { setButtonBusy, canSubmitForm } from '../lib/forms.js';
import { isMaster, isMasterAccount, isUnitAdmin, roleLabel, canChangeProfileRole } from '../core/permissions.js';
import {
  listProfiles, listUnits, listTeams, listMunicipalities, adminUpdateProfile, setProfileRole,
  createTeam, updateTeam, updateUnit, createUnit, createMunicipality, updateMunicipality
} from '../services/repository.js';

export function renderAdminPage({ state }) {
  const master = isMaster(state.profile);
  const masterAccount = isMasterAccount(state.profile);
  const content = `
    <section class="page-toolbar">
      <div><p class="eyebrow">${master ? (masterAccount ? 'Administração técnica' : 'Gestão municipal') : 'Administração da UBS'}</p><h2>${master ? 'Gestão da rede' : escapeHtml(state.context?.unit?.short_name || state.profile?.unit_name || 'Minha UBS')}</h2><p>${master ? (masterAccount ? 'Administre a configuração superior de acessos e os dados institucionais da rede.' : 'Administre dados profissionais e institucionais da rede como Gestor Municipal.') : 'Administre perfis profissionais, dados operacionais e equipes somente da sua unidade.'} Dados temporários das carteirinhas não aparecem aqui.</p></div>
      <div class="toolbar-actions"><label class="compact-search">Buscar<input id="admin-search" type="search" placeholder="Nome, CNES, equipe, microárea…"></label><button class="button" id="admin-refresh" type="button">Atualizar</button></div>
    </section>
    <div id="admin-kpis" class="kpi-grid" aria-live="polite"></div>
    <section class="panel">
      <div class="tab-row" role="tablist" aria-label="Áreas de gestão">
        <button class="tab-button active" role="tab" aria-selected="true" data-admin-tab="profiles">Perfis</button>
        <button class="tab-button" role="tab" aria-selected="false" data-admin-tab="units">Unidades</button>
        <button class="tab-button" role="tab" aria-selected="false" data-admin-tab="teams">Equipes</button>
        ${master ? '<button class="tab-button" role="tab" aria-selected="false" data-admin-tab="municipalities">Municípios</button>' : ''}
      </div>
      <div id="admin-content"><p>Carregando…</p></div>
      <p id="admin-status" class="form-status" aria-live="polite"></p>
    </section>
    <dialog id="admin-dialog" class="editor-dialog" aria-labelledby="admin-dialog-title"><form method="dialog"><button class="dialog-close" value="cancel" aria-label="Fechar">×</button></form><div id="admin-dialog-body"></div></dialog>`;
  return appLayout({ title: master ? 'Gestão da rede' : 'Gestão da UBS', subtitle: master ? (masterAccount ? 'Administração técnica da rede.' : 'Perfis, municípios, unidades e equipes.') : 'Perfis profissionais, dados operacionais da unidade e equipes do seu escopo.', activePath: '/app/gestao', content });
}

export async function mountAdminPage({ root, state }) {
  mountAppLayout(root);
  const master = isMaster(state.profile);
  const masterAccount = isMasterAccount(state.profile);
  const unitAdmin = isUnitAdmin(state.profile);
  let data = { profiles: [], units: [], teams: [], municipalities: [] };
  let active = 'profiles';
  let searchQuery = '';
  let mutationInFlight = false;
  let refreshPromise = null;
  const content = root.querySelector('#admin-content');
  const status = root.querySelector('#admin-status');
  const dialog = root.querySelector('#admin-dialog');
  const dialogBody = root.querySelector('#admin-dialog-body');

  async function refresh(trigger = null) {
    if (trigger?.disabled) return false;
    if (refreshPromise) return refreshPromise;
    if (trigger) setButtonBusy(trigger, true, 'Atualizando…');
    content.setAttribute('aria-busy', 'true');
    setStatus(status, 'Atualizando…', 'info');
    refreshPromise = (async () => {
      try {
        const [profilesRaw, unitsRaw, teamsRaw, municipalitiesRaw] = await Promise.all([
          listProfiles(), listUnits({ includeInactive: true }), listTeams({ includeInactive: true }), listMunicipalities({ includeInactive: true })
        ]);
        const ownUnit = state.profile?.unit_cnes;
        const ownMunicipality = state.profile?.municipality_code;
        const units = master ? unitsRaw : unitsRaw.filter((unit) => unit.cnes === ownUnit);
        const teams = master ? teamsRaw : teamsRaw.filter((team) => team.unit_cnes === ownUnit);
        const profiles = master ? profilesRaw : profilesRaw.filter((profile) => profile.unit_cnes === ownUnit);
        const municipalities = master ? municipalitiesRaw : municipalitiesRaw.filter((item) => item.code === ownMunicipality);
        data = { profiles, units, teams, municipalities };
        renderKpis(root, data, { master });
        renderActive();
        setStatus(status, '', '');
        return true;
      } catch (error) {
        console.error(error);
        setStatus(status, 'Não foi possível carregar a gestão.', 'error');
        content.innerHTML = '<div class="empty-state"><h3>Gestão indisponível</h3><p>Tente atualizar novamente. Se persistir, confira sua permissão e conexão.</p></div>';
        return false;
      } finally {
        content.removeAttribute('aria-busy');
        if (trigger) setButtonBusy(trigger, false);
      }
    })();
    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }

  async function refreshAfterMutation(successMessage) {
    const refreshed = await refresh();
    if (refreshed) {
      setStatus(status, successMessage, 'success');
      return;
    }
    setStatus(status, 'A alteração foi enviada, mas a gestão não pôde ser recarregada. Use “Atualizar” para conferir o estado atual.', 'error');
  }

  async function submitDialogForm(form, { busyLabel = 'Salvando…', successMessage, errorMessage, task }) {
    const button = form.querySelector('button[type="submit"]');
    const localStatus = ensureFormStatus(form);
    if (!canSubmitForm(form, button) || mutationInFlight || refreshPromise) return;
    mutationInFlight = true;
    content.setAttribute('aria-busy', 'true');
    setButtonBusy(button, true, busyLabel);
    setStatus(localStatus, busyLabel, 'info');
    try {
      await task();
      dialog.close();
      await refreshAfterMutation(successMessage);
    } catch (error) {
      console.error(error);
      setStatus(localStatus, errorMessage, 'error');
    } finally {
      mutationInFlight = false;
      content.removeAttribute('aria-busy');
      setButtonBusy(button, false);
    }
  }

  async function runInlineMutation(button, { busyLabel, successMessage, errorMessage, task }) {
    if (!button || button.disabled || mutationInFlight || refreshPromise) return;
    mutationInFlight = true;
    content.setAttribute('aria-busy', 'true');
    setButtonBusy(button, true, busyLabel);
    try {
      await task();
      await refreshAfterMutation(successMessage);
    } catch (error) {
      console.error(error);
      setStatus(status, errorMessage, 'error');
    } finally {
      mutationInFlight = false;
      content.removeAttribute('aria-busy');
      setButtonBusy(button, false);
    }
  }

  function renderActive() {
    if (active === 'profiles') content.innerHTML = renderProfiles(data, searchQuery, { master, masterAccount, actor: state.profile });
    if (active === 'units') content.innerHTML = renderUnits(data, searchQuery, { master, unitAdmin });
    if (active === 'teams') content.innerHTML = renderTeams(data, searchQuery);
    if (active === 'municipalities') content.innerHTML = renderMunicipalities(data, searchQuery, { master });
  }

  root.querySelectorAll('[data-admin-tab]').forEach((button) => button.addEventListener('click', () => {
    active = button.dataset.adminTab;
    root.querySelectorAll('[data-admin-tab]').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    renderActive();
  }));

  root.querySelector('#admin-refresh').addEventListener('click', (event) => {
    if (mutationInFlight) return;
    refresh(event.currentTarget);
  });
  root.querySelector('#admin-search').addEventListener('input', (event) => {
    searchQuery = event.currentTarget.value.trim().toLowerCase();
    renderActive();
  });

  content.addEventListener('click', async (event) => {
    if (mutationInFlight || refreshPromise) return;
    const editProfile = event.target.closest('[data-edit-profile]');
    const confirmPending = event.target.closest('[data-confirm-pending-team]');
    const confirmUnit = event.target.closest('[data-confirm-unit]');
    const editUnit = event.target.closest('[data-edit-unit]');
    const toggleTeam = event.target.closest('[data-toggle-team]');
    const editTeam = event.target.closest('[data-edit-team]');
    const addTeam = event.target.closest('[data-add-team]');
    const addUnit = event.target.closest('[data-add-unit]');
    const addMunicipality = event.target.closest('[data-add-municipality]');
    const editMunicipality = event.target.closest('[data-edit-municipality]');

    if (editProfile) return openProfileEditor(editProfile.dataset.editProfile);
    if (confirmPending) {
      const pending = data.profiles.find((row) => row.id === confirmPending.dataset.confirmPendingTeam);
      if (!canEditManagedProfile(state.profile, pending)) return;
      return openTeamEditor({ pendingProfileId: confirmPending.dataset.confirmPendingTeam });
    }
    if (editUnit) return openUnitEditor(editUnit.dataset.editUnit);
    if (editTeam) return openTeamEditor({ teamId: editTeam.dataset.editTeam);
    if (addTeam) return openTeamEditor();
    if (addUnit && master) return openUnitCreate();
    if (addMunicipality && master) return openMunicipalityCreate();
    if (editMunicipality && master) return openMunicipalityEditor(editMunicipality.dataset.editMunicipality);

    if (confirmUnit) {
      return runInlineMutation(confirmUnit, {
        busyLabel: 'Confirmando…',
        successMessage: 'Unidade marcada como confirmada localmente.',
        errorMessage: 'Não foi possível confirmar a unidade.',
        task: () => updateUnit(confirmUnit.dataset.confirmUnit, { data_status: 'team_confirmed', source_checked_on: today() })
      });
    }

    if (toggleTeam) {
      const team = data.teams.find((row) => row.id === toggleTeam.dataset.toggleTeam);
      if (!team) return;
      return runInlineMutation(toggleTeam, {
        busyLabel: team.active ? 'Desativando…' : 'Ativando…',
        successMessage: team.active ? 'Equipe desativada.' : 'Equipe ativada.',
        errorMessage: 'Não foi possível alterar a equipe.',
        task: () => updateTeam(team.id, { active: !team.active })
      });
    }
  });

  function openProfileEditor(id) {
    const profile = data.profiles.find((row) => row.id === id);
    if (!canEditManagedProfile(state.profile, profile)) return;
    const roleEditable = canChangeProfileRole(state.profile, profile);
    const availableUnits = master ? data.units : data.units.filter((unit) => unit.cnes === state.profile?.unit_cnes);
    const profileUnit = availableUnits.find((unit) => unit.cnes === profile.unit_cnes);
    const adminOption = masterAccount ? `<option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>Gestor Municipal</option>` : '';
    const editorIntro = masterAccount
      ? 'A conta Master / Desenvolvimento pode ajustar vínculo e definir ACS, Administrador da UBS ou Gestor Municipal.'
      : master
        ? 'O Gestor Municipal pode administrar perfis não administrativos e definir administradores de UBS.'
        : 'A gestão local pode atualizar somente profissionais/ACS da própria UBS.';
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">Editar perfil profissional</h2><p>${editorIntro}</p>
      <form id="admin-profile-form" class="stack-form">
        <label>Nome<input name="full_name" value="${escapeHtml(profile.full_name || '')}" required maxlength="160"></label>
        <label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}" maxlength="40"></label>
        <label>Contato<input name="acs_phone" value="${escapeHtml(profile.acs_phone || '')}" maxlength="80"></label>
        ${master ? `<label>Unidade<select name="unit_cnes" id="admin-profile-unit"><option value="">—</option>${availableUnits.map((unit) => `<option value="${escapeHtml(unit.cnes)}" ${unit.cnes === profile.unit_cnes ? 'selected' : ''}>${escapeHtml(unit.short_name)}</option>`).join('')}</select></label>` : `<div class="readonly-field"><span>Unidade</span><strong>${escapeHtml(profileUnit?.short_name || profile.unit_name || '—')}</strong></div>`}
        <label>Equipe<select name="team_id" id="admin-profile-team"><option value="">—</option></select></label>
        ${roleEditable ? `<label>Função de acesso<select name="role"><option value="acs" ${profile.role === 'acs' ? 'selected' : ''}>Profissional / ACS</option><option value="unit_admin" ${profile.role === 'unit_admin' ? 'selected' : ''}>Administrador da UBS</option>${adminOption}</select></label>` : `<div class="readonly-field"><span>Função</span><strong>${escapeHtml(roleLabel(profile))}</strong></div>`}
        <button class="button primary" type="submit">Salvar</button>
      </form></section>`;
    const form = dialogBody.querySelector('#admin-profile-form');
    const unitSelect = form.querySelector('#admin-profile-unit');
    const teamSelect = form.querySelector('#admin-profile-team');
    function syncTeams(unitCnes, selectedId = '') {
      const rows = data.teams.filter((team) => team.unit_cnes === unitCnes && team.active);
      teamSelect.innerHTML = '<option value="">—</option>' + rows.map((team) => `<option value="${escapeHtml(team.id)}" ${team.id === selectedId ? 'selected' : ''}>${escapeHtml(team.name)}${team.ine ? ` • INE ${escapeHtml(team.ine)}` : ''}</option>`).join('');
    }
    syncTeams(profile.unit_cnes, profile.team_id || '');
    unitSelect?.addEventListener('change', () => syncTeams(unitSelect.value));
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(form);
      const unitCnes = master ? (values.unit_cnes || null) : profile.unit_cnes;
      const unit = data.units.find((row) => row.cnes === unitCnes);
      const team = data.teams.find((row) => row.id === values.team_id && row.unit_cnes === unitCnes);
      const requestedRole = roleEditable ? values.role : profile.role;
      const localStatus = ensureFormStatus(form);
      if (requestedRole !== 'admin' && !unitCnes) return setStatus(localStatus, 'Perfil profissional precisa estar vinculado a uma unidade.', 'error');
      await submitDialogForm(form, {
        busyLabel: 'Salvando…',
        successMessage: requestedRole === 'admin' ? 'Perfil atualizado como Gestor Municipal.' : 'Perfil atualizado.',
        errorMessage: 'Não foi possível atualizar o perfil.',
        task: async () => {
          await adminUpdateProfile(id, {
            full_name: (values.full_name || '').trim(), microarea: (values.microarea || '').trim(), acs_phone: (values.acs_phone || '').trim(),
            municipality_code: unit?.municipality_code || profile.municipality_code || null,
            unit_cnes: unitCnes, team_id: team?.id || null,
            unit_name: unit?.name || profile.unit_name || '', team_name: team?.name || (team ? '' : profile.team_name || '')
          });
          if (roleEditable && requestedRole !== profile.role) await setProfileRole(id, requestedRole);
        }
      });
    });
    openAccessibleDialog(dialog);
  }

  function openTeamEditor({ teamId = null, pendingProfileId = null } = {}) {
    const existing = teamId ? data.teams.find((row) => row.id === teamId) : null;
    const pendingProfile = pendingProfileId ? data.profiles.find((row) => row.id === pendingProfileId) : null;
    if (pendingProfile && !canEditManagedProfile(state.profile, pendingProfile)) return;
    const fixedUnitCnes = unitAdmin ? state.profile?.unit_cnes : (existing?.unit_cnes || pendingProfile?.unit_cnes || '');
    const availableUnits = master ? data.units.filter((unit) => unit.is_active) : data.units.filter((unit) => unit.cnes === fixedUnitCnes);
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">${existing ? 'Editar equipe' : pendingProfile ? 'Confirmar equipe informada' : 'Cadastrar equipe'}</h2>
      ${pendingProfile ? `<p>Esta equipe foi informada no perfil de <strong>${escapeHtml(pendingProfile.full_name || 'profissional')}</strong> e ainda não está vinculada a um cadastro de equipe.</p>` : ''}
      <form id="team-form" class="stack-form">
        ${master ? `<label>Unidade<select name="unit_cnes" required>${availableUnits.map((unit) => `<option value="${escapeHtml(unit.cnes)}" ${unit.cnes === fixedUnitCnes ? 'selected' : ''}>${escapeHtml(unit.short_name)}</option>`).join('')}</select></label>` : `<input type="hidden" name="unit_cnes" value="${escapeHtml(fixedUnitCnes)}"><div class="readonly-field"><span>Unidade</span><strong>${escapeHtml(data.units.find((u) => u.cnes === fixedUnitCnes)?.short_name || 'Minha UBS')}</strong></div>`}
        <label>Nome da equipe<input name="name" required maxlength="120" value="${escapeHtml(existing?.name || pendingProfile?.team_name || '')}"></label>
        <label>INE / identificador<input name="ine" maxlength="30" value="${escapeHtml(existing?.ine || '')}"></label>
        <label>Status<select name="verification_status"><option value="confirmed" ${(existing?.verification_status || 'confirmed') === 'confirmed' ? 'selected' : ''}>Confirmada</option><option value="pending" ${existing?.verification_status === 'pending' ? 'selected' : ''}>Pendente</option></select></label>
        <label>Observação<textarea name="source_note" rows="3" maxlength="1000">${escapeHtml(existing?.source_note || '')}</textarea></label>
        <button class="button primary" type="submit">${existing ? 'Salvar equipe' : 'Cadastrar equipe'}</button>
      </form></section>`;
    const form = dialogBody.querySelector('#team-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(form);
      await submitDialogForm(form, {
        busyLabel: pendingProfile ? 'Confirmando…' : existing ? 'Salvando…' : 'Cadastrando…',
        successMessage: pendingProfile ? 'Equipe confirmada e vinculada ao perfil.' : 'Equipe salva.',
        errorMessage: 'Não foi possível salvar a equipe. Confira se o INE já existe e se a unidade está no seu escopo.',
        task: async () => {
          const saved = existing ? await updateTeam(existing.id, values) : await createTeam(values);
          if (pendingProfile && saved) {
            const unit = data.units.find((row) => row.cnes === saved.unit_cnes);
            await adminUpdateProfile(pendingProfile.id, { municipality_code: unit?.municipality_code || pendingProfile.municipality_code, unit_cnes: saved.unit_cnes, team_id: saved.id, unit_name: unit?.name || pendingProfile.unit_name || '', team_name: saved.name });
          }
        }
      });
    });
    openAccessibleDialog(dialog);
  }

  function openUnitEditor(cnes) {
    const unit = data.units.find((row) => row.cnes === cnes);
    if (!unit) return;
    const identityFields = master
      ? `<label>Nome completo<input name="name" value="${escapeHtml(unit.name || '')}" required maxlength="180"></label><label>Nome curto<input name="short_name" value="${escapeHtml(unit.short_name || '')}" required maxlength="140"></label>`
      : `<div class="readonly-field"><span>Nome oficial</span><strong>${escapeHtml(unit.name || '—')}</strong></div><div class="readonly-field"><span>Nome curto</span><strong>${escapeHtml(unit.short_name || '—')}</strong></div>`;
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">Editar unidade</h2><form id="unit-edit-form" class="stack-form">
      <div class="readonly-field"><span>CNES</span><strong>${escapeHtml(unit.cnes)}</strong></div>
      ${identityFields}
      <label>Endereço<input name="address" value="${escapeHtml(unit.address || '')}" maxlength="240"></label><label>Bairro / localidade<input name="neighborhood" value="${escapeHtml(unit.neighborhood || '')}" maxlength="120"></label><label>Telefone<input name="phone" value="${escapeHtml(unit.phone || '')}" maxlength="80"></label><label>Horário<input name="hours" value="${escapeHtml(unit.hours || '')}" maxlength="160"></label>
      <label>Status do dado<select name="data_status"><option value="public_source" ${unit.data_status==='public_source'?'selected':''}>Fonte pública</option><option value="team_confirmed" ${unit.data_status==='team_confirmed'?'selected':''}>Confirmado localmente</option><option value="needs_review" ${unit.data_status==='needs_review'?'selected':''}>Precisa revisão</option></select></label>
      <label>Nota da fonte<textarea name="source_note" rows="3" maxlength="1000">${escapeHtml(unit.source_note || '')}</textarea></label>
      ${master ? `<label class="check"><input type="checkbox" name="is_active" ${unit.is_active ? 'checked' : ''}> Unidade ativa</label>` : ''}<button class="button primary" type="submit">Salvar</button></form></section>`;
    const form = dialogBody.querySelector('#unit-edit-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(form);
      if (master) values.is_active = form.elements.is_active.checked;
      await submitDialogForm(form, {
        busyLabel: 'Salvando…',
        successMessage: 'Unidade atualizada.',
        errorMessage: 'Não foi possível atualizar a unidade.',
        task: () => updateUnit(cnes, values)
      });
    });
    openAccessibleDialog(dialog);
  }

  function openUnitCreate() {
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">Cadastrar unidade</h2><form id="unit-create-form" class="stack-form">
      <label>Município<select name="municipality_code" required>${data.municipalities.filter((m) => m.active).map((m) => `<option value="${escapeHtml(m.code)}">${escapeHtml(m.name)} — ${escapeHtml(m.state_code)}</option>`).join('')}</select></label>
      <label>CNES<input name="cnes" required maxlength="20"></label><label>Nome completo<input name="name" required maxlength="180"></label><label>Nome curto<input name="short_name" maxlength="140"></label>
      <label>Tipo<select name="unit_type"><option value="ubs">UBS</option><option value="rural">Rural</option><option value="district">Distrito / ponto</option><option value="other">Outro</option></select></label>
      <label>Endereço<input name="address" maxlength="240"></label><label>Bairro/localidade<input name="neighborhood" maxlength="120"></label><label>Telefone<input name="phone" maxlength="80"></label><label>Horário<input name="hours" maxlength="160"></label><button class="button primary" type="submit">Cadastrar unidade</button></form></section>`;
    const form = dialogBody.querySelector('#unit-create-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(form);
      await submitDialogForm(form, {
        busyLabel: 'Cadastrando…',
        successMessage: 'Unidade cadastrada.',
        errorMessage: 'Não foi possível cadastrar a unidade. Confira o CNES e o município.',
        task: () => createUnit(values)
      });
    });
    openAccessibleDialog(dialog);
  }

  function openMunicipalityCreate() {
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">Cadastrar município</h2><form id="municipality-create-form" class="stack-form"><label>Código IBGE<input name="code" required maxlength="12"></label><label>Município<input name="name" required maxlength="160"></label><label>UF<input name="state_code" required maxlength="2" pattern="[A-Za-z]{2}"></label><button class="button primary" type="submit">Cadastrar município</button></form></section>`;
    const form = dialogBody.querySelector('#municipality-create-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await submitDialogForm(form, {
        busyLabel: 'Cadastrando…',
        successMessage: 'Município cadastrado.',
        errorMessage: 'Não foi possível cadastrar o município. Confira o código IBGE.',
        task: () => createMunicipality(formToObject(form))
      });
    });
    openAccessibleDialog(dialog);
  }

  function openMunicipalityEditor(code) {
    const item = data.municipalities.find((row) => row.code === code);
    if (!item) return;
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">Editar município</h2><form id="municipality-edit-form" class="stack-form"><div class="readonly-field"><span>Código IBGE</span><strong>${escapeHtml(item.code)}</strong></div><label>Município<input name="name" required maxlength="160" value="${escapeHtml(item.name)}"></label><label>UF<input name="state_code" required maxlength="2" pattern="[A-Za-z]{2}" value="${escapeHtml(item.state_code)}"></label><label class="check"><input type="checkbox" name="active" ${item.active ? 'checked' : ''}> Município ativo</label><button class="button primary" type="submit">Salvar</button></form></section>`;
    const form = dialogBody.querySelector('#municipality-edit-form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(form);
      values.active = form.elements.active.checked;
      await submitDialogForm(form, {
        busyLabel: 'Salvando…',
        successMessage: 'Município atualizado.',
        errorMessage: 'Não foi possível atualizar o município.',
        task: () => updateMunicipality(code, values)
      });
    });
    openAccessibleDialog(dialog);
  }

  await refresh();
}

function ensureFormStatus(form) {
  let node = form.querySelector('[data-form-status]');
  if (node) return node;
  node = document.createElement('p');
  node.className = 'form-status';
  node.dataset.formStatus = '';
  node.setAttribute('aria-live', 'polite');
  form.append(node);
  return node;
}

function renderKpis(root, data, { master }) {
  const pendingTeams = data.profiles.filter((p) => p.role === 'acs' && !p.team_id && p.team_name?.trim()).length;
  root.querySelector('#admin-kpis').innerHTML = [
    ['Perfis', data.profiles.length],
    [master ? 'Unidades ativas' : 'Minha unidade', master ? data.units.filter((u) => u.is_active).length : data.units.length],
    ['Equipes ativas', data.teams.filter((t) => t.active).length],
    ['Equipes a confirmar', pendingTeams]
  ].map(([label,value]) => `<article class="kpi"><small>${escapeHtml(label)}</small><strong>${value}</strong></article>`).join('');
}

function renderProfiles(data, query, { master, masterAccount, actor }) {
  const rows = filterRows(data.profiles, query, (p) => [p.full_name,p.unit_name,p.team_name,p.microarea,p.acs_phone,roleLabel(p)]);
  const hint = masterAccount
    ? 'A conta Master / Desenvolvimento pode administrar profissionais, administradores de UBS e gestores municipais; a própria conta Master permanece protegida.'
    : master
      ? 'O Gestor Municipal administra profissionais e administradores de UBS, mas não altera outra conta de Gestor nem a conta Master.'
      : 'A gestão local vê o próprio perfil e os profissionais/ACS da unidade; somente perfis profissionais/ACS podem ser editados.';
  return `<div class="section-actions"><div><h3>Perfis profissionais</h3><p class="field-hint">${hint}</p></div></div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Profissional</th><th>Unidade</th><th>Equipe</th><th>Microárea</th><th>Função</th><th>Ações</th></tr></thead><tbody>${rows.map((p) => {
      const editable = canEditManagedProfile(actor, p);
      const pendingTeam = editable && p.role === 'acs' && !p.team_id && p.team_name?.trim() && p.unit_cnes;
      return `<tr><td>${escapeHtml(p.full_name || '—')}</td><td>${escapeHtml(p.unit_name || '—')}</td><td>${escapeHtml(p.team_name || '—')}${!p.team_id && p.team_name?.trim() ? '<br><span class="status-badge warning">A confirmar</span>' : ''}</td><td>${escapeHtml(p.microarea || '—')}</td><td>${escapeHtml(roleLabel(p))}</td><td><div class="actions">${editable ? `<button class="link-button" type="button" data-edit-profile="${escapeHtml(p.id)}">Editar</button>` : '<span class="field-hint">Protegido</span>'}${pendingTeam ? `<button class="link-button" type="button" data-confirm-pending-team="${escapeHtml(p.id)}">Confirmar equipe</button>` : ''}</div></td></tr>`;
    }).join('')}</tbody></table></div>` : empty('Nenhum perfil encontrado')}`;
}

function renderUnits(data, query, { master }) {
  const rows = filterRows(data.units, query, (u) => [u.cnes,u.name,u.short_name,u.address,u.neighborhood,u.phone,u.data_status]);
  return `<div class="section-actions"><div><h3>${master ? 'Unidades e pontos' : 'Minha unidade'}</h3><p class="field-hint">${master ? 'Identidade oficial e dados institucionais da rede.' : 'A gestão local pode manter dados operacionais; identidade oficial e estrutura administrativa são protegidas pela gestão municipal.'} Não inclua informações de pacientes.</p></div>${master ? '<button class="button" data-add-unit type="button">Cadastrar unidade</button>' : ''}</div>
    ${rows.length ? `<div class="unit-grid">${rows.map((u) => `<article class="unit-card"><div><span class="status-badge">${u.data_status === 'team_confirmed' ? 'Confirmado' : u.data_status === 'needs_review' ? 'Revisar' : 'Fonte pública'}</span><h3>${escapeHtml(u.short_name)}</h3><small>CNES ${escapeHtml(u.cnes)} • ${u.is_active ? 'ativa' : 'inativa'}</small></div><p>${escapeHtml([u.address,u.neighborhood].filter(Boolean).join(' — ') || 'Endereço a confirmar')}</p><p>${escapeHtml(u.phone || 'Telefone a confirmar')}</p><small>Fonte: ${escapeHtml(u.source_label || '—')}${u.source_checked_on ? ` • ${formatDateBr(u.source_checked_on)}` : ''}</small><div class="actions"><button class="link-button" type="button" data-edit-unit="${escapeHtml(u.cnes)}">Editar</button>${u.data_status !== 'team_confirmed' ? `<button class="link-button" type="button" data-confirm-unit="${escapeHtml(u.cnes)}">Confirmar localmente</button>` : ''}</div></article>`).join('')}</div>` : empty('Nenhuma unidade encontrada')}`;
}

function renderTeams(data, query) {
  const rows = filterRows(data.teams, query, (t) => [t.name,t.ine,t.verification_status,data.units.find((u) => u.cnes === t.unit_cnes)?.short_name]);
  return `<div class="section-actions"><div><h3>Equipes</h3><p class="field-hint">Cadastre ou confirme equipes vinculadas às unidades do seu escopo.</p></div><button class="button" data-add-team type="button">Cadastrar equipe</button></div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Unidade</th><th>Equipe</th><th>INE</th><th>Status</th><th>Ativa</th><th>Ações</th></tr></thead><tbody>${rows.map((t) => { const unit = data.units.find((u) => u.cnes === t.unit_cnes); return `<tr><td>${escapeHtml(unit?.short_name || t.unit_cnes)}</td><td>${escapeHtml(t.name)}</td><td>${escapeHtml(t.ine || '—')}</td><td>${t.verification_status === 'confirmed' ? 'Confirmada' : 'Pendente'}</td><td>${t.active ? 'Sim' : 'Não'}</td><td><div class="actions"><button class="link-button" type="button" data-edit-team="${escapeHtml(t.id)}">Editar</button><button class="link-button" type="button" data-toggle-team="${escapeHtml(t.id)}">${t.active ? 'Desativar' : 'Ativar'}</button></div></td></tr>`; }).join('')}</tbody></table></div>` : empty('Nenhuma equipe encontrada')}`;
}

function renderMunicipalities(data, query, { master }) {
  if (!master) return empty('Área restrita à gestão municipal');
  const rows = filterRows(data.municipalities, query, (m) => [m.code,m.name,m.state_code]);
  return `<div class="section-actions"><div><h3>Municípios</h3><p class="field-hint">A arquitetura aceita outros municípios sem alterar o código da aplicação.</p></div><button class="button" data-add-municipality type="button">Cadastrar município</button></div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Código IBGE</th><th>Município</th><th>UF</th><th>Ativo</th><th></th></tr></thead><tbody>${rows.map((m) => `<tr><td>${escapeHtml(m.code)}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.state_code)}</td><td>${m.active ? 'Sim' : 'Não'}</td><td><button class="link-button" type="button" data-edit-municipality="${escapeHtml(m.code)}">Editar</button></td></tr>`).join('')}</tbody></table></div>` : empty('Nenhum município encontrado')}`;
}

function canEditManagedProfile(actor, target) {
  if (!target || target.is_master_account === true) return false;
  if (isMasterAccount(actor)) return true;
  if (isMaster(actor)) return target.role !== 'admin';
  return isUnitAdmin(actor) && target.role === 'acs' && target.unit_cnes === actor.unit_cnes;
}

function filterRows(rows, query, values) {
  if (!query) return rows;
  return rows.filter((row) => values(row).filter(Boolean).join(' ').toLowerCase().includes(query));
}

function empty(title) {
  return `<div class="empty-state"><h3>${escapeHtml(title)}</h3><p>Altere o filtro ou atualize os dados.</p></div>`;
}

function today() { return new Date().toISOString().slice(0,10); }
