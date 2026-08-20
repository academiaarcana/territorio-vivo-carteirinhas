import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml, formToObject, setStatus, formatDateBr } from '../lib/dom.js';
import { listProfiles, listUnits, listTeams, listMunicipalities, adminUpdateProfile, createTeam, updateTeam, updateUnit, createUnit } from '../services/repository.js';

export function renderAdminPage() {
  const content = `
    <section class="page-toolbar"><div><p class="eyebrow">Conta master</p><h2>Gestão da rede</h2><p>Administre somente dados profissionais e institucionais. Dados temporários das carteirinhas não aparecem aqui.</p></div><button class="button" id="admin-refresh" type="button">Atualizar</button></section>
    <div id="admin-kpis" class="kpi-grid"></div>
    <section class="panel"><div class="tab-row"><button class="tab-button active" data-admin-tab="profiles">Perfis</button><button class="tab-button" data-admin-tab="units">Unidades</button><button class="tab-button" data-admin-tab="teams">Equipes</button></div><div id="admin-content"><p>Carregando…</p></div><p id="admin-status" class="form-status" aria-live="polite"></p></section>
    <dialog id="admin-dialog" class="editor-dialog"><form method="dialog"><button class="dialog-close" value="cancel">×</button></form><div id="admin-dialog-body"></div></dialog>`;
  return appLayout({ title: 'Gestão da rede', subtitle: 'Perfis, unidades e equipes cadastradas.', activePath: '/app/gestao', content });
}

export async function mountAdminPage({ root }) {
  mountAppLayout(root);
  let data = { profiles: [], units: [], teams: [], municipalities: [] };
  let active = 'profiles';
  const content = root.querySelector('#admin-content');
  const status = root.querySelector('#admin-status');
  const dialog = root.querySelector('#admin-dialog');
  const dialogBody = root.querySelector('#admin-dialog-body');

  async function refresh() {
    setStatus(status, 'Atualizando…', 'info');
    try {
      const [profiles, units, teams, municipalities] = await Promise.all([
        listProfiles(), listUnits({ includeInactive: true }), listTeams({ includeInactive: true }), listMunicipalities({ includeInactive: true })
      ]);
      data = { profiles, units, teams, municipalities };
      renderKpis(root, data);
      renderActive();
      setStatus(status, '', '');
    } catch {
      setStatus(status, 'Não foi possível carregar a gestão da rede.', 'error');
    }
  }

  function renderActive() {
    if (active === 'profiles') content.innerHTML = renderProfiles(data);
    if (active === 'units') content.innerHTML = renderUnits(data);
    if (active === 'teams') content.innerHTML = renderTeams(data);
  }

  root.querySelectorAll('[data-admin-tab]').forEach((button) => button.addEventListener('click', () => {
    active = button.dataset.adminTab;
    root.querySelectorAll('[data-admin-tab]').forEach((item) => item.classList.toggle('active', item === button));
    renderActive();
  }));
  root.querySelector('#admin-refresh').addEventListener('click', refresh);

  content.addEventListener('click', async (event) => {
    const editProfile = event.target.closest('[data-edit-profile]');
    const confirmUnit = event.target.closest('[data-confirm-unit]');
    const editUnit = event.target.closest('[data-edit-unit]');
    const toggleTeam = event.target.closest('[data-toggle-team]');
    const addTeam = event.target.closest('[data-add-team]');
    const addUnit = event.target.closest('[data-add-unit]');

    if (editProfile) openProfileEditor(editProfile.dataset.editProfile);
    if (editUnit) openUnitEditor(editUnit.dataset.editUnit);
    if (addTeam) openTeamEditor();
    if (addUnit) openUnitCreate();
    if (confirmUnit) {
      try { await updateUnit(confirmUnit.dataset.confirmUnit, { data_status: 'team_confirmed', source_checked_on: new Date().toISOString().slice(0,10) }); await refresh(); setStatus(status, 'Unidade marcada como confirmada localmente.', 'success'); } catch { setStatus(status, 'Não foi possível confirmar a unidade.', 'error'); }
    }
    if (toggleTeam) {
      const team = data.teams.find((row) => row.id === toggleTeam.dataset.toggleTeam);
      if (!team) return;
      try { await updateTeam(team.id, { active: !team.active }); await refresh(); } catch { setStatus(status, 'Não foi possível alterar a equipe.', 'error'); }
    }
  });

  function openProfileEditor(id) {
    const profile = data.profiles.find((row) => row.id === id);
    if (!profile) return;
    dialogBody.innerHTML = `<section><h2>Editar perfil profissional</h2><p>A função de acesso não é editável nesta tela.</p><form id="admin-profile-form" class="stack-form"><label>Nome<input name="full_name" value="${escapeHtml(profile.full_name || '')}" required></label><label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}"></label><label>Contato<input name="acs_phone" value="${escapeHtml(profile.acs_phone || '')}"></label><label>Unidade<select name="unit_cnes"><option value="">—</option>${data.units.map((unit) => `<option value="${escapeHtml(unit.cnes)}" ${unit.cnes === profile.unit_cnes ? 'selected' : ''}>${escapeHtml(unit.short_name)}</option>`).join('')}</select></label><label>Equipe<select name="team_id"><option value="">—</option>${data.teams.filter((team) => !profile.unit_cnes || team.unit_cnes === profile.unit_cnes).map((team) => `<option value="${escapeHtml(team.id)}" ${team.id === profile.team_id ? 'selected' : ''}>${escapeHtml(team.name)}</option>`).join('')}</select></label><button class="button primary">Salvar</button></form></section>`;
    dialogBody.querySelector('#admin-profile-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(event.currentTarget);
      const unit = data.units.find((row) => row.cnes === values.unit_cnes);
      const team = data.teams.find((row) => row.id === values.team_id);
      try {
        await adminUpdateProfile(id, { full_name: values.full_name.trim(), microarea: values.microarea.trim(), acs_phone: values.acs_phone.trim(), municipality_code: unit?.municipality_code || null, unit_cnes: unit?.cnes || null, team_id: team?.id || null, unit_name: unit?.name || '', team_name: team?.name || '' });
        dialog.close(); await refresh(); setStatus(status, 'Perfil atualizado.', 'success');
      } catch { setStatus(status, 'Não foi possível atualizar o perfil.', 'error'); }
    });
    dialog.showModal();
  }

  function openTeamEditor() {
    dialogBody.innerHTML = `<section><h2>Cadastrar equipe</h2><form id="team-form" class="stack-form"><label>Unidade<select name="unit_cnes" required>${data.units.filter((unit) => unit.is_active).map((unit) => `<option value="${escapeHtml(unit.cnes)}">${escapeHtml(unit.short_name)}</option>`).join('')}</select></label><label>Nome da equipe<input name="name" required maxlength="120"></label><label>INE / identificador<input name="ine" maxlength="30"></label><label>Status<select name="verification_status"><option value="confirmed">Confirmada</option><option value="pending">Pendente</option></select></label><label>Observação<textarea name="source_note" rows="3"></textarea></label><button class="button primary">Cadastrar</button></form></section>`;
    dialogBody.querySelector('#team-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      try { await createTeam(formToObject(event.currentTarget)); dialog.close(); await refresh(); setStatus(status, 'Equipe cadastrada.', 'success'); } catch { setStatus(status, 'Não foi possível cadastrar a equipe. Confira se o INE já existe.', 'error'); }
    });
    dialog.showModal();
  }

  function openUnitEditor(cnes) {
    const unit = data.units.find((row) => row.cnes === cnes);
    if (!unit) return;
    dialogBody.innerHTML = `<section><h2>Editar unidade</h2><form id="unit-edit-form" class="stack-form"><label>Nome curto<input name="short_name" value="${escapeHtml(unit.short_name || '')}" required></label><label>Endereço<input name="address" value="${escapeHtml(unit.address || '')}"></label><label>Bairro / localidade<input name="neighborhood" value="${escapeHtml(unit.neighborhood || '')}"></label><label>Telefone<input name="phone" value="${escapeHtml(unit.phone || '')}"></label><label>Horário<input name="hours" value="${escapeHtml(unit.hours || '')}"></label><label>Status do dado<select name="data_status"><option value="public_source" ${unit.data_status==='public_source'?'selected':''}>Fonte pública</option><option value="team_confirmed" ${unit.data_status==='team_confirmed'?'selected':''}>Confirmado localmente</option><option value="needs_review" ${unit.data_status==='needs_review'?'selected':''}>Precisa revisão</option></select></label><label>Nota da fonte<textarea name="source_note" rows="3">${escapeHtml(unit.source_note || '')}</textarea></label><button class="button primary">Salvar</button></form></section>`;
    dialogBody.querySelector('#unit-edit-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      try { await updateUnit(cnes, formToObject(event.currentTarget)); dialog.close(); await refresh(); setStatus(status, 'Unidade atualizada.', 'success'); } catch { setStatus(status, 'Não foi possível atualizar a unidade.', 'error'); }
    });
    dialog.showModal();
  }

  function openUnitCreate() {
    dialogBody.innerHTML = `<section><h2>Cadastrar unidade</h2><form id="unit-create-form" class="stack-form"><label>Município<select name="municipality_code" required>${data.municipalities.filter((m) => m.active).map((m) => `<option value="${escapeHtml(m.code)}" data-name="${escapeHtml(m.name)}" data-state="${escapeHtml(m.state_code)}">${escapeHtml(m.name)} — ${escapeHtml(m.state_code)}</option>`).join('')}</select></label><label>CNES<input name="cnes" required></label><label>Nome completo<input name="name" required></label><label>Nome curto<input name="short_name"></label><label>Tipo<select name="unit_type"><option value="ubs">UBS</option><option value="rural">Rural</option><option value="district">Distrito / ponto</option><option value="other">Outro</option></select></label><label>Endereço<input name="address"></label><label>Bairro/localidade<input name="neighborhood"></label><label>Telefone<input name="phone"></label><button class="button primary">Cadastrar unidade</button></form></section>`;
    dialogBody.querySelector('#unit-create-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = formToObject(event.currentTarget);
      const option = event.currentTarget.elements.municipality_code.selectedOptions[0];
      try { await createUnit({ ...values, municipality: option.dataset.name, state: option.dataset.state }); dialog.close(); await refresh(); setStatus(status, 'Unidade cadastrada.', 'success'); } catch { setStatus(status, 'Não foi possível cadastrar a unidade. Confira o CNES.', 'error'); }
    });
    dialog.showModal();
  }

  await refresh();
}

function renderKpis(root, data) {
  const kpis = root.querySelector('#admin-kpis');
  kpis.innerHTML = [['Perfis', data.profiles.length], ['Unidades ativas', data.units.filter((u) => u.is_active).length], ['Equipes ativas', data.teams.filter((t) => t.active).length], ['Dados a revisar', data.units.filter((u) => u.data_status === 'needs_review').length]].map(([label,value]) => `<article class="kpi"><small>${label}</small><strong>${value}</strong></article>`).join('');
}

function renderProfiles(data) {
  return `<div class="section-actions"><h3>Perfis profissionais</h3></div><div class="table-wrap"><table><thead><tr><th>Profissional</th><th>Unidade</th><th>Equipe</th><th>Microárea</th><th>Função</th><th></th></tr></thead><tbody>${data.profiles.map((p) => `<tr><td>${escapeHtml(p.full_name || '—')}</td><td>${escapeHtml(p.unit_name || '—')}</td><td>${escapeHtml(p.team_name || '—')}</td><td>${escapeHtml(p.microarea || '—')}</td><td>${p.role === 'admin' ? 'MASTER' : 'ACS'}</td><td><button class="link-button" data-edit-profile="${escapeHtml(p.id)}">Editar</button></td></tr>`).join('')}</tbody></table></div>`;
}

function renderUnits(data) {
  return `<div class="section-actions"><h3>Unidades e pontos</h3><button class="button" data-add-unit type="button">Cadastrar unidade</button></div><div class="unit-grid">${data.units.map((u) => `<article class="unit-card"><div><span class="status-badge">${u.data_status === 'team_confirmed' ? 'Confirmado' : u.data_status === 'needs_review' ? 'Revisar' : 'Fonte pública'}</span><h3>${escapeHtml(u.short_name)}</h3><small>CNES ${escapeHtml(u.cnes)} • ${u.is_active ? 'ativa' : 'inativa'}</small></div><p>${escapeHtml([u.address,u.neighborhood].filter(Boolean).join(' — ') || 'Endereço a confirmar')}</p><p>${escapeHtml(u.phone || 'Telefone a confirmar')}</p><small>Fonte: ${escapeHtml(u.source_label || '—')}${u.source_checked_on ? ` • ${formatDateBr(u.source_checked_on)}` : ''}</small><div class="actions"><button class="link-button" data-edit-unit="${escapeHtml(u.cnes)}">Editar</button>${u.data_status !== 'team_confirmed' ? `<button class="link-button" data-confirm-unit="${escapeHtml(u.cnes)}">Confirmar localmente</button>` : ''}</div></article>`).join('')}</div>`;
}

function renderTeams(data) {
  return `<div class="section-actions"><h3>Equipes</h3><button class="button" data-add-team type="button">Cadastrar equipe</button></div><div class="table-wrap"><table><thead><tr><th>Unidade</th><th>Equipe</th><th>INE</th><th>Status</th><th>Ativa</th><th></th></tr></thead><tbody>${data.teams.map((t) => { const unit = data.units.find((u) => u.cnes === t.unit_cnes); return `<tr><td>${escapeHtml(unit?.short_name || t.unit_cnes)}</td><td>${escapeHtml(t.name)}</td><td>${escapeHtml(t.ine || '—')}</td><td>${t.verification_status === 'confirmed' ? 'Confirmada' : 'Pendente'}</td><td>${t.active ? 'Sim' : 'Não'}</td><td><button class="link-button" data-toggle-team="${escapeHtml(t.id)}">${t.active ? 'Desativar' : 'Ativar'}</button></td></tr>`; }).join('')}</tbody></table></div>`;
}
