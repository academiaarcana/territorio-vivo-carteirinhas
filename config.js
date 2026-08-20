window.TERRITORIO_VIVO_CONFIG = {
  supabaseUrl: 'https://wguurbmtoofkubdawzzr.supabase.co',
  supabasePublishableKey: 'sb_publishable_rQHwNahb5qL7gkXa0JVXow_fxws-PLY'
};

(function setupSelfRegistration(){
  const cfg = window.TERRITORIO_VIVO_CONFIG;
  if (!cfg?.supabaseUrl || !cfg?.supabasePublishableKey || !window.supabase) return;

  const authCard = document.querySelector('.auth-card');
  const loginForm = document.querySelector('#loginForm');
  if (!authCard || !loginForm || document.querySelector('#signupPanel')) return;

  const MASTER_EMAIL = 'macedotaynara@outlook.com';
  const registrationClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'showSignup';
  button.className = 'button soft wide';
  button.textContent = 'Criar minha conta';
  loginForm.insertAdjacentElement('afterend', button);

  const panel = document.createElement('div');
  panel.id = 'signupPanel';
  panel.hidden = true;
  panel.innerHTML = `
    <form id="signupForm" class="stack" autocomplete="on" style="margin-top:1rem">
      <div class="privacy-banner"><strong>Cadastro de acesso.</strong> Informe apenas seus dados profissionais. Dados de pacientes não são cadastrados aqui.</div>
      <label>Nome completo<input id="signupName" type="text" autocomplete="name" required /></label>
      <label>E-mail<input id="signupEmail" type="email" autocomplete="email" required /></label>
      <label>Município
        <select id="signupMunicipality" required><option value="">Carregando…</option></select>
      </label>
      <label>Unidade de saúde / ponto de atendimento
        <select id="signupUnit" required><option value="">Selecione o município primeiro</option></select>
      </label>
      <label>Equipe
        <select id="signupTeamSelect"><option value="">Selecione a unidade primeiro</option></select>
      </label>
      <label id="signupTeamCustomWrap" hidden>Nome da equipe <span style="font-weight:400">(para confirmação)</span>
        <input id="signupTeamCustom" type="text" maxlength="120" placeholder="Ex.: Equipe 03 ou eSF Rural" />
      </label>
      <label>Microárea
        <input id="signupMicroarea" type="text" maxlength="40" placeholder="Ex.: 08" required />
      </label>
      <p id="signupContextHint" class="form-status">A unidade, equipe e microárea ajudam o sistema a preencher automaticamente as carteirinhas.</p>
      <label>Senha<input id="signupPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
      <label>Repita a senha<input id="signupPassword2" type="password" autocomplete="new-password" minlength="8" required /></label>
      <button class="button primary wide" type="submit">Criar conta</button>
      <button id="cancelSignup" class="button soft wide" type="button">Voltar para o login</button>
      <p id="signupStatus" class="form-status" aria-live="polite"></p>
    </form>`;
  button.insertAdjacentElement('afterend', panel);

  const municipalitySelect = panel.querySelector('#signupMunicipality');
  const unitSelect = panel.querySelector('#signupUnit');
  const teamSelect = panel.querySelector('#signupTeamSelect');
  const teamCustomWrap = panel.querySelector('#signupTeamCustomWrap');
  const teamCustom = panel.querySelector('#signupTeamCustom');
  const emailInput = panel.querySelector('#signupEmail');
  const microareaInput = panel.querySelector('#signupMicroarea');
  const contextHint = panel.querySelector('#signupContextHint');

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  async function loadMunicipalities(){
    const { data, error } = await registrationClient.from('municipalities').select('code,name,state_code').eq('active',true).order('name');
    if (error || !data?.length) {
      municipalitySelect.innerHTML = '<option value="110018">Pimenta Bueno — RO</option>';
      municipalitySelect.value = '110018';
      await loadUnits();
      return;
    }
    municipalitySelect.innerHTML = data.map((item) => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.name)} — ${escapeHtml(item.state_code)}</option>`).join('');
    if (data.some((item) => item.code === '110018')) municipalitySelect.value = '110018';
    await loadUnits();
  }

  async function loadUnits(){
    const municipality = municipalitySelect.value;
    unitSelect.innerHTML = '<option value="">Carregando unidades…</option>';
    teamSelect.innerHTML = '<option value="">Selecione a unidade primeiro</option>';
    teamCustomWrap.hidden = true;
    let query = registrationClient.from('health_units').select('cnes,short_name,neighborhood,unit_type,data_status').eq('is_active',true).order('display_order',{ascending:true});
    if (municipality) query = query.eq('municipality_code',municipality);
    const { data, error } = await query;
    if (error || !data?.length) {
      unitSelect.innerHTML = '<option value="">Nenhuma unidade cadastrada</option>';
      return;
    }
    unitSelect.innerHTML = '<option value="">Selecione sua unidade</option>' + data.map((unit) => {
      const place = unit.neighborhood ? ` — ${escapeHtml(unit.neighborhood)}` : '';
      const review = unit.data_status === 'needs_review' ? ' • dados a confirmar' : '';
      return `<option value="${escapeHtml(unit.cnes)}">${escapeHtml(unit.short_name)}${place}${review}</option>`;
    }).join('');
  }

  async function loadTeams(){
    const unitCnes = unitSelect.value;
    teamCustomWrap.hidden = true;
    teamCustom.value = '';
    if (!unitCnes) {
      teamSelect.innerHTML = '<option value="">Selecione a unidade primeiro</option>';
      return;
    }
    const { data } = await registrationClient.from('teams').select('id,name,ine,verification_status').eq('unit_cnes',unitCnes).eq('active',true).order('name');
    const teams = data || [];
    teamSelect.innerHTML = '<option value="">Equipe ainda não informada</option>' + teams.map((team) => {
      const ine = team.ine ? ` • INE ${escapeHtml(team.ine)}` : '';
      const status = team.verification_status === 'confirmed' ? '' : ' • a confirmar';
      return `<option value="${escapeHtml(team.id)}" data-name="${escapeHtml(team.name)}">${escapeHtml(team.name)}${ine}${status}</option>`;
    }).join('') + '<option value="__other__">Minha equipe não aparece na lista</option>';
  }

  function syncTeamCustom(){
    teamCustomWrap.hidden = teamSelect.value !== '__other__';
    if (!teamCustomWrap.hidden) teamCustom.focus();
  }

  function syncMasterFields(){
    const isMaster = emailInput.value.trim().toLowerCase() === MASTER_EMAIL;
    municipalitySelect.required = !isMaster;
    unitSelect.required = !isMaster;
    microareaInput.required = !isMaster;
    if (isMaster) {
      contextHint.textContent = 'Conta master: município, unidade, equipe e microárea são opcionais.';
      microareaInput.placeholder = 'Opcional para a conta master';
    } else {
      contextHint.textContent = 'A unidade, equipe e microárea ajudam o sistema a preencher automaticamente as carteirinhas.';
      microareaInput.placeholder = 'Ex.: 08';
    }
  }

  municipalitySelect.addEventListener('change', loadUnits);
  unitSelect.addEventListener('change', loadTeams);
  teamSelect.addEventListener('change', syncTeamCustom);
  emailInput.addEventListener('input', syncMasterFields);
  loadMunicipalities();

  const showLogin = () => { panel.hidden = true; loginForm.hidden = false; button.hidden = false; };
  const showSignup = () => { panel.hidden = false; loginForm.hidden = true; button.hidden = true; syncMasterFields(); };
  button.addEventListener('click', showSignup);
  panel.querySelector('#cancelSignup').addEventListener('click', showLogin);

  panel.querySelector('#signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = panel.querySelector('#signupStatus');
    const name = panel.querySelector('#signupName').value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const municipalityCode = municipalitySelect.value;
    const unitCnes = unitSelect.value;
    const selectedTeamOption = teamSelect.selectedOptions[0];
    const teamId = teamSelect.value && teamSelect.value !== '__other__' ? teamSelect.value : null;
    const teamName = teamSelect.value === '__other__' ? teamCustom.value.trim() : (selectedTeamOption?.dataset.name || '');
    const microarea = microareaInput.value.trim();
    const password = panel.querySelector('#signupPassword').value;
    const password2 = panel.querySelector('#signupPassword2').value;
    const isMaster = email === MASTER_EMAIL;

    if (!isMaster && !unitCnes) { status.textContent = 'Selecione a unidade de saúde onde você atua.'; return; }
    if (!isMaster && !microarea) { status.textContent = 'Informe sua microárea.'; return; }
    if (teamSelect.value === '__other__' && !teamName) { status.textContent = 'Informe o nome da sua equipe para que a conta master possa confirmá-la.'; return; }
    if (password !== password2) { status.textContent = 'As senhas não são iguais.'; return; }

    status.textContent = 'Criando sua conta…';
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await registrationClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name:name, municipality_code:municipalityCode || null, unit_cnes:unitCnes || null, team_id:teamId, team_name:teamName, microarea },
        emailRedirectTo: redirectUrl
      }
    });

    if (error) { status.textContent = 'Não foi possível criar a conta. Verifique os dados e tente novamente.'; return; }
    if (data?.session) {
      status.textContent = 'Conta criada. Entrando…';
      setTimeout(() => window.location.reload(),500);
    } else {
      status.textContent = 'Conta criada. Confira seu e-mail para confirmar o cadastro e depois faça login.';
    }
  });
})();

(function loadTerritorioVivoEnhancements(){
  const scripts = [
    ['enhancements.js','tv-enhancements'],
    ['multiunit.js','tv-multiunit'],
    ['network-context.js','tv-network-context'],
    ['public-site.js','tv-public-site']
  ];
  scripts.forEach(([src,key]) => {
    if (document.querySelector(`script[data-${key}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(`data-${key}`,'true');
    document.head.appendChild(script);
  });
})();
