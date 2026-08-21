import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml, formToObject, setStatus, formatDateBr } from '../lib/dom.js';
import { isMaster, isUnitAdmin, roleLabel, canChangeProfileRole } from '../core/permissions.js';
import {
  listProfiles, listUnits, listTeams, listMunicipalities, adminUpdateProfile, setProfileRole,
  createTeam, updateTeam, updateUnit, createUnit, createMunicipality, updateMunicipality
} from '../services/repository.js';

export function renderAdminPage({ state }) {
  const master = isMaster(state.profile);
  const content = `
    <section class="page-toolbar">
      <div><p class="eyebrow">${master ? 'Gestão municipal' : 'Administração da UBS'}</p><h2>${master ? 'Gestão da rede' : escapeHtml(state.context?.unit?.short_name || state.profile?.unit_name || 'Minha UBS')}</h2><p>${master ? 'Administre dados profissionais e institucionais da rede.' : 'Administre perfis profissionais, dados operacionais e equipes somente da sua unidade.'} Dados temporários das carteirinhas não aparecem aqui.</p></div>
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
  return appLayout({ title: master ? 'Gestão da rede' : 'Gestão da UBS', subtitle: master ? 'Perfis, municípios, unidades e equipes.' : 'Perfis profissionais, dados operacionais da unidade e equipes do seu escopo.', activePath: '/app/gestao', content });
}

export async function mountAdminPage({ root, state }) {
  mountAppLayout(root);
  const master = isMaster(state.profile);
  const unitAdmin = isUnitAdmin(state.profile);
  let data = { profiles: [], units: [], teams: [], municipalities: [] };
  let active = 'profiles';
  let searchQuery = '';
  const content = root.querySelector('#admin-content');
  const status = root.querySelector('#admin-status');
  const dialog = root.querySelector('#admin-dialog');
  const dialogBody = root.querySelector('#admin-dialog-body');

  async function refresh() {
    setStatus(status, 'Atualizando…', 'info');
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
    } catch (error) {
      console.error(error);
      setStatus(status, 'Não foi possível carregar a gestão.', 'error');
      content.innerHTML = '<div class="empty-state"><h3>Gestão indisponível</h3><p>Tente atualizar novamente. Se persistir, confira sua permissão e conexão.</p></div>';
    }
  }

  function renderActive() {
    if (active === 'profiles') content.innerHTML = renderProfiles(data, searchQuery, { master, actor: state.profile });
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

  root.querySelector('#admin-refresh').addEventListener('click', refresh);
  root.querySelector('#admin-search').addEventListener('input', (event) => {
    searchQuery = event.currentTarget.value.trim().toLowerCase();
    renderActive();
  });

  content.addEventListener('click', async (event) => {
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
    if (editTeam) return openTeamEditor({ teamId: editTeam.dataset.editTeam });
    if (addTeam) return openTeamEditor();
    if (addUnit && master) return openUnitCreate();
    if (addMunicipality && master) return openMunicipalityCreate();
    if (editMunicipality && master) return openMunicipalityEditor(editMunicipality.dataset.editMunicipality);

    if (confirmUnit) {
      try {
        await updateUnit(confirmUnit.dataset.confirmUnit, { data_status: 'team_confirmed', source_checked_on: today() });
        await refresh();
        setStatus(status, 'Unidade marcada como confirmada localmente.', 'success');
      } catch { setStatus(status, 'Não foi possível confirmar a unidade.', 'error'); }
    }

    if (toggleTeam) {
      const team = data.teams.find((row) => row.id === toggleTeam.dataset.toggleTeam);
      if (!team) return;
      try {
        await updateTeam(team.id, { active: !team.active });
        await refresh();
        setStatus(status, team.active ? 'Equipe desativada.' : 'Equipe ativada.', 'success');
      } catch { setStatus(status, 'Não foi possível alterar a equipe.', 'error'); }
    }
  });

  function openProfileEditor(id) {
    const profile = data.profiles.find((row) => row.id === id);
    if (!canEditManagedProfile(state.profile, profile)) return;
    const roleEditable = canChangeProfileRole(state.profile, profile);
    const availableUnits = master ? data.units : data.units.filter((unit) => unit.cnes === state.profile?.unit_cnes);
    const profileUnit = availableUnits.find((unit) => unit.cnes === profile.unit_cnes);
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">Editar perfil profissional</h2><p>${master ? 'O master pode ajustar vínculo e, para contas não master, definir administração de UBS.' : 'A gestão local pode atualizar somente profissionais/ACS da própria UBS.'}</p>
      <form id="admin-profile-form" class="stack-form">
        <label>Nome<input name="full_name" value="${escapeHtml(profile.full_name || '')}" required maxlength="160"></label>
        <label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}" maxlength="40"></label>
        <label>Contato<input name="acs_phone" value="${escapeHtml(profile.acs_phone || '')}" maxlength="80"></label>
        ${master ? `<label>Unidade<select name="unit_cnes" id="admin-profile-unit"><option value="">—</option>${availableUnits.map((unit) => `<option value="${escapeHtml(unit.cnes)}" ${unit.cnes === profile.unit_cnes ? 'selected' : ''}>${escapeHtml(unit.short_name)}</option>`).join('')}</select></label>` : `<div class="readonly-field"><span>Unidade</span><strong>${escapeHtml(profileUnit?.short_name || profile.unit_name || '—')}</strong></div>`}
        <label>Equipe<select name="team_id" id="admin-profile-team"><option value="">—</option></select></label>
        ${roleEditable ? `<label>Função de acesso<select name="role"><option value="acs" ${profile.role === 'acs' ? 'selected' : ''}>Profissional / ACS</option><option value="unit_admin" ${profile.role === 'unit_admin' ? 'selected' : ''}>Administrador da UBS</option></select></label>` : `<div class="readonly-field"><span>Função</span><strong>${escapeHtml(roleLabel(profile))}</strong></div>`}
        <button class="button primary">Salvar</button>
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
      const values = formToObject(event.currentTarget);
      const unitCnes = master ? (values.unit_cnes || null) : profile.unit_cnes;
      const unit = data.units.find((row) => row.cnes === unitCnes);
      const team = data.teams.find((row) => row.id === values.team_id && row.unit_cnes === unitCnes);
      const requestedRole = roleEditable ? values.role : profile.role;
      if (requestedRole === 'unit_admin' && !unitCnes) return setStatus(status, 'Administrador de UBS precisa estar vinculado a uma unidade.', 'error');
      try {
        await adminUpdateProfile(id, {
          full_name: (values.full_name || '').trim(), microarea: (values.microarea || '').trim(), acs_phone: (values.acs_phone || '').trim(),
          municipality_code: unit?.municipality_code || profile.municipality_code || null,
          unit_cnes: unitCnes, team_id: team?.id || null,
          unit_name: unit?.name || profile.unit_name || '', team_name: team?.name || (team ? '' : profile.team_name || '')
        });
        if (roleEditable && requestedRole !== profile.role) await setProfileRole(id, requestedRole);
        dialog.close();
        await refresh();
        setStatus(status, 'Perfil atualizado.', 'success');
      } catch (error) { console.error(error); setStatus(status, 'Não foi possível atualizar o perfil.', 'error'); }
    });
    dialog.showModal();
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
        <button class="button primary">${existing ? 'Salvar equipe' : 'Cadastrar equipe'}</button>
      </form></section>`;
    dialogBody.querySelector('#team-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(event.currentTarget);
      try {
        const saved = existing ? await updateTeam(existing.id, values) : await createTeam(values);
        if (pendingProfile && saved) {
          const unit = data.units.find((row) => row.cnes === saved.unit_cnes);
          await adminUpdateProfile(pendingProfile.id, { municipality_code: unit?.municipality_code || pendingProfile.municipality_code, unit_cnes: saved.unit_cnes, team_id: saved.id, unit_name: unit?.name || pendingProfile.unit_name || '', team_name: saved.name });
        }
        dialog.close();
        await refresh();
        setStatus(status, pendingProfile ? 'Equipe confirmada e vinculada ao perfil.' : 'Equipe salva.', 'success');
      } catch (error) { console.error(error); setStatus(status, 'Não foi possível salvar a equipe. Confira se o INE já existe e se a unidade está no seu escopo.', 'error'); }
    });
    dialog.showModal();
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
      ${master ? `<label class="check"><input type="checkbox" name="is_active" ${unit.is_active ? 'checked' : ''}> Unidade ativa</label>` : ''}<button class="button primary">Salvar</button></form></section>`;
    dialogBody.querySelector('#unit-edit-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(event.currentTarget);
      if (master) values.is_active = event.currentTarget.elements.is_active.checked;
      try { await updateUnit(cnes, values); dialog.close(); await refresh(); setStatus(status, 'Unidade atualizada.', 'success'); }
      catch { setStatus(status, 'Não foi possível atualizar a unidade.', 'error'); }
    });
    dialog.showModal();
  }

  function openUnitCreate() {
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">Cadastrar unidade</h2><form id="unit-create-form" class="stack-form">
      <label>Município<select name="municipality_code" required>${data.municipalities.filter((m) => m.active).map((m) => `<option value="${escapeHtml(m.code)}">${escapeHtml(m.name)} — ${escapeHtml(m.state_code)}</option>`).join('')}</select></label>
      <label>CNES<input name="cnes" required maxlength="20"></label><label>Nome completo<input name="name" required maxlength="180"></label><label>Nome curto<input name="short_name" maxlength="140"></label>
      <label>Tipo<select name="unit_type"><option value="ubs">UBS</option><option value="rural">Rural</option><option value="district">Distrito / ponto</option><option value="other">Outro</option></select></label>
      <label>Endereço<input name="address" maxlength="240"></label><label>Bairro/localidade<input name="neighborhood" maxlength="120"></label><label>Telefone<input name="phone" maxlength="80"></label><label>Horário<input name="hours" maxlength="160"></label><button class="button primary">Cadastrar unidade</button></form></section>`;
    dialogBody.querySelector('#unit-create-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(event.currentTarget);
      try { await createUnit(values); dialog.close(); await refresh(); setStatus(status, 'Unidade cadastrada.', 'success'); }
      catch { setStatus(status, 'Não foi possível cadastrar a unidade. Confira o CNES e o município.', 'error'); }
    });
    dialog.showModal();
  }

  function openMunicipalityCreate() {
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">Cadastrar município</h2><form id="municipality-create-form" class="stack-form"><label>Código IBGE<input name="code" required maxlength="12"></label><label>Município<input name="name" required maxlength="160"></label><label>UF<input name="state_code" required maxlength="2" pattern="[A-Za-z]{2}"></label><button class="button primary">Cadastrar município</button></form></section>`;
    dialogBody.querySelector('#municipality-create-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      try { await createMunicipality(formToObject(event.currentTarget)); dialog.close(); await refresh(); setStatus(status, 'Município cadastrado.', 'success'); }
      catch { setStatus(status, 'Não foi possível cadastrar o município. Confira o código IBGE.', 'error'); }
    });
    dialog.showModal();
  }

  function openMunicipalityEditor(code) {
    const item = data.municipalities.find((row) => row.code === code);
    if (!item) return;
    dialogBody.innerHTML = `<section><h2 id="admin-dialog-title">Editar município</h2><form id="municipality-edit-form" class="stack-form"><div class="readonly-field"><span>Código IBGE</span><strong>${escapeHtml(item.code)}</strong></div><label>Município<input name="name" required maxlength="160" value="${escapeHtml(item.name)}"></label><label>UF<input name="state_code" required maxlength="2" pattern="[A-Za-z]{2}" value="${escapeHtml(item.state_code)}"></label><label class="check"><input type="checkbox" name="active" ${item.active ? 'checked' : ''}> Município ativo</label><button class="button primary">Salvar</button></form></section>`;
    dialogBody.querySelector('#municipality-edit-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(event.currentTarget);
      values.active = event.currentTarget.elements.active.checked;
      try { await updateMunicipality(code, values); dialog.close(); await refresh(); setStatus(status, 'Município atualizado.', 'success'); }
      catch { setStatus(status, 'Não foi possível atualizar o município.', 'error'); }
    });
    dialog.showModal();
  }

  await refresh();
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

function renderProfiles(data, query, { master, actor }) {
  const rows = filterRows(data.profiles, query, (p) => [p.full_name,p.unit_name,p.team_name,p.microarea,p.acs_phone,roleLabel(p)]);
  return `<div class="section-actions"><div><h3>Perfis profissionais</h3><p class="field-hint">${master ? 'O master pode administrar profissionais e definir administradores de UBS.' : 'A gestão local vê o próprio perfil e os profissionais/ACS da unidade; somente perfis profissionais/ACS podem ser editados.'}</p></div></div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Profissional</th><th>Unidade</th><th>Equipe</th><th>Microárea</th><th>Função</th><th>Ações</th></tr></thead><tbody>${rows.map((p) => {
      const editable = canEditManagedProfile(actor, p);
      const pendingTeam = editable && p.role === 'acs' && !p.team_id && p.team_name?.trim() && p.unit_cnes;
      return `<tr><td>${escapeHtml(p.full_name || '—')}</td><td>${escapeHtml(p.unit_name || '—')}</td><td>${escapeHtml(p.team_name || '—')}${!p.team_id && p.team_name?.trim() ? '<br><span class="status-badge warning">A confirmar</span>' : ''}</td><td>${escapeHtml(p.microarea || '—')}</td><td>${escapeHtml(roleLabel(p))}</td><td><div class="actions">${editable ? `<button class="link-button" data-edit-profile="${escapeHtml(p.id)}">Editar</button>` : '<span class="field-hint">Protegido</span>'}${pendingTeam ? `<button class="link-button" data-confirm-pending-team="${escapeHtml(p.id)}">Confirmar equipe</button>` : ''}</div></td></tr>`;
    }).join('')}</tbody></table></div>` : empty('Nenhum perfil encontrado')}`;
}

function renderUnits(data, query, { master }) {
  const rows = filterRows(data.units, query, (u) => [u.cnes,u.name,u.short_name,u.address,u.neighborhood,u.phone,u.data_status]);
  return `<div class="section-actions"><div><h3>${master ? 'Unidades e pontos' : 'Minha unidade'}</h3><p class="field-hint">${master ? 'Identidade oficial e dados institucionais da rede.' : 'A gestão local pode manter dados operacionais; identidade oficial e estrutura administrativa são protegidas pelo master.'} Não inclua informações de pacientes.</p></div>${master ? '<button class="button" data-add-unit type="button">Cadastrar unidade</button>' : ''}</div>
    ${rows.length ? `<div class="unit-grid">${rows.map((u) => `<article class="unit-card"><div><span class="status-badge">${u.data_status === 'team_confirmed' ? 'Confirmado' : u.data_status === 'needs_review' ? 'Revisar' : 'Fonte pública'}</span><h3>${escapeHtml(u.short_name)}</h3><small>CNES ${escapeHtml(u.cnes)} • ${u.is_active ? 'ativa' : 'inativa'}</small></div><p>${escapeHtml([u.address,u.neighborhood].filter(Boolean).join(' — ') || 'Endereço a confirmar')}</p><p>${escapeHtml(u.phone || 'Telefone a confirmar')}</p><small>Fonte: ${escapeHtml(u.source_label || '—')}${u.source_checked_on ? ` • ${formatDateBr(u.source_checked_on)}` : ''}</small><div class="actions"><button class="link-button" data-edit-unit="${escapeHtml(u.cnes)}">Editar</button>${u.data_status !== 'team_confirmed' ? `<button class="link-button" data-confirm-unit="${escapeHtml(u.cnes)}">Confirmar localmente</button>` : ''}</div></article>`).join('')}</div>` : empty('Nenhuma unidade encontrada')}`;
}

function renderTeams(data, query) {
  const rows = filterRows(data.teams, query, (t) => [t.name,t.ine,t.verification_status,data.units.find((u) => u.cnes === t.unit_cnes)?.short_name]);
  return `<div class="section-actions"><div><h3>Equipes</h3><p class="field-hint">Cadastre ou confirme equipes vinculadas às unidades do seu escopo.</p></div><button class="button" data-add-team type="button">Cadastrar equipe</button></div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Unidade</th><th>Equipe</th><th>INE</th><th>Status</th><th>Ativa</th><th>Ações</th></tr></thead><tbody>${rows.map((t) => { const unit = data.units.find((u) => u.cnes === t.unit_cnes); return `<tr><td>${escapeHtml(unit?.short_name || t.unit_cnes)}</td><td>${escapeHtml(t.name)}</td><td>${escapeHtml(t.ine || '—')}</td><td>${t.verification_status === 'confirmed' ? 'Confirmada' : 'Pendente'}</td><td>${t.active ? 'Sim' : 'Não'}</td><td><div class="actions"><button class="link-button" data-edit-team="${escapeHtml(t.id)}">Editar</button><button class="link-button" data-toggle-team="${escapeHtml(t.id)}">${t.active ? 'Desativar' : 'Ativar'}</button></div></td></tr>`; }).join('')}</tbody></table></div>` : empty('Nenhuma equipe encontrada')}`;
}

function renderMunicipalities(data, query, { master }) {
  if (!master) return empty('Área restrita ao master municipal');
  const rows = filterRows(data.municipalities, query, (m) => [m.code,m.name,m.state_code]);
  return `<div class="section-actions"><div><h3>Municípios</h3><p class="field-hint">A arquitetura aceita outros municípios sem alterar o código da aplicação.</p></div><button class="button" data-add-municipality type="button">Cadastrar município</button></div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Código IBGE</th><th>Município</th><th>UF</th><th>Ativo</th><th></th></tr></thead><tbody>${rows.map((m) => `<tr><td>${escapeHtml(m.code)}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.state_code)}</td><td>${m.active ? 'Sim' : 'Não'}</td><td><button class="link-button" data-edit-municipality="${escapeHtml(m.code)}">Editar</button></td></tr>`).join('')}</tbody></table></div>` : empty('Nenhum município encontrado')}`;
}

function canEditManagedProfile(actor, target) {
  if (!target) return false;
  if (isMaster(actor)) return true;
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
