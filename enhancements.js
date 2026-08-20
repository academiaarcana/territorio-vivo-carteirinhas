(function territorioVivoEnhancements(){
  const cfg = window.TERRITORIO_VIVO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey || !window.supabase) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const returnUrl = () => `${window.location.origin}${window.location.pathname}`;

  let unitCache = [];
  let currentProfile = null;

  function loadStyles(){
    if ($('#tvEnhancementStyles')) return;
    const link = document.createElement('link');
    link.id = 'tvEnhancementStyles';
    link.rel = 'stylesheet';
    link.href = 'enhancements.css';
    document.head.appendChild(link);
  }

  function installPublicBranding(){
    document.title = 'Território Vivo — Atenção Primária de Pimenta Bueno';
    const eyebrow = $('.auth-brand .eyebrow');
    if (eyebrow) eyebrow.textContent = 'Atenção Primária • Pimenta Bueno — RO';
    const intro = $('.auth-intro');
    if (intro) intro.textContent = 'Uma área de trabalho compartilhada para ACS e equipes organizarem o território, gerarem materiais e apoiarem o cuidado na Atenção Primária.';
    const sidebarContext = $('.sidebar-brand span');
    if (sidebarContext) sidebarContext.textContent = 'Pimenta Bueno • RO';
  }

  async function loadUnits(force=false){
    if (unitCache.length && !force) return unitCache;
    const { data, error } = await client
      .from('health_units')
      .select('cnes,name,short_name,unit_type,address,neighborhood,phone,hours,municipality,state,source_url,source_label,source_checked_on,is_active,display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (!error) unitCache = data || [];
    return unitCache;
  }

  function unitOptions(selected='', includeEmpty=true){
    const empty = includeEmpty ? '<option value="">Selecione</option>' : '';
    return empty + unitCache.map((unit) => {
      const suffix = unit.neighborhood ? ` — ${unit.neighborhood}` : '';
      return `<option value="${esc(unit.cnes)}" ${unit.cnes===selected?'selected':''}>${esc(unit.short_name)}${esc(suffix)}</option>`;
    }).join('');
  }

  function installAuthExtras(){
    const authCard = $('.auth-card');
    const loginForm = $('#loginForm');
    if (!authCard || !loginForm) return;

    const demoButton = $('#demoAccess');
    if (demoButton && new URLSearchParams(location.search).get('demo') !== '1') demoButton.hidden = true;

    if (!$('#forgotPassword')) {
      const wrap = document.createElement('div');
      wrap.className = 'auth-secondary-actions';
      wrap.innerHTML = '<button id="forgotPassword" class="auth-link-button" type="button">Esqueci minha senha</button>';
      const signup = $('#showSignup');
      (signup || loginForm).insertAdjacentElement('afterend', wrap);
      $('#forgotPassword').addEventListener('click', sendPasswordReset);
    }

    if (!$('#passwordRecoveryDialog')) {
      const dialog = document.createElement('dialog');
      dialog.id = 'passwordRecoveryDialog';
      dialog.className = 'tv-dialog';
      dialog.innerHTML = `
        <div class="tv-dialog-body">
          <div class="tv-dialog-head"><div><span class="section-tag">Segurança</span><h3>Definir nova senha</h3></div><button class="tv-dialog-close" type="button" aria-label="Fechar">×</button></div>
          <form id="passwordRecoveryForm" class="stack">
            <label>Nova senha<input id="newPassword" type="password" minlength="8" autocomplete="new-password" required /></label>
            <label>Repita a nova senha<input id="newPassword2" type="password" minlength="8" autocomplete="new-password" required /></label>
            <button class="button primary wide" type="submit">Salvar nova senha</button>
            <p id="passwordRecoveryStatus" class="form-status" aria-live="polite"></p>
          </form>
        </div>`;
      document.body.appendChild(dialog);
      $('.tv-dialog-close', dialog).addEventListener('click', () => dialog.close());
      $('#passwordRecoveryForm', dialog).addEventListener('submit', updateRecoveredPassword);
    }
  }

  async function sendPasswordReset(){
    const email = ($('#loginEmail')?.value || '').trim().toLowerCase();
    const status = $('#authStatus');
    if (!email) {
      if (status) status.textContent = 'Digite seu e-mail no campo acima para receber o link de redefinição.';
      $('#loginEmail')?.focus();
      return;
    }
    if (status) status.textContent = 'Enviando link de redefinição…';
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: returnUrl() });
    if (status) status.textContent = error ? 'Não foi possível enviar o link agora.' : 'Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.';
  }

  async function updateRecoveredPassword(event){
    event.preventDefault();
    const password = $('#newPassword').value;
    const password2 = $('#newPassword2').value;
    const status = $('#passwordRecoveryStatus');
    if (password !== password2) {
      status.textContent = 'As senhas não são iguais.';
      return;
    }
    status.textContent = 'Salvando…';
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      status.textContent = 'Não foi possível atualizar a senha.';
      return;
    }
    status.textContent = 'Senha atualizada. Você já pode continuar usando o sistema.';
    setTimeout(() => $('#passwordRecoveryDialog')?.close(), 900);
  }

  function installUnitDirectory(){
    const nav = $('.nav-list');
    const main = $('.main-shell');
    if (!nav || !main) return;

    if (!$('#unitsNav')) {
      const button = document.createElement('button');
      button.id = 'unitsNav';
      button.className = 'nav-item';
      button.type = 'button';
      button.innerHTML = '<span>⌖</span>Unidades de saúde';
      const profileNav = $('[data-section="profile"]', nav);
      if (profileNav) nav.insertBefore(button, profileNav); else nav.appendChild(button);
      button.addEventListener('click', showUnitsSection);
    }

    if (!$('#units')) {
      const section = document.createElement('section');
      section.id = 'units';
      section.className = 'app-section units-section';
      section.innerHTML = `
        <div class="section-intro">
          <div><span class="section-tag">Rede local</span><h2>Unidades de saúde de Pimenta Bueno</h2><p>Referências públicas para ajudar a identificar corretamente a unidade no cadastro. Telefones, horários e lotações podem mudar; confirme quando necessário.</p></div>
          <button id="unitsRefresh" type="button" class="button soft">Atualizar lista</button>
        </div>
        <div class="public-data-note"><strong>Fonte institucional:</strong> Cadastro Nacional de Estabelecimentos de Saúde (CNES) e documentos públicos municipais. O Território Vivo não realiza agendamentos e não substitui os canais oficiais da Secretaria Municipal de Saúde.</div>
        <div id="unitsGrid" class="units-grid"><div class="admin-empty">Carregando unidades…</div></div>`;
      main.appendChild(section);
      $('#unitsRefresh').addEventListener('click', () => renderUnitDirectory(true));
    }
  }

  function showUnitsSection(){
    $$('.app-section').forEach((el) => el.classList.toggle('active-section', el.id === 'units'));
    $$('.nav-item').forEach((el) => el.classList.toggle('active', el.id === 'unitsNav'));
    if ($('#pageTitle')) $('#pageTitle').textContent = 'Rede de Atenção Primária';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderUnitDirectory();
  }

  async function renderUnitDirectory(force=false){
    const grid = $('#unitsGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="admin-empty">Carregando unidades…</div>';
    await loadUnits(force);
    if (!unitCache.length) {
      grid.innerHTML = '<div class="admin-empty">Não foi possível carregar o catálogo de unidades agora.</div>';
      return;
    }
    grid.innerHTML = unitCache.map((unit) => {
      const location = [unit.address, unit.neighborhood].filter(Boolean).join(' • ');
      const typeLabel = unit.unit_type === 'ubs' ? 'UBS' : unit.unit_type === 'rural' ? 'Zona rural' : 'Distrito / ponto de atendimento';
      const checked = unit.source_checked_on ? new Date(`${unit.source_checked_on}T12:00:00`).toLocaleDateString('pt-BR') : '';
      return `<article class="unit-card">
        <div class="unit-card-top"><span class="unit-type">${esc(typeLabel)}</span><span class="unit-cnes">CNES ${esc(unit.cnes)}</span></div>
        <h3>${esc(unit.short_name)}</h3>
        <div class="unit-facts">
          <div><small>Localização</small><strong>${esc(location || 'Consultar cadastro público')}</strong></div>
          <div><small>Telefone</small><strong>${esc(unit.phone || 'Confirmar com a unidade')}</strong></div>
          <div><small>Horário cadastrado</small><strong>${esc(unit.hours || 'Confirmar com a unidade')}</strong></div>
        </div>
        <div class="unit-source"><span>${esc(unit.source_label || 'CNES')}</span>${checked ? `<span>verificado em ${esc(checked)}</span>` : ''}</div>
        ${unit.source_url ? `<a class="unit-source-link" href="${esc(unit.source_url)}" target="_blank" rel="noopener noreferrer">Consultar fonte pública ↗</a>` : ''}
      </article>`;
    }).join('');
  }

  function ensureFreeMicroareaInput(){
    const old = $('#profileMicroarea');
    if (!old || old.tagName === 'INPUT') return;
    const input = document.createElement('input');
    input.id = 'profileMicroarea';
    input.type = 'text';
    input.maxLength = 40;
    input.placeholder = 'Ex.: 08';
    input.value = old.value || '';
    old.replaceWith(input);
  }

  function installProfileUnitSelector(){
    ensureFreeMicroareaInput();
    const original = $('#profileUnit');
    const form = $('#profileForm');
    if (!original || !form) return;

    if (!$('#profileUnitCnes')) {
      const originalLabel = original.closest('label');
      const label = document.createElement('label');
      label.innerHTML = 'Unidade de saúde<select id="profileUnitCnes"><option value="">Selecione</option></select>';
      originalLabel?.insertAdjacentElement('beforebegin', label);
      original.readOnly = true;
      original.placeholder = 'Preenchido a partir da unidade selecionada';

      $('#profileUnitCnes').addEventListener('change', () => {
        const unit = unitCache.find((item) => item.cnes === $('#profileUnitCnes').value);
        original.value = unit?.name || '';
        if (unit) {
          if ($('#profileUnitPhone')) $('#profileUnitPhone').value = unit.phone || '';
          if ($('#profileAddress')) $('#profileAddress').value = [unit.address, unit.neighborhood].filter(Boolean).join(' — ');
          if ($('#profileHours')) $('#profileHours').value = unit.hours || '';
        }
      });
    }

    const selector = $('#profileUnitCnes');
    if (selector) selector.innerHTML = unitOptions(selector.value || currentProfile?.unit_cnes || '', true);

    if (!form.dataset.unitCnesHook) {
      form.dataset.unitCnesHook = '1';
      form.addEventListener('submit', () => {
        setTimeout(async () => {
          const { data: { session } } = await client.auth.getSession();
          if (!session) return;
          const unitCnes = $('#profileUnitCnes')?.value || null;
          const unit = unitCache.find((item) => item.cnes === unitCnes);
          await client.from('profiles').update({
            unit_cnes: unitCnes,
            unit_name: unit?.name || $('#profileUnit')?.value || ''
          }).eq('id', session.user.id);
          setTimeout(refreshAccess, 120);
        }, 0);
      });
    }
  }

  function syncProfileContext(profile){
    currentProfile = profile || currentProfile;
    ensureFreeMicroareaInput();
    installProfileUnitSelector();

    if (!profile) return;
    if ($('#profileMicroarea')) $('#profileMicroarea').value = profile.microarea || '';
    if ($('#profileUnitCnes')) {
      $('#profileUnitCnes').innerHTML = unitOptions(profile.unit_cnes || '', true);
      $('#profileUnitCnes').value = profile.unit_cnes || '';
    }
    if ($('#profileUnit')) $('#profileUnit').value = profile.unit_name || '';
    if ($('#profileTeam')) $('#profileTeam').value = profile.team_name || '';

    const unit = unitCache.find((item) => item.cnes === profile.unit_cnes);
    const sidebarContext = $('.sidebar-brand span');
    if (sidebarContext) {
      sidebarContext.textContent = profile.team_name || unit?.short_name || profile.unit_name || 'Pimenta Bueno • RO';
    }
  }

  function installAdminShell(){
    const nav = $('.nav-list');
    const main = $('.main-shell');
    if (!nav || !main) return;

    if (!$('#adminNav')) {
      const button = document.createElement('button');
      button.id = 'adminNav';
      button.className = 'nav-item';
      button.hidden = true;
      button.innerHTML = '<span>⚙</span>Gestão da rede';
      button.type = 'button';
      nav.appendChild(button);
      button.addEventListener('click', showAdminSection);
    }

    if (!$('#admin')) {
      const section = document.createElement('section');
      section.id = 'admin';
      section.className = 'app-section admin-section';
      section.innerHTML = `
        <div class="admin-hero">
          <div><span class="section-tag">Conta master</span><h2>Gestão da rede no Território Vivo</h2><p>Veja quem criou conta e a qual unidade, equipe e microárea cada perfil profissional está vinculado.</p></div>
          <button id="adminRefresh" class="button soft" type="button">Atualizar lista</button>
        </div>
        <div class="admin-note"><strong>Privacidade:</strong> este painel mostra somente perfis profissionais de acesso. Dados temporários digitados nas carteirinhas não são armazenados aqui.</div>
        <div id="adminKpis" class="admin-kpis"></div>
        <article class="panel">
          <div class="admin-toolbar"><div><h3>Perfis cadastrados</h3><p class="muted">A função MASTER é protegida pelo banco e não pode ser concedida pela tela.</p></div><input id="adminSearch" type="search" placeholder="Buscar nome, UBS, equipe ou microárea" /></div>
          <div id="adminProfiles" class="admin-table-wrap"><div class="admin-empty">Carregando perfis…</div></div>
          <p id="adminStatus" class="admin-status" aria-live="polite"></p>
        </article>`;
      main.appendChild(section);
      $('#adminRefresh').addEventListener('click', loadAdminProfiles);
      $('#adminSearch').addEventListener('input', filterAdminRows);
      $('#adminProfiles').addEventListener('click', handleAdminTableClick);
    }
  }

  function showAdminSection(){
    $$('.app-section').forEach((el) => el.classList.toggle('active-section', el.id === 'admin'));
    $$('.nav-item').forEach((el) => el.classList.toggle('active', el.id === 'adminNav'));
    if ($('#pageTitle')) $('#pageTitle').textContent = 'Gestão da rede';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadAdminProfiles();
  }

  async function refreshAccess(){
    await loadUnits();
    installProfileUnitSelector();
    const { data: { session } } = await client.auth.getSession();
    const nav = $('#adminNav');
    if (!session) {
      currentProfile = null;
      if (nav) nav.hidden = true;
      return;
    }

    const { data: profile } = await client
      .from('profiles')
      .select('id,role,full_name,microarea,unit_cnes,unit_name,team_name,acs_phone,unit_phone,unit_address,unit_hours')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profile) return;
    syncProfileContext(profile);
    const isAdmin = profile.role === 'admin';
    if (nav) nav.hidden = !isAdmin;

    const mini = $('.mini-profile');
    let badge = $('#roleBadge');
    if (isAdmin && mini) {
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'roleBadge';
        badge.className = 'role-badge';
        badge.textContent = 'MASTER';
        mini.querySelector('div')?.appendChild(badge);
      }
    } else if (badge) {
      badge.remove();
      if ($('#admin')?.classList.contains('active-section')) document.querySelector('[data-section="dashboard"]')?.click();
    }
  }

  async function loadAdminProfiles(){
    const container = $('#adminProfiles');
    if (!container || $('#adminNav')?.hidden) return;
    await loadUnits();
    container.innerHTML = '<div class="admin-empty">Carregando perfis…</div>';
    const { data, error } = await client
      .from('profiles')
      .select('id,full_name,role,microarea,acs_phone,unit_cnes,unit_name,team_name,updated_at')
      .order('role', { ascending: false })
      .order('full_name', { ascending: true });
    if (error) {
      container.innerHTML = '<div class="admin-empty">Não foi possível carregar os perfis.</div>';
      return;
    }

    const profiles = data || [];
    renderAdminKpis(profiles);
    if (!profiles.length) {
      container.innerHTML = '<div class="admin-empty">Ainda não há perfis cadastrados.</div>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table admin-table-wide">
        <thead><tr><th>Profissional</th><th>Unidade</th><th>Equipe</th><th>Microárea</th><th>Contato</th><th>Função</th><th></th></tr></thead>
        <tbody>${profiles.map((p) => {
          const unit = unitCache.find((item) => item.cnes === p.unit_cnes);
          const search = `${p.full_name || ''} ${p.unit_name || unit?.short_name || ''} ${p.team_name || ''} ${p.microarea || ''}`.toLowerCase();
          return `<tr data-admin-row data-id="${esc(p.id)}" data-search="${esc(search)}">
            <td><input data-field="full_name" value="${esc(p.full_name || '')}" aria-label="Nome profissional" /></td>
            <td><select data-field="unit_cnes" aria-label="Unidade de saúde">${unitOptions(p.unit_cnes || '', true)}</select></td>
            <td><input data-field="team_name" value="${esc(p.team_name || '')}" aria-label="Equipe" placeholder="Equipe / código" /></td>
            <td><input data-field="microarea" value="${esc(p.microarea || '')}" aria-label="Microárea" placeholder="Microárea" /></td>
            <td><input data-field="acs_phone" value="${esc(p.acs_phone || '')}" aria-label="Contato" /></td>
            <td><span class="admin-role ${p.role==='admin'?'master':''}">${p.role==='admin'?'MASTER':'ACS'}</span></td>
            <td><button class="button soft" type="button" data-admin-save>Salvar</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
    filterAdminRows();
  }

  function renderAdminKpis(profiles){
    const acs = profiles.filter((p) => p.role === 'acs');
    const units = new Set(acs.map((p) => p.unit_cnes).filter(Boolean));
    const masters = profiles.filter((p) => p.role === 'admin').length;
    $('#adminKpis').innerHTML = [
      ['Perfis', profiles.length],
      ['ACS', acs.length],
      ['Unidades com usuários', units.size],
      ['Conta master', masters]
    ].map(([label,value]) => `<div class="admin-kpi"><small>${label}</small><strong>${value}</strong></div>`).join('');
  }

  function filterAdminRows(){
    const query = ($('#adminSearch')?.value || '').trim().toLowerCase();
    $$('[data-admin-row]').forEach((row) => { row.hidden = Boolean(query && !(row.dataset.search || '').includes(query)); });
  }

  async function handleAdminTableClick(event){
    const button = event.target.closest('[data-admin-save]');
    if (!button) return;
    const row = button.closest('[data-admin-row]');
    const id = row?.dataset.id;
    if (!id) return;

    const payload = {};
    $$('[data-field]', row).forEach((input) => { payload[input.dataset.field] = input.value.trim(); });
    payload.microarea = payload.microarea || null;
    payload.unit_cnes = payload.unit_cnes || null;
    const unit = unitCache.find((item) => item.cnes === payload.unit_cnes);
    payload.unit_name = unit?.name || '';

    const status = $('#adminStatus');
    status.textContent = 'Salvando perfil…';
    button.disabled = true;
    const { error } = await client.from('profiles').update(payload).eq('id', id);
    button.disabled = false;
    status.textContent = error ? 'Não foi possível salvar esse perfil.' : 'Perfil atualizado.';
    if (!error) {
      setTimeout(() => { if (status.textContent === 'Perfil atualizado.') status.textContent = ''; }, 1800);
      loadAdminProfiles();
    }
  }

  function installEducationTools(){
    const detail = $('#educationDetail');
    if (!detail) return;
    const decorate = () => {
      if (detail.hidden || !detail.innerHTML.trim()) return;
      $$('.actions', detail).forEach((actions) => {
        const old = $('button[onclick*="window.print"]', actions);
        if (old) old.remove();
      });
      if ($('.education-tools', detail)) return;
      const tools = document.createElement('div');
      tools.className = 'education-tools';
      tools.innerHTML = '<button class="button primary" type="button" data-edu-print>Imprimir material</button><button class="button soft" type="button" data-edu-pdf>Baixar PDF</button>';
      detail.appendChild(tools);
      $('[data-edu-print]', tools).addEventListener('click', () => printEducation(detail));
      $('[data-edu-pdf]', tools).addEventListener('click', () => downloadEducation(detail));
    };
    new MutationObserver(decorate).observe(detail, { childList: true, subtree: false, attributes: true, attributeFilter: ['hidden'] });
    detail.addEventListener('click', (event) => {
      const old = event.target.closest('button[onclick*="window.print"]');
      if (old) {
        event.preventDefault();
        event.stopImmediatePropagation();
        printEducation(detail);
      }
    }, true);
    decorate();
  }

  function educationClone(detail){
    const clone = detail.cloneNode(true);
    clone.hidden = false;
    clone.removeAttribute('id');
    $$('.actions,.education-tools', clone).forEach((el) => el.remove());
    const sheet = document.createElement('article');
    sheet.className = 'education-print-sheet';
    const context = [currentProfile?.unit_name, currentProfile?.team_name].filter(Boolean).join(' • ');
    sheet.innerHTML = `<div style="border-bottom:2px solid #111;padding-bottom:6mm;margin-bottom:6mm"><strong>Território Vivo • Atenção Primária • Pimenta Bueno/RO${context ? ` • ${esc(context)}` : ''}</strong></div>`;
    sheet.appendChild(clone);
    return sheet;
  }

  function printEducation(detail){
    const root = $('#printRoot');
    if (!root) return;
    root.innerHTML = '';
    root.appendChild(educationClone(detail));
    window.print();
    setTimeout(() => { root.innerHTML = ''; }, 500);
  }

  function downloadEducation(detail){
    if (!window.html2pdf) return printEducation(detail);
    const sheet = educationClone(detail);
    sheet.style.position = 'fixed';
    sheet.style.left = '-200vw';
    sheet.style.top = '0';
    document.body.appendChild(sheet);
    const title = detail.querySelector('h3')?.textContent || 'educacao-em-saude';
    const filename = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '.pdf';
    const worker = window.html2pdf().set({ margin: 8, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(sheet).save();
    Promise.resolve(worker).finally(() => sheet.remove());
  }

  async function init(){
    loadStyles();
    installPublicBranding();
    installAuthExtras();
    installUnitDirectory();
    installAdminShell();
    installEducationTools();
    await loadUnits();
    installProfileUnitSelector();
    setTimeout(refreshAccess, 350);
    client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setTimeout(() => $('#passwordRecoveryDialog')?.showModal(), 0);
      setTimeout(refreshAccess, 120);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
