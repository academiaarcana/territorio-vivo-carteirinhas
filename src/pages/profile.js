import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml, formToObject, setStatus } from '../lib/dom.js';
import { listMunicipalities, listUnits, listTeams, updateProfile, buildContext } from '../services/repository.js';
import { setState } from '../core/store.js';

export function renderProfilePage({ state }) {
  const p = state.profile || {};
  const content = `
    <section class="panel"><p class="eyebrow">Perfil reutilizável</p><h2>Meu perfil e meu território</h2><p>Estes dados são salvos no Supabase e reaproveitados nos módulos. Informações de famílias não entram aqui.</p>
      <form id="profile-form" class="profile-sections">
        <fieldset><legend>Profissional</legend><div class="form-grid"><label>Nome completo<input name="full_name" value="${escapeHtml(p.full_name || '')}" required></label><label>Microárea<input name="microarea" value="${escapeHtml(p.microarea || '')}" maxlength="40" placeholder="Ex.: 08"></label><label>Telefone / contato institucional<input name="acs_phone" value="${escapeHtml(p.acs_phone || '')}"></label></div></fieldset>
        <fieldset><legend>Território</legend><div class="form-grid"><label>Município<select name="municipality_code" id="profile-municipality"></select></label><label>Unidade<select name="unit_cnes" id="profile-unit"></select></label><label>Equipe<select name="team_id" id="profile-team"></select></label><label id="profile-custom-team-wrap" hidden>Nome da equipe<input name="team_name_custom" maxlength="120"></label></div><div id="profile-source" class="source-note"></div></fieldset>
        <fieldset><legend>Dados institucionais usados nas carteirinhas</legend><div class="form-grid"><label>Telefone da unidade<input name="unit_phone" value="${escapeHtml(p.unit_phone || '')}"></label><label>Horário<input name="unit_hours" value="${escapeHtml(p.unit_hours || '')}"></label><label class="full">Endereço<input name="unit_address" value="${escapeHtml(p.unit_address || '')}"></label></div></fieldset>
        <fieldset><legend>Profissionais de referência</legend><div class="form-grid"><label>Médica(o)<input name="doctor_name" value="${escapeHtml(p.doctor_name || '')}"></label><label>Enfermeira(o)<input name="nurse_name" value="${escapeHtml(p.nurse_name || '')}"></label><label>Técnica(o) de enfermagem<input name="tech_name" value="${escapeHtml(p.tech_name || '')}"></label></div></fieldset>
        <div class="actions"><button class="button primary" type="submit">Salvar perfil</button><span id="profile-status" class="form-status" aria-live="polite"></span></div>
      </form>
    </section>`;
  return appLayout({ title: 'Meu perfil', subtitle: 'Dados profissionais e vínculo territorial.', activePath: '/app/perfil', content });
}

export async function mountProfilePage({ root, state }) {
  mountAppLayout(root);
  const form = root.querySelector('#profile-form');
  const municipality = root.querySelector('#profile-municipality');
  const unit = root.querySelector('#profile-unit');
  const team = root.querySelector('#profile-team');
  const customWrap = root.querySelector('#profile-custom-team-wrap');
  const source = root.querySelector('#profile-source');
  let units = [];
  let teams = [];

  async function loadMunicipalities() {
    const rows = await listMunicipalities();
    municipality.innerHTML = '<option value="">Selecione</option>' + rows.map((row) => `<option value="${escapeHtml(row.code)}">${escapeHtml(row.name)} — ${escapeHtml(row.state_code)}</option>`).join('');
    municipality.value = state.profile?.municipality_code || '';
    await loadUnits(false);
  }

  async function loadUnits(reset = true) {
    units = await listUnits({ municipalityCode: municipality.value || null });
    unit.innerHTML = '<option value="">Selecione</option>' + units.map((row) => `<option value="${escapeHtml(row.cnes)}">${escapeHtml(row.short_name)}${row.neighborhood ? ` — ${escapeHtml(row.neighborhood)}` : ''}</option>`).join('');
    if (!reset) unit.value = state.profile?.unit_cnes || '';
    await loadTeams(reset);
    syncUnitFields(reset);
  }

  async function loadTeams(reset = true) {
    teams = unit.value ? await listTeams({ unitCnes: unit.value }) : [];
    team.innerHTML = '<option value="">Equipe ainda não informada</option>' + teams.map((row) => `<option value="${escapeHtml(row.id)}" data-name="${escapeHtml(row.name)}">${escapeHtml(row.name)}${row.ine ? ` • INE ${escapeHtml(row.ine)}` : ''}</option>`).join('') + (unit.value ? '<option value="__other__">Minha equipe não aparece</option>' : '');
    if (!reset && state.profile?.team_id && teams.some((row) => row.id === state.profile.team_id)) {
      team.value = state.profile.team_id;
    } else if (!reset && state.profile?.team_name && !state.profile?.team_id) {
      team.value = '__other__';
      customWrap.hidden = false;
      customWrap.querySelector('input').value = state.profile.team_name;
    } else {
      customWrap.hidden = true;
    }
  }

  function syncUnitFields(overwrite = true) {
    const selected = units.find((row) => row.cnes === unit.value);
    if (!selected) { source.textContent = ''; return; }
    source.textContent = `CNES ${selected.cnes} • ${selected.data_status === 'team_confirmed' ? 'confirmado localmente' : selected.data_status === 'needs_review' ? 'dados públicos a confirmar' : 'referência pública'}`;
    if (overwrite) {
      form.elements.unit_phone.value = selected.phone || '';
      form.elements.unit_address.value = [selected.address, selected.neighborhood].filter(Boolean).join(' — ');
      form.elements.unit_hours.value = selected.hours || '';
    }
  }

  municipality.addEventListener('change', () => loadUnits(true));
  unit.addEventListener('change', async () => { await loadTeams(true); syncUnitFields(true); });
  team.addEventListener('change', () => {
    customWrap.hidden = team.value !== '__other__';
    if (!customWrap.hidden) customWrap.querySelector('input').focus();
  });

  try { await loadMunicipalities(); } catch { setStatus(root.querySelector('#profile-status'), 'Não foi possível carregar o catálogo territorial.', 'error'); }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = root.querySelector('#profile-status');
    const values = formToObject(form);
    const selectedUnit = units.find((row) => row.cnes === values.unit_cnes);
    const selectedTeam = teams.find((row) => row.id === values.team_id);
    const teamId = values.team_id && values.team_id !== '__other__' ? values.team_id : null;
    const teamName = values.team_id === '__other__' ? values.team_name_custom.trim() : (selectedTeam?.name || '');
    setStatus(status, 'Salvando…', 'info');
    try {
      const profile = await updateProfile(state.user.id, {
        full_name: values.full_name.trim(), microarea: values.microarea.trim(), acs_phone: values.acs_phone.trim(),
        municipality_code: values.municipality_code || null, unit_cnes: values.unit_cnes || null, team_id: teamId,
        unit_name: selectedUnit?.name || '', team_name: teamName,
        unit_phone: values.unit_phone.trim(), unit_address: values.unit_address.trim(), unit_hours: values.unit_hours.trim(),
        doctor_name: values.doctor_name.trim(), nurse_name: values.nurse_name.trim(), tech_name: values.tech_name.trim()
      });
      const context = await buildContext(profile);
      setState({ profile, context });
      setStatus(status, 'Perfil salvo.', 'success');
    } catch {
      setStatus(status, 'Não foi possível salvar o perfil.', 'error');
    }
  });
}
