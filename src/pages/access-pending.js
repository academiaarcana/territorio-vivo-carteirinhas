import { escapeHtml, formToObject, setStatus } from '../lib/dom.js';
import { canSubmitForm, setButtonBusy, setSelectError, setSelectLoading, setSelectReady } from '../lib/forms.js';
import { navigate } from '../core/router.js';
import { setState } from '../core/store.js';
import { isPendingProfile, isSuspendedProfile, accessStatusLabel } from '../core/permissions.js';
import { signOut } from '../services/auth.js';
import { getProfile, listMunicipalities, listUnits, listTeams, updateProfile, buildContext } from '../services/repository.js';

export function renderAccessPendingPage({ state }) {
  const profile = state.profile || {};
  const pending = isPendingProfile(profile);
  const suspended = isSuspendedProfile(profile);
  const title = suspended ? 'Acesso temporariamente suspenso' : 'Cadastro aguardando aprovação';
  const intro = suspended
    ? 'Seu perfil continua cadastrado, mas o acesso às áreas internas está suspenso. Procure a administração da sua UBS ou a gestão municipal.'
    : 'Seu e-mail já foi autenticado. Antes de liberar dados internos do território, a gestão da UBS precisa confirmar seu vínculo profissional.';

  return `
    <main class="standalone access-gate">
      <a href="#/" class="brand"><span class="brand-mark" aria-hidden="true">TV</span><span><strong>Território Vivo</strong><small>Acesso profissional</small></span></a>
      <section class="panel">
        <p class="eyebrow">${escapeHtml(accessStatusLabel(profile))}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(intro)}</p>
        <dl class="summary-list">
          <div><dt>Profissional</dt><dd data-pending-summary="full_name">${escapeHtml(profile.full_name || '—')}</dd></div>
          <div><dt>Unidade</dt><dd data-pending-summary="unit_name">${escapeHtml(profile.unit_name || 'Não informada')}</dd></div>
          <div><dt>Equipe</dt><dd data-pending-summary="team_name">${escapeHtml(profile.team_name || 'A confirmar')}</dd></div>
          <div><dt>Microárea</dt><dd data-pending-summary="microarea">${escapeHtml(profile.microarea || 'Não informada')}</dd></div>
        </dl>
        <div class="actions">
          <button class="button primary" type="button" id="check-access">Verificar aprovação</button>
          <button class="button" type="button" id="pending-signout">Sair</button>
        </div>
        <p id="pending-status" class="form-status" aria-live="polite"></p>
      </section>
      ${pending ? `
      <section class="panel">
        <p class="eyebrow">Antes da aprovação</p>
        <h2>Revise seu vínculo</h2>
        <p>Se você escolheu a unidade, equipe ou microárea errada no cadastro, pode corrigir enquanto a solicitação ainda está pendente. Depois da aprovação, alterações de vínculo são feitas pela gestão.</p>
        <form id="pending-profile-form" class="stack-form">
          <label>Nome completo<input name="full_name" value="${escapeHtml(profile.full_name || '')}" maxlength="160" required></label>
          <label>Contato institucional<input name="acs_phone" value="${escapeHtml(profile.acs_phone || '')}" maxlength="80"></label>
          <label>Município<select name="municipality_code" id="pending-municipality" required><option value="">Carregando…</option></select></label>
          <label>Unidade<select name="unit_cnes" id="pending-unit" required><option value="">Selecione o município</option></select></label>
          <label>Equipe<select name="team_id" id="pending-team"><option value="">Selecione a unidade</option></select></label>
          <label id="pending-custom-team-wrap" hidden>Nome da equipe para confirmação<input name="team_name_custom" maxlength="120"></label>
          <label>Microárea<input name="microarea" value="${escapeHtml(profile.microarea || '')}" maxlength="40" required></label>
          <button class="button primary" type="submit">Salvar solicitação</button>
        </form>
      </section>` : ''}
    </main>`;
}

export async function mountAccessPendingPage({ root, state }) {
  const status = root.querySelector('#pending-status');
  const actionRegion = root.querySelector('.access-gate');
  let actionInFlight = false;

  function syncPendingSummary(profile = {}) {
    const summary = {
      full_name: profile.full_name || '—',
      unit_name: profile.unit_name || 'Não informada',
      team_name: profile.team_name || 'A confirmar',
      microarea: profile.microarea || 'Não informada'
    };
    Object.entries(summary).forEach(([key, value]) => {
      const node = root.querySelector(`[data-pending-summary="${key}"]`);
      if (node) node.textContent = value;
    });
  }

  function setPendingActionsBusy(actor, busy, label = '') {
    const buttons = [...root.querySelectorAll('#check-access, #pending-signout, #pending-profile-form button[type="submit"]')];
    if (busy) {
      actionRegion?.setAttribute('aria-busy', 'true');
      buttons.forEach((button) => setButtonBusy(button, true, button === actor ? label : ''));
      return;
    }
    buttons.forEach((button) => setButtonBusy(button, false));
    actionRegion?.removeAttribute('aria-busy');
  }

  root.querySelector('#pending-signout')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (button.disabled || actionInFlight) return;
    actionInFlight = true;
    setPendingActionsBusy(button, true, 'Saindo…');
    try {
      await signOut();
      await navigate('/');
    } catch (error) {
      console.error(error);
      setStatus(status, 'Não foi possível sair agora. Tente novamente.', 'error');
    } finally {
      actionInFlight = false;
      setPendingActionsBusy(button, false);
    }
  });

  root.querySelector('#check-access')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (button.disabled || actionInFlight) return;
    actionInFlight = true;
    setPendingActionsBusy(button, true, 'Verificando…');
    setStatus(status, 'Verificando…', 'info');
    try {
      const profile = await getProfile(state.user.id);
      const context = profile ? await buildContext(profile) : null;
      setState({ profile, context });
      syncPendingSummary(profile);
      if (profile?.access_status === 'active') {
        setStatus(status, 'Acesso aprovado. Entrando…', 'success');
        await navigate('/app/inicio', { replace: true });
        return;
      }
      setStatus(status, profile?.access_status === 'suspended' ? 'O acesso continua suspenso.' : 'A solicitação ainda aguarda aprovação da gestão.', 'info');
    } catch (error) {
      console.error(error);
      setStatus(status, 'Não foi possível verificar o acesso agora.', 'error');
    } finally {
      actionInFlight = false;
      setPendingActionsBusy(button, false);
    }
  });

  const form = root.querySelector('#pending-profile-form');
  if (!form) return;

  const municipality = root.querySelector('#pending-municipality');
  const unit = root.querySelector('#pending-unit');
  const team = root.querySelector('#pending-team');
  const customWrap = root.querySelector('#pending-custom-team-wrap');
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
    const municipalityCode = municipality.value;
    setSelectLoading(unit, municipalityCode ? 'Carregando unidades…' : 'Selecione o município');
    setSelectLoading(team, 'Selecione a unidade');
    customWrap.hidden = true;
    if (!municipalityCode) {
      units = [];
      teams = [];
      setSelectReady(unit);
      setSelectReady(team);
      return;
    }
    try {
      const rows = await listUnits({ municipalityCode });
      if (municipality.value !== municipalityCode) return;
      units = rows;
      unit.innerHTML = '<option value="">Selecione</option>' + units.map((row) => `<option value="${escapeHtml(row.cnes)}">${escapeHtml(row.short_name)}</option>`).join('');
      setSelectReady(unit);
      if (!reset) unit.value = state.profile?.unit_cnes || '';
      await loadTeams(reset);
    } catch (error) {
      if (municipality.value !== municipalityCode) return;
      units = [];
      teams = [];
      setSelectError(unit, 'Não foi possível carregar as unidades');
      setSelectError(team, 'Equipes indisponíveis');
      throw error;
    }
  }

  async function loadTeams(reset = true) {
    const unitCnes = unit.value;
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
      if (unit.value !== unitCnes) return;
      teams = rows;
      team.innerHTML = '<option value="">Equipe ainda não informada</option>' + teams.map((row) => `<option value="${escapeHtml(row.id)}" data-name="${escapeHtml(row.name)}">${escapeHtml(row.name)}${row.ine ? ` • INE ${escapeHtml(row.ine)}` : ''}</option>`).join('') + '<option value="__other__">Minha equipe não aparece</option>';
      setSelectReady(team);
      if (!reset && state.profile?.team_id && teams.some((row) => row.id === state.profile.team_id)) {
        team.value = state.profile.team_id;
      } else if (!reset && state.profile?.team_name && !state.profile?.team_id) {
        team.value = '__other__';
        customWrap.hidden = false;
        customWrap.querySelector('input').value = state.profile.team_name;
      }
    } catch (error) {
      if (unit.value !== unitCnes) return;
      teams = [];
      setSelectError(team, 'Não foi possível carregar as equipes');
      throw error;
    }
  }

  municipality.addEventListener('change', () => loadUnits(true).catch((error) => {
    console.error(error);
    setStatus(status, 'Não foi possível carregar as unidades. Selecione o município novamente para tentar.', 'error');
  }));
  unit.addEventListener('change', () => loadTeams(true).catch((error) => {
    console.error(error);
    setStatus(status, 'Não foi possível carregar as equipes. Selecione a unidade novamente para tentar.', 'error');
  }));
  team.addEventListener('change', () => {
    customWrap.hidden = team.value !== '__other__';
    if (!customWrap.hidden) customWrap.querySelector('input').focus();
  });

  try {
    await loadMunicipalities();
  } catch (error) {
    console.error(error);
    setStatus(status, 'Não foi possível carregar o catálogo territorial.', 'error');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    if (actionInFlight || !canSubmitForm(form, button)) {
      if (form.querySelector('select[required][data-load-state="error"]')) setStatus(status, 'O catálogo territorial não carregou corretamente. Tente novamente antes de salvar.', 'error');
      return;
    }
    const values = formToObject(form);
    const selectedUnit = units.find((row) => row.cnes === values.unit_cnes);
    const selectedTeam = teams.find((row) => row.id === values.team_id);
    const teamId = values.team_id && values.team_id !== '__other__' ? values.team_id : null;
    const teamName = values.team_id === '__other__' ? (values.team_name_custom || '').trim() : (selectedTeam?.name || '');
    if (values.team_id === '__other__' && !teamName) return setStatus(status, 'Informe o nome da equipe para confirmação.', 'error');

    actionInFlight = true;
    setPendingActionsBusy(button, true, 'Salvando…');
    setStatus(status, 'Salvando solicitação…', 'info');
    try {
      const profile = await updateProfile(state.user.id, {
        full_name: values.full_name.trim(), acs_phone: values.acs_phone.trim(), microarea: values.microarea.trim(),
        municipality_code: values.municipality_code, unit_cnes: values.unit_cnes, team_id: teamId,
        unit_name: selectedUnit?.name || '', team_name: teamName
      });
      const context = await buildContext(profile);
      setState({ profile, context });
      syncPendingSummary(profile);
      setStatus(status, 'Solicitação atualizada. A gestão verá os dados revisados.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(status, 'Não foi possível salvar a solicitação.', 'error');
    } finally {
      actionInFlight = false;
      setPendingActionsBusy(button, false);
    }
  });
}
