(function territorioVivoMultiUnit(){
  const cfg = window.TERRITORIO_VIVO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey || !window.supabase) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let cachedUnits = [];
  let cachedMunicipalities = [];
  let profileSnapshot = null;

  function loadStyle(){
    if ($('#tvMultiUnitStyles')) return;
    const link = document.createElement('link');
    link.id = 'tvMultiUnitStyles';
    link.rel = 'stylesheet';
    link.href = 'multiunit.css';
    document.head.appendChild(link);
  }

  async function getReferenceData(){
    const [{data:municipalities},{data:units}] = await Promise.all([
      client.from('municipalities').select('code,name,state_code').eq('active',true).order('name'),
      client.from('health_units').select('cnes,name,short_name,unit_type,address,neighborhood,phone,hours,municipality_code,municipality,state,data_status,source_label,source_url,source_checked_on,source_note,is_active,display_order').eq('is_active',true).order('display_order',{ascending:true})
    ]);
    cachedMunicipalities = municipalities || [];
    cachedUnits = units || [];
  }

  async function getCurrentProfile(){
    const {data:{session}} = await client.auth.getSession();
    if (!session) return null;
    const {data} = await client.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
    profileSnapshot = data || null;
    return profileSnapshot;
  }

  function installProfileTerritory(){
    const form = $('#profileForm');
    if (!form || $('#territoryFieldset')) return;
    const fieldset = document.createElement('fieldset');
    fieldset.id = 'territoryFieldset';
    fieldset.innerHTML = `
      <legend>Meu território</legend>
      <div class="form-grid territory-profile-grid">
        <label>Município<select id="profileMunicipalityRef"></select></label>
        <label>Unidade de saúde<select id="profileUnitRef"></select></label>
        <label>Equipe<select id="profileTeamRef"></select></label>
        <label id="profileTeamCustomWrap" hidden>Nome da equipe<input id="profileTeamCustom" maxlength="120" placeholder="Equipe ainda não cadastrada" /></label>
        <div class="full territory-source" id="profileTerritorySource"></div>
      </div>`;
    form.insertBefore(fieldset, form.firstElementChild);

    const baseUnit = $('#profileUnit');
    const baseTeam = $('#profileTeam');
    if (baseUnit) { baseUnit.readOnly = true; baseUnit.title = 'Preenchido a partir da unidade selecionada acima.'; }
    if (baseTeam) { baseTeam.readOnly = true; baseTeam.title = 'Preenchido a partir da equipe selecionada acima.'; }

    $('#profileMunicipalityRef').addEventListener('change', async () => { populateProfileUnits(); await onProfileUnitChange(false); });
    $('#profileUnitRef').addEventListener('change', () => onProfileUnitChange(true));
    $('#profileTeamRef').addEventListener('change', () => onProfileTeamChange(true));
    $('#profileTeamCustom').addEventListener('change', () => saveProfileTerritory());
  }

  function populateMunicipalities(selected){
    const select = $('#profileMunicipalityRef');
    if (!select) return;
    select.innerHTML = cachedMunicipalities.map((m) => `<option value="${esc(m.code)}">${esc(m.name)} — ${esc(m.state_code)}</option>`).join('');
    select.value = selected || cachedMunicipalities[0]?.code || '';
  }

  function populateProfileUnits(selected){
    const select = $('#profileUnitRef');
    if (!select) return;
    const municipalityCode = $('#profileMunicipalityRef')?.value;
    const units = cachedUnits.filter((u) => !municipalityCode || u.municipality_code === municipalityCode);
    select.innerHTML = '<option value="">Selecione</option>' + units.map((u) => `<option value="${esc(u.cnes)}">${esc(u.short_name)}${u.neighborhood ? ` — ${esc(u.neighborhood)}` : ''}</option>`).join('');
    if (selected) select.value = selected;
  }

  async function populateProfileTeams(selectedId, existingName){
    const select = $('#profileTeamRef');
    const customWrap = $('#profileTeamCustomWrap');
    const custom = $('#profileTeamCustom');
    const unitCnes = $('#profileUnitRef')?.value;
    if (!select) return;
    if (!unitCnes) {
      select.innerHTML = '<option value="">Selecione a unidade primeiro</option>';
      if (customWrap) customWrap.hidden = true;
      return;
    }
    const {data} = await client.from('teams').select('id,name,ine,verification_status').eq('unit_cnes',unitCnes).eq('active',true).order('name');
    const teams = data || [];
    select.innerHTML = '<option value="">Equipe ainda não informada</option>' + teams.map((t) => `<option value="${esc(t.id)}" data-name="${esc(t.name)}">${esc(t.name)}${t.ine ? ` • INE ${esc(t.ine)}` : ''}${t.verification_status==='pending'?' • a confirmar':''}</option>`).join('') + '<option value="__other__">Minha equipe não aparece</option>';
    if (selectedId && teams.some((t) => t.id === selectedId)) {
      select.value = selectedId;
      customWrap.hidden = true;
    } else if (existingName) {
      const byName = teams.find((t) => t.name.trim().toLowerCase() === existingName.trim().toLowerCase());
      if (byName) {
        select.value = byName.id;
        customWrap.hidden = true;
      } else {
        select.value = '__other__';
        customWrap.hidden = false;
        custom.value = existingName;
      }
    } else {
      select.value = '';
      customWrap.hidden = true;
    }
  }

  async function hydrateProfileTerritory(){
    if (!$('#territoryFieldset')) return;
    await getReferenceData();
    const profile = await getCurrentProfile();
    if (!profile) return;
    const municipality = profile.municipality_code || cachedUnits.find((u) => u.cnes === profile.unit_cnes)?.municipality_code || '110018';
    populateMunicipalities(municipality);
    populateProfileUnits(profile.unit_cnes);
    await populateProfileTeams(profile.team_id, profile.team_name);
    syncProfileUnitDisplay(false);
    updateTerritorySource();
  }

  function selectedUnit(){ return cachedUnits.find((u) => u.cnes === $('#profileUnitRef')?.value) || null; }

  function syncProfileUnitDisplay(overwriteContact){
    const unit = selectedUnit();
    if (!unit) return;
    if ($('#profileUnit')) $('#profileUnit').value = unit.name || unit.short_name || '';
    if (overwriteContact || !$('#profileUnitPhone')?.value) if ($('#profileUnitPhone')) $('#profileUnitPhone').value = unit.phone || '';
    if (overwriteContact || !$('#profileAddress')?.value) if ($('#profileAddress')) $('#profileAddress').value = [unit.address,unit.neighborhood].filter(Boolean).join(' — ');
    if (overwriteContact || !$('#profileHours')?.value) if ($('#profileHours')) $('#profileHours').value = unit.hours || '';
  }

  function updateTerritorySource(){
    const box = $('#profileTerritorySource');
    const unit = selectedUnit();
    if (!box) return;
    if (!unit) { box.innerHTML = '<span>Selecione uma unidade para reutilizar os dados institucionais nas carteirinhas.</span>'; return; }
    const badge = unit.data_status === 'team_confirmed' ? 'Confirmado pela equipe' : unit.data_status === 'needs_review' ? 'Dados públicos a confirmar' : 'Fonte pública';
    box.innerHTML = `<strong>${esc(badge)}</strong><span>CNES ${esc(unit.cnes)}${unit.source_checked_on ? ` • verificado em ${esc(unit.source_checked_on.split('-').reverse().join('/'))}` : ''}</span>${unit.source_note ? `<small>${esc(unit.source_note)}</small>` : ''}`;
  }

  async function onProfileUnitChange(save){
    syncProfileUnitDisplay(true);
    updateTerritorySource();
    await populateProfileTeams(null,'');
    if ($('#profileTeam')) $('#profileTeam').value = '';
    if (save) await saveProfileTerritory();
  }

  async function onProfileTeamChange(save){
    const select = $('#profileTeamRef');
    const customWrap = $('#profileTeamCustomWrap');
    const custom = $('#profileTeamCustom');
    const isOther = select?.value === '__other__';
    if (customWrap) customWrap.hidden = !isOther;
    if (!isOther) {
      const name = select?.selectedOptions[0]?.dataset.name || '';
      if ($('#profileTeam')) $('#profileTeam').value = name;
      if (custom) custom.value = '';
    } else if (custom) custom.focus();
    if (save && !isOther) await saveProfileTerritory();
  }

  async function saveProfileTerritory(){
    const {data:{session}} = await client.auth.getSession();
    if (!session) return;
    const municipalityCode = $('#profileMunicipalityRef')?.value || null;
    const unit = selectedUnit();
    const teamSelect = $('#profileTeamRef');
    const customTeam = $('#profileTeamCustom')?.value.trim() || '';
    const teamId = teamSelect?.value && teamSelect.value !== '__other__' ? teamSelect.value : null;
    const teamName = teamSelect?.value === '__other__' ? customTeam : (teamSelect?.selectedOptions[0]?.dataset.name || '');
    if ($('#profileTeam')) $('#profileTeam').value = teamName;
    const patch = {
      municipality_code: municipalityCode,
      unit_cnes: unit?.cnes || null,
      team_id: teamId,
      unit_name: unit?.name || '',
      team_name: teamName,
      unit_phone: $('#profileUnitPhone')?.value || unit?.phone || '',
      unit_address: $('#profileAddress')?.value || [unit?.address,unit?.neighborhood].filter(Boolean).join(' — '),
      unit_hours: $('#profileHours')?.value || unit?.hours || ''
    };
    const {error} = await client.from('profiles').update(patch).eq('id',session.user.id);
    const status = $('#profileStatus');
    if (status) status.textContent = error ? 'Não foi possível salvar o vínculo territorial.' : 'Território vinculado ao perfil.';
    if (!error) {
      profileSnapshot = {...(profileSnapshot||{}),...patch};
      try {
        if (typeof state !== 'undefined' && state?.profile) Object.assign(state.profile,patch);
        if (typeof hydrateProfileUI === 'function') hydrateProfileUI();
      } catch {}
    }
  }

  function installAdminNetwork(){
    const admin = $('#admin');
    if (!admin || $('#networkAdminPanel')) return false;
    const panel = document.createElement('div');
    panel.id = 'networkAdminPanel';
    panel.className = 'network-admin-stack';
    panel.innerHTML = `
      <article class="panel network-panel">
        <div class="panel-title"><div><span class="section-tag">Rede cadastrada</span><h3>Unidades de Pimenta Bueno</h3><p class="muted">Dados institucionais públicos podem ser confirmados pela equipe sem alterar a fonte original registrada.</p></div><button id="networkRefresh" class="button soft" type="button">Atualizar</button></div>
        <div id="networkUnits" class="network-unit-grid"></div>
      </article>
      <article class="panel network-panel">
        <div class="panel-title"><div><span class="section-tag">Equipes</span><h3>Cadastrar ou confirmar equipe</h3><p class="muted">A numeração e a composição mudam; por isso a equipe entra somente quando alguém confirma o vínculo atual.</p></div></div>
        <form id="teamAdminForm" class="network-team-form">
          <label>Unidade<select id="teamAdminUnit" required></select></label>
          <label>Nome da equipe<input id="teamAdminName" required maxlength="120" placeholder="Ex.: Equipe 03" /></label>
          <label>INE / identificador<input id="teamAdminIne" maxlength="30" placeholder="Opcional" /></label>
          <label class="network-check"><input id="teamAdminConfirmed" type="checkbox" checked /> Confirmada pela gestão/equipe</label>
          <button class="button primary" type="submit">Adicionar equipe</button>
          <span id="teamAdminStatus" class="form-status"></span>
        </form>
        <div id="networkTeams" class="network-team-list"></div>
      </article>`;
    const profilePanel = admin.querySelector('.panel');
    if (profilePanel) admin.insertBefore(panel, profilePanel); else admin.appendChild(panel);
    $('#networkRefresh').addEventListener('click', loadAdminNetwork);
    $('#teamAdminForm').addEventListener('submit', createTeam);
    $('#networkUnits').addEventListener('click', handleUnitActions);
    $('#networkTeams').addEventListener('click', handleTeamActions);
    loadAdminNetwork();
    return true;
  }

  async function loadAdminNetwork(){
    const nav = $('#adminNav');
    if (!nav || nav.hidden || !$('#networkAdminPanel')) return;
    await getReferenceData();
    const {data:teams} = await client.from('teams').select('id,unit_cnes,name,ine,verification_status,source_label,source_checked_on,active').order('unit_cnes').order('name');
    renderUnits();
    renderTeams(teams || []);
    const unitSelect = $('#teamAdminUnit');
    if (unitSelect) unitSelect.innerHTML = cachedUnits.map((u) => `<option value="${esc(u.cnes)}">${esc(u.short_name)}</option>`).join('');
    enrichAdminRows();
  }

  function renderUnits(){
    const root = $('#networkUnits');
    if (!root) return;
    root.innerHTML = cachedUnits.map((u) => {
      const status = u.data_status === 'team_confirmed' ? 'Confirmado' : u.data_status === 'needs_review' ? 'Revisar localmente' : 'Fonte pública';
      const cls = u.data_status === 'team_confirmed' ? 'confirmed' : u.data_status === 'needs_review' ? 'review' : 'public';
      return `<article class="network-unit-card">
        <div class="network-unit-head"><div><strong>${esc(u.short_name)}</strong><span>CNES ${esc(u.cnes)} • ${esc(u.unit_type)}</span></div><span class="network-status ${cls}">${status}</span></div>
        <p>${esc([u.address,u.neighborhood].filter(Boolean).join(' — ') || 'Endereço a confirmar')}</p>
        <p>${esc(u.phone || 'Telefone a confirmar')}</p>
        <small>${esc(u.source_label || 'Fonte pública')}${u.source_checked_on ? ` • ${esc(u.source_checked_on.split('-').reverse().join('/'))}` : ''}</small>
        <div class="network-unit-actions">${u.data_status!=='team_confirmed' ? `<button class="button soft" type="button" data-confirm-unit="${esc(u.cnes)}">Confirmar dados atuais</button>` : ''}</div>
      </article>`;
    }).join('');
  }

  function renderTeams(teams){
    const root = $('#networkTeams');
    if (!root) return;
    if (!teams.length) { root.innerHTML = '<div class="admin-empty">Nenhuma equipe cadastrada ainda.</div>'; return; }
    root.innerHTML = `<div class="network-team-table"><table><thead><tr><th>Unidade</th><th>Equipe</th><th>INE</th><th>Status</th><th></th></tr></thead><tbody>${teams.map((t) => {
      const unit = cachedUnits.find((u) => u.cnes === t.unit_cnes);
      return `<tr><td>${esc(unit?.short_name || t.unit_cnes)}</td><td>${esc(t.name)}</td><td>${esc(t.ine || '—')}</td><td><span class="network-status ${t.verification_status==='confirmed'?'confirmed':'review'}">${t.verification_status==='confirmed'?'Confirmada':'A confirmar'}</span></td><td><button class="button soft" type="button" data-toggle-team="${esc(t.id)}" data-status="${esc(t.verification_status)}">${t.verification_status==='confirmed'?'Marcar a confirmar':'Confirmar'}</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  async function createTeam(event){
    event.preventDefault();
    const status = $('#teamAdminStatus');
    const payload = {
      unit_cnes: $('#teamAdminUnit').value,
      name: $('#teamAdminName').value.trim(),
      ine: $('#teamAdminIne').value.trim() || null,
      verification_status: $('#teamAdminConfirmed').checked ? 'confirmed' : 'pending',
      source_label: 'Confirmado no Território Vivo',
      source_checked_on: new Date().toISOString().slice(0,10),
      source_note: 'Cadastro administrativo realizado pela conta master.'
    };
    status.textContent = 'Salvando equipe…';
    const {error} = await client.from('teams').insert(payload);
    if (error) {
      status.textContent = error.code === '23505' ? 'Essa equipe ou INE já está cadastrado.' : 'Não foi possível cadastrar a equipe.';
      return;
    }
    status.textContent = 'Equipe cadastrada.';
    event.target.reset();
    $('#teamAdminConfirmed').checked = true;
    await loadAdminNetwork();
  }

  async function handleUnitActions(event){
    const button = event.target.closest('[data-confirm-unit]');
    if (!button) return;
    button.disabled = true;
    const {error} = await client.from('health_units').update({data_status:'team_confirmed',source_note:'Dados institucionais conferidos localmente no Território Vivo.'}).eq('cnes',button.dataset.confirmUnit);
    if (!error) await loadAdminNetwork(); else button.disabled = false;
  }

  async function handleTeamActions(event){
    const button = event.target.closest('[data-toggle-team]');
    if (!button) return;
    const next = button.dataset.status === 'confirmed' ? 'pending' : 'confirmed';
    button.disabled = true;
    const {error} = await client.from('teams').update({verification_status:next,source_label:next==='confirmed'?'Confirmado no Território Vivo':'Aguardando confirmação',source_checked_on:new Date().toISOString().slice(0,10)}).eq('id',button.dataset.toggleTeam);
    if (!error) await loadAdminNetwork(); else button.disabled = false;
  }

  async function enrichAdminRows(){
    const rows = $$('[data-admin-row]');
    if (!rows.length) return;
    const {data} = await client.from('profiles').select('id,unit_cnes,team_name,microarea');
    (data || []).forEach((p) => {
      const row = rows.find((r) => r.dataset.id === p.id);
      if (!row || row.querySelector('.admin-territory-context')) return;
      const unit = cachedUnits.find((u) => u.cnes === p.unit_cnes);
      const cell = row.querySelector('td');
      if (!cell) return;
      const small = document.createElement('small');
      small.className = 'admin-territory-context';
      small.textContent = [unit?.short_name,p.team_name,p.microarea ? `MA ${p.microarea}` : ''].filter(Boolean).join(' • ') || 'Vínculo territorial a completar';
      cell.appendChild(small);
      row.dataset.search = `${row.dataset.search || ''} ${(unit?.short_name || '').toLowerCase()} ${(p.team_name || '').toLowerCase()}`;
    });
  }

  function installAdminObserver(){
    if (installAdminNetwork()) return;
    const observer = new MutationObserver(() => {
      if (installAdminNetwork()) observer.disconnect();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(() => observer.disconnect(),10000);
  }

  async function refreshAll(){
    installProfileTerritory();
    await hydrateProfileTerritory();
    installAdminObserver();
  }

  function init(){
    loadStyle();
    installProfileTerritory();
    installAdminObserver();
    setTimeout(hydrateProfileTerritory,500);
    client.auth.onAuthStateChange(() => setTimeout(refreshAll,250));
    document.addEventListener('click',(event) => {
      if (event.target.closest('#adminNav')) setTimeout(loadAdminNetwork,250);
      if (event.target.closest('[data-section="profile"], [data-section-jump="profile"]')) setTimeout(hydrateProfileTerritory,150);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
