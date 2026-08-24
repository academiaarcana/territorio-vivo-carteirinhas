import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml, formToObject, setStatus } from '../lib/dom.js';
import { canSubmitForm, setButtonBusy, setSelectError, setSelectLoading, setSelectReady } from '../lib/forms.js';
import { isMaster, isMasterAccount, isUnitAdmin, roleLabel } from '../core/permissions.js';
import { listMunicipalities, listUnits, listTeams, updateProfile, buildContext } from '../services/repository.js';
import { setState } from '../core/store.js';

export function renderProfilePage({ state }) {
  const p = state.profile || {};
  const networkAdmin = isMaster(p);
  const masterAccount = isMasterAccount(p);
  const unitAdmin = isUnitAdmin(p);
  const scopeLocked = !networkAdmin;
  const superiorTitle = masterAccount ? 'Master / Desenvolvimento' : 'Gestor Municipal';
  const superiorIntro = masterAccount
    ? 'Esta conta técnica administra a rede cadastrada sem manter município, UBS, equipe ou microárea fixos no próprio perfil.'
    : 'Sua conta de Gestor Municipal administra a rede cadastrada sem manter município, UBS, equipe ou microárea fixos no próprio perfil.';
  const scopeNotice = networkAdmin
    ? `<span>${masterAccount ? 'Administração técnica' : 'Gestão municipal'} com escopo de rede. O banco mantém esse papel sem vínculo territorial fixo para evitar que uma preferência de material seja confundida com autorização.</span>`
    : unitAdmin
      ? '<span>Município e UBS formam o escopo aprovado desta conta. Equipe e microárea não se aplicam ao papel de Administrador da UBS.</span>'
      : '<span>Município, UBS, equipe e microárea foram validados pela gestão. Para corrigir o vínculo, solicite a atualização à administração.</span>';
  const territorySection = networkAdmin
    ? `<fieldset><legend>Escopo da conta</legend><div class="readonly-field"><span>Acesso territorial</span><strong>Toda a rede cadastrada</strong></div><p class="field-hint">Gestor Municipal e Master / Desenvolvimento não usam município, UBS, equipe ou microárea como escopo do próprio perfil. O contexto dos materiais deve vir do fluxo em uso, não de um vínculo administrativo fictício.</p></fieldset>`
    : `<fieldset><legend>Território</legend><div class="form-grid"><label>Município<select name="municipality_code" id="profile-municipality" disabled aria-disabled="true"></select></label><label>Unidade<select name="unit_cnes" id="profile-unit" disabled aria-disabled="true"></select></label>${unitAdmin ? '' : '<label>Equipe<select name="team_id" id="profile-team" disabled aria-disabled="true"></select></label>'}</div><div id="profile-source" class="source-note"></div></fieldset>`;
  const content = `
    <section class="panel"><p class="eyebrow">${masterAccount ? 'Master / Desenvolvimento' : networkAdmin ? 'Gestão municipal' : unitAdmin ? 'Administração da UBS' : 'Perfil reutilizável'}</p><h2>${networkAdmin ? superiorTitle : unitAdmin ? 'Meu perfil e minha UBS' : 'Meu perfil e meu território'}</h2><p>${networkAdmin ? superiorIntro : 'Estes dados profissionais são salvos no Supabase e reaproveitados nos módulos. Informações de famílias não entram aqui.'}</p>
      <div class="role-notice"><strong>${escapeHtml(roleLabel(p))}</strong>${scopeNotice}</div>
      <form id="profile-form" class="profile-sections">
        <fieldset><legend>${networkAdmin ? 'Responsável pela conta' : 'Profissional'}</legend><div class="form-grid"><label>Nome completo<input name="full_name" value="${escapeHtml(p.full_name || '')}" required maxlength="160"></label>${!networkAdmin && !unitAdmin ? `<label>Microárea<input name="microarea" value="${escapeHtml(p.microarea || '')}" maxlength="40" placeholder="Ex.: 08" disabled aria-disabled="true"></label>` : ''}<label>Telefone / contato institucional<input name="acs_phone" value="${escapeHtml(p.acs_phone || '')}" maxlength="80"></label></div>${!networkAdmin && !unitAdmin ? '<p class="field-hint">Microárea faz parte do vínculo territorial aprovado e só pode ser alterada pela gestão.</p>' : ''}</fieldset>
        ${territorySection}
        <fieldset><legend>${networkAdmin ? 'Preferências institucionais para materiais' : 'Dados institucionais usados nas carteirinhas'}</legend>${networkAdmin ? '<p class="field-hint">Estes campos são apenas preferências de conteúdo para materiais e não criam vínculo com uma UBS nem alteram seu escopo de rede.</p>' : ''}<div class="form-grid"><label>Telefone da unidade<input name="unit_phone" value="${escapeHtml(p.unit_phone || '')}" maxlength="80"></label><label>Horário<input name="unit_hours" value="${escapeHtml(p.unit_hours || '')}" maxlength="160"></label><label class="full">Endereço<input name="unit_address" value="${escapeHtml(p.unit_address || '')}" maxlength="240"></label></div></fieldset>
        <fieldset><legend>Profissionais de referência</legend><div class="form-grid"><label>Médica(o)<input name="doctor_name" value="${escapeHtml(p.doctor_name || '')}" maxlength="160"></label><label>Enfermeira(o)<input name="nurse_name" value="${escapeHtml(p.nurse_name || '')}" maxlength="160"></label><label>Técnica(o) de enfermagem<input name="tech_name" value="${escapeHtml(p.tech_name || '')}" maxlength="160"></label></div></fieldset>
        <div class="actions"><button class="button primary" type="submit">Salvar perfil</button><span id="profile-status" class="form-status" aria-live="polite"></span></div>
      </form>
    </section>`;
  const title = masterAccount ? 'Configurações do Master / Desenvolvimento' : networkAdmin ? 'Configurações do Gestor Municipal' : 'Meu perfil';
  const subtitle = networkAdmin ? (masterAccount ? 'Administração técnica e preferências de materiais.' : 'Gestão municipal e preferências de materiais.') : 'Dados profissionais e vínculo territorial.';
  return appLayout({ title, subtitle, activePath: '/app/perfil', content });
}

export async function mountProfilePage({ root, state }) {
  mountAppLayout(root);
  const networkAdmin = isMaster(state.profile);
  const unitAdmin = isUnitAdmin(state.profile);
  const scopeLocked = !networkAdmin;
  const form = root.querySelector('#profile-form');
  const municipality = root.querySelector('#profile-municipality');
  const unit = root.querySelector('#profile-unit');
  const team = root.querySelector('#profile-team');
  const source = root.querySelector('#profile-source');
  const status = root.querySelector('#profile-status');
  let units = [];
  let teams = [];

  async function loadMunicipalities() {
    if (!municipality) return;
    form.setAttribute('aria-busy', 'true');
    setSelectLoading(municipality, 'Carregando municípios…');
    try {
      const rows = await listMunicipalities();
      municipality.innerHTML = '<option value="">Selecione</option>' + rows.map((row) => `<option value="${escapeHtml(row.code)}">${escapeHtml(row.name)} — ${escapeHtml(row.state_code)}</option>`).join('');
      setSelectReady(municipality);
      municipality.value = state.profile?.municipality_code || '';
      await loadUnits(false);
    } catch (error) {
      setSelectError(municipality, 'Catálogo de municípios indisponível');
      if (unit) setSelectError(unit, 'Unidades indisponíveis');
      if (team) setSelectError(team, 'Equipes indisponíveis');
      throw error;
    } finally {
      form.removeAttribute('aria-busy');
    }
  }

  async function loadUnits(reset = true) {
    if (!unit) return;
    const municipalityCode = state.profile?.municipality_code || null;
    setSelectLoading(unit, municipalityCode ? 'Carregando unidades…' : 'Selecione o município');
    if (team) setSelectLoading(team, 'Selecione a unidade');
    if (!municipalityCode) {
      units = [];
      teams = [];
      setSelectReady(unit);
      if (team) setSelectReady(team);
      syncUnitFields(false);
      return;
    }
    try {
      const rows = await listUnits({ municipalityCode });
      units = rows.filter((row) => row.cnes === state.profile?.unit_cnes);
      unit.innerHTML = '<option value="">Selecione</option>' + units.map((row) => `<option value="${escapeHtml(row.cnes)}">${escapeHtml(row.short_name)}${row.neighborhood ? ` — ${escapeHtml(row.neighborhood)}` : ''}</option>`).join('');
      setSelectReady(unit);
      unit.value = state.profile?.unit_cnes || '';
      if (team) await loadTeams(reset);
      syncUnitFields(false);
    } catch (error) {
      units = [];
      teams = [];
      setSelectError(unit, 'Não foi possível carregar as unidades');
      if (team) setSelectError(team, 'Equipes indisponíveis');
      if (source) source.textContent = '';
      throw error;
    }
  }

  async function loadTeams(reset = true) {
    if (!team) return;
    const unitCnes = state.profile?.unit_cnes || '';
    setSelectLoading(team, unitCnes ? 'Carregando equipes…' : 'Selecione a unidade');
    if (!unitCnes) {
      teams = [];
      team.innerHTML = '<option value="">Equipe ainda não informada</option>';
      setSelectReady(team);
      return;
    }
    try {
      teams = await listTeams({ unitCnes });
      team.innerHTML = '<option value="">Equipe ainda não informada</option>' + teams.map((row) => `<option value="${escapeHtml(row.id)}" data-name="${escapeHtml(row.name)}">${escapeHtml(row.name)}${row.ine ? ` • INE ${escapeHtml(row.ine)}` : ''}</option>`).join('');
      setSelectReady(team);
      if ((!reset || scopeLocked) && state.profile?.team_id && teams.some((row) => row.id === state.profile.team_id)) team.value = state.profile.team_id;
    } catch (error) {
      teams = [];
      setSelectError(team, 'Não foi possível carregar as equipes');
      throw error;
    }
  }

  function syncUnitFields(overwrite = false) {
    if (!unit || !source) return;
    const selected = units.find((row) => row.cnes === state.profile?.unit_cnes);
    if (!selected) {
      source.textContent = '';
      return;
    }
    source.textContent = `CNES ${selected.cnes} • ${selected.data_status === 'team_confirmed' ? 'confirmado localmente' : selected.data_status === 'needs_review' ? 'dados públicos a confirmar' : 'referência pública'} • vínculo validado pela gestão`;
    if (overwrite) {
      form.elements.unit_phone.value = selected.phone || '';
      form.elements.unit_address.value = [selected.address, selected.neighborhood].filter(Boolean).join(' — ');
      form.elements.unit_hours.value = selected.hours || '';
    }
  }

  if (!networkAdmin) {
    try {
      await loadMunicipalities();
    } catch (error) {
      console.error(error);
      setStatus(status, 'Não foi possível carregar o catálogo territorial.', 'error');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (!canSubmitForm(form, button)) return;
    const values = formToObject(form);
    const basePatch = {
      full_name: (values.full_name || '').trim(),
      acs_phone: (values.acs_phone || '').trim(),
      unit_phone: (values.unit_phone || '').trim(),
      unit_address: (values.unit_address || '').trim(),
      unit_hours: (values.unit_hours || '').trim(),
      doctor_name: (values.doctor_name || '').trim(),
      nurse_name: (values.nurse_name || '').trim(),
      tech_name: (values.tech_name || '').trim()
    };
    const unitCnes = state.profile?.unit_cnes || null;
    const selectedUnit = units.find((row) => row.cnes === unitCnes);
    const selectedTeam = teams.find((row) => row.id === state.profile?.team_id);
    const territorialPatch = networkAdmin ? {} : {
      municipality_code: state.profile?.municipality_code || null,
      unit_cnes: unitCnes,
      unit_name: selectedUnit?.name || state.profile?.unit_name || '',
      team_id: unitAdmin ? null : (state.profile?.team_id || null),
      team_name: unitAdmin ? '' : (selectedTeam?.name || state.profile?.team_name || ''),
      microarea: unitAdmin ? '' : (state.profile?.microarea || '')
    };

    setButtonBusy(button, true, 'Salvando…');
    setStatus(status, 'Salvando…', 'info');
    try {
      const profile = await updateProfile(state.user.id, { ...basePatch, ...territorialPatch });
      const context = await buildContext(profile);
      setState({ profile, context });
      setStatus(status, 'Perfil salvo.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(status, scopeLocked ? 'Não foi possível salvar. Seu vínculo territorial aprovado é protegido pelo sistema.' : 'Não foi possível salvar o perfil.', 'error');
    } finally {
      setButtonBusy(button, false);
    }
  });
}
