import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml, formToObject, setStatus } from '../lib/dom.js';
import { canSubmitForm, setButtonBusy, setSelectError, setSelectLoading, setSelectReady } from '../lib/forms.js';
import { isMaster, roleLabel } from '../core/permissions.js';
import { listMunicipalities, listUnits, listTeams, updateProfile, buildContext } from '../services/repository.js';
import { setState } from '../core/store.js';

export function renderProfilePage({ state }) {
  const p = state.profile || {};
  const scopeLocked = !isMaster(p);
  const content = `
    <section class="panel"><p class="eyebrow">Perfil reutilizável</p><h2>Meu perfil e meu território</h2><p>Estes dados são salvos no Supabase e reaproveitados nos módulos. Informações de famílias não entram aqui.</p>
      <div class="role-notice"><strong>${escapeHtml(roleLabel(p))}</strong>${scopeLocked ? '<span>Seu município, UBS, equipe e microárea foram validados pela gestão. Para corrigir o vínculo, solicite a atualização à administração.</span>' : '<span>Como master, você pode ajustar seu próprio contexto institucional.</span>'}</div>
      <form id="profile-form" class="profile-sections">
        <fieldset><legend>Profissional</legend><div class="form-grid"><label>Nome completo<input name="full_name" value="${escapeHtml(p.full_name || '')}" required maxlength="160"></label><label>Microárea<input name="microarea" value="${escapeHtml(p.microarea || '')}" maxlength="40" placeholder="Ex.: 08" ${scopeLocked ? 'disabled aria-disabled="true"' : ''}></label><label>Telefone / contato institucional<input name="acs_phone" value="${escapeHtml(p.acs_phone || '')}" maxlength="80"></label></div>${scopeLocked ? '<p class="field-hint">Microárea faz parte do vínculo territorial aprovado e só pode ser alterada pela gestão.</p>' : ''}</fieldset>
        <fieldset><legend>Território</legend><div class="form-grid"><label>Município<select name="municipality_code" id="profile-municipality" ${scopeLocked ? 'disabled aria-disabled="true"' : ''}></select></label><label>Unidade<select name="unit_cnes" id="profile-unit" ${scopeLocked ? 'disabled aria-disabled="true"' : ''}></select></label><label>Equipe<select name="team_id" id="profile-team" ${scopeLocked ? 'disabled aria-disabled="true"' : ''}></select></label><label id="profile-custom-team-wrap" hidden>Nome da equipe<input name="team_name_custom" maxlength="120" ${scopeLocked ? 'disabled aria-disabled="true"' : ''}></label></div><div id="profile-source" class="source-note"></div></fieldset>
        <fieldset><legend>Dados institucionais usados nas carteirinhas</legend><div class="form-grid"><label>Telefone da unidade<input name="unit_phone" value="${escapeHtml(p.unit_phone || '')}" maxlength="80"></label><label>Horário<input name="unit_hours" value="${escapeHtml(p.unit_hours || '')}" maxlength="160"></label><label class="full">Endereço<input name="unit_address" value="${escapeHtml(p.unit_address || '')}" maxlength="240"></label></div></fieldset>
        <fieldset><legend>Profissionais de referência</legend><div class="form-grid"><label>Médica(o)<input name="doctor_name" value="${escapeHtml(p.doctor_name || '')}" maxlength="160"></label><label>Enfermeira(o)<input name="nurse_name" value="${escapeHtml(p.nurse_name || '')}" maxlength="160"></label><label>Técnica(o) de enfermagem<input name="tech_name" value="${escapeHtml(p.tech_name || '')}" maxlength="160"></label></div></fieldset>
        <div class="actions"><button class="button primary" type="submit">Salvar perfil</button><span id="profile-status" class="form-status" aria-live="polite"></span></div>
      </form>
    </section>`;
  return appLayout({ title: 'Meu perfil', subtitle: 'Dados profissionais e vínculo territorial.', activePath: '/app/perfil', content });
}

export async function mountProfilePage({ root, state }) {
  mountAppLayout(root);
  const scopeLocked = !isMaster(state.profile);
  const form = root.querySelector('#profile-form');
  const municipality = root.querySelector('#profile-municipality');
  const unit = root.querySelector('#profile-unit');
  const team = root.querySelector('#profile-team');
  const customWrap = root.querySelector('#profile-custom-team-wrap');
  const source = root.querySelector('#profile-source');
  const status = root.querySelector('#profile-status');
  let units = [];
  let teams = [];

  async function loadMunicipalities() {
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
      setSelectError(unit, 'Unidades indisponíveis');
      setSelectError(team, 'Equipes indisponíveis');
      throw error;
    } finally {
      form.removeAttribute('aria-busy');
    }
  }

  async function loadUnits(reset = true) {
    const municipalityCode = scopeLocked ? state.profile?.municipality_code : (municipality.value || null);
    setSelectLoading(unit, municipalityCode ? 'Carregando unidades…' : 'Selecione o município');
    setSelectLoading(team, 'Selecione a unidade');
    customWrap.hidden = true;
    if (!municipalityCode) {
      units = [];
      teams = [];
      setSelectReady(unit);
      setSelectReady(team);
      syncUnitFields(reset && !scopeLocked);
      return;
    }
    try {
      const rows = await listUnits({ municipalityCode });
      if (!scopeLocked && municipality.value !== municipalityCode) return;
      units = scopeLocked ? rows.filter((row) => row.cnes === state.profile?.unit_cnes) : rows;
      unit.innerHTML = '<option value="">Selecione</option>' + units.map((row) => `<option value="${escapeHtml(row.cnes)}">${escapeHtml(row.short_name)}${row.neighborhood ? ` — ${escapeHtml(row.neighborhood)}` : ''}</option>`).join('');
      setSelectReady(unit);
      if (!reset || scopeLocked) unit.value = state.profile?.unit_cnes || '';
      await loadTeams(reset && !scopeLocked);
      syncUnitFields(reset && !scopeLocked);
    } catch (error) {
      if (!scopeLocked && municipality.value !== municipalityCode) return;
      units = [];
      teams = [];
      setSelectError(unit, 'Não foi possível carregar as unidades');
      setSelectError(team, 'Equipes indisponíveis');
      source.textContent = '';
      throw error;
    }
  }

  async function loadTeams(reset = true) {
    const unitCnes = scopeLocked ? state.profile?.unit_cnes : unit.value;
    setSelectLoading(team, unitCnes ? 'Carregando equipes…' : 'Selecione a unidade');
    customWrap.hidden = true;
    if (!unitCnes) {
      teams = [];
      team.innerHTML = '<option value="">Equipe ainda não informada</option>';
      setSelectReady(team);
      return;
    }
    try {
      const rows = await listTeams({ unitCnes });
      if (!scopeLocked && unit.value !== unitCnes) return;
      teams = rows;
      team.innerHTML = '<option value="">Equipe ainda não informada</option>' + teams.map((row) => `<option value="${escapeHtml(row.id)}" data-name="${escapeHtml(row.name)}">${escapeHtml(row.name)}${row.ine ? ` • INE ${escapeHtml(row.ine)}` : ''}</option>`).join('') + (!scopeLocked ? '<option value="__other__">Minha equipe não aparece</option>' : '');
      setSelectReady(team);
      if ((!reset || scopeLocked) && state.profile?.team_id && teams.some((row) => row.id === state.profile.team_id)) team.value = state.profile.team_id;
      if (!scopeLocked && !reset && state.profile?.team_name && !state.profile?.team_id) {
        team.value = '__other__';
        customWrap.hidden = false;
        customWrap.querySelector('input').value = state.profile.team_name;
      }
    } catch (error) {
      if (!scopeLocked && unit.value !== unitCnes) return;
      teams = [];
      setSelectError(team, 'Não foi possível carregar as equipes');
      throw error;
    }
  }

  function syncUnitFields(overwrite = true) {
    const selectedCnes = scopeLocked ? state.profile?.unit_cnes : unit.value;
    const selected = units.find((row) => row.cnes === selectedCnes);
    if (!selected) {
      source.textContent = '';
      return;
    }
    source.textContent = `CNES ${selected.cnes} • ${selected.data_status === 'team_confirmed' ? 'confirmado localmente' : selected.data_status === 'needs_review' ? 'dados públicos a confirmar' : 'referência pública'}${scopeLocked ? ' • vínculo validado pela gestão' : ''}`;
    if (overwrite) {
      form.elements.unit_phone.value = selected.phone || '';
      form.elements.unit_address.value = [selected.address, selected.neighborhood].filter(Boolean).join(' — ');
      form.elements.unit_hours.value = selected.hours || '';
    }
  }

  if (!scopeLocked) {
    municipality.addEventListener('change', () => loadUnits(true).catch((error) => {
      console.error(error);
      setStatus(status, 'Não foi possível carregar as unidades. Selecione o município novamente para tentar.', 'error');
    }));
    unit.addEventListener('change', () => loadTeams(true).then(() => syncUnitFields(true)).catch((error) => {
      console.error(error);
      setStatus(status, 'Não foi possível carregar as equipes. Selecione a unidade novamente para tentar.', 'error');
    }));
    team.addEventListener('change', () => {
      customWrap.hidden = team.value !== '__other__';
      if (!customWrap.hidden) customWrap.querySelector('input').focus();
    });
  }

  try {
    await loadMunicipalities();
  } catch (error) {
    console.error(error);
    setStatus(status, 'Não foi possível carregar o catálogo territorial.', 'error');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (!canSubmitForm(form, button)) return;
    const values = formToObject(form);
    const municipalityCode = scopeLocked ? state.profile?.municipality_code : (values.municipality_code || null);
    const unitCnes = scopeLocked ? state.profile?.unit_cnes : (values.unit_cnes || null);
    const microarea = scopeLocked ? (state.profile?.microarea || '') : (values.microarea || '').trim();
    const selectedUnit = units.find((row) => row.cnes === unitCnes);
    const selectedTeam = scopeLocked ? teams.find((row) => row.id === state.profile?.team_id) : teams.find((row) => row.id === values.team_id);
    const teamId = scopeLocked ? (state.profile?.team_id || null) : (values.team_id && values.team_id !== '__other__' ? values.team_id : null);
    const teamName = scopeLocked ? (selectedTeam?.name || state.profile?.team_name || '') : (values.team_id === '__other__' ? (values.team_name_custom || '').trim() : (selectedTeam?.name || ''));

    setButtonBusy(button, true, 'Salvando…');
    setStatus(status, 'Salvando…', 'info');
    try {
      const profile = await updateProfile(state.user.id, {
        full_name: (values.full_name || '').trim(), microarea, acs_phone: (values.acs_phone || '').trim(),
        municipality_code: municipalityCode, unit_cnes: unitCnes, team_id: teamId,
        unit_name: selectedUnit?.name || state.profile?.unit_name || '', team_name: teamName,
        unit_phone: (values.unit_phone || '').trim(), unit_address: (values.unit_address || '').trim(), unit_hours: (values.unit_hours || '').trim(),
        doctor_name: (values.doctor_name || '').trim(), nurse_name: (values.nurse_name || '').trim(), tech_name: (values.tech_name || '').trim()
      });
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
