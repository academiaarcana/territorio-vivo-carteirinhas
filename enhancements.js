(function territorioVivoEnhancements(){
  const cfg = window.TERRITORIO_VIVO_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabasePublishableKey || !window.supabase) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const returnUrl = () => `${window.location.origin}${window.location.pathname}`;

  function loadStyles(){
    if ($('#tvEnhancementStyles')) return;
    const link = document.createElement('link');
    link.id = 'tvEnhancementStyles';
    link.rel = 'stylesheet';
    link.href = 'enhancements.css';
    document.head.appendChild(link);
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

  function installAdminShell(){
    const nav = $('.nav-list');
    const main = $('.main-shell');
    if (!nav || !main) return;

    if (!$('#adminNav')) {
      const button = document.createElement('button');
      button.id = 'adminNav';
      button.className = 'nav-item';
      button.hidden = true;
      button.innerHTML = '<span>⚙</span>Gestão da equipe';
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
          <div><span class="section-tag">Conta master</span><h2>Gestão da equipe</h2><p>Veja quem já criou conta e mantenha apenas os dados profissionais necessários para o funcionamento das carteirinhas.</p></div>
          <button id="adminRefresh" class="button soft" type="button">Atualizar lista</button>
        </div>
        <div class="admin-note"><strong>Privacidade:</strong> este painel mostra perfis profissionais. Dados temporários digitados nas carteirinhas não são armazenados aqui.</div>
        <div id="adminKpis" class="admin-kpis"></div>
        <article class="panel">
          <div class="admin-toolbar"><div><h3>Perfis cadastrados</h3><p class="muted">A função de administrador é definida somente pelo banco para a conta master.</p></div><input id="adminSearch" type="search" placeholder="Buscar por nome ou microárea" /></div>
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
    if ($('#pageTitle')) $('#pageTitle').textContent = 'Gestão da equipe';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadAdminProfiles();
  }

  async function refreshAccess(){
    const { data: { session } } = await client.auth.getSession();
    const nav = $('#adminNav');
    if (!session) {
      if (nav) nav.hidden = true;
      return;
    }
    const { data: profile } = await client.from('profiles').select('id,role,full_name,microarea').eq('id', session.user.id).maybeSingle();
    const isAdmin = profile?.role === 'admin';
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
      await loadAdminProfiles();
    } else if (badge) {
      badge.remove();
      if ($('#admin')?.classList.contains('active-section')) document.querySelector('[data-section="dashboard"]')?.click();
    }
  }

  async function loadAdminProfiles(){
    const container = $('#adminProfiles');
    if (!container || $('#adminNav')?.hidden) return;
    container.innerHTML = '<div class="admin-empty">Carregando perfis…</div>';
    const { data, error } = await client.from('profiles').select('id,full_name,role,microarea,acs_phone,unit_name,team_name,updated_at').order('role', { ascending: false }).order('microarea', { ascending: true }).order('full_name', { ascending: true });
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
      <table class="admin-table">
        <thead><tr><th>Profissional</th><th>Microárea</th><th>Contato</th><th>Função</th><th></th></tr></thead>
        <tbody>${profiles.map((p) => `
          <tr data-admin-row data-id="${esc(p.id)}" data-search="${esc(`${p.full_name || ''} ${p.microarea || ''}`.toLowerCase())}">
            <td><input data-field="full_name" value="${esc(p.full_name || '')}" aria-label="Nome profissional" /></td>
            <td><select data-field="microarea" aria-label="Microárea"><option value="">—</option>${['08','09','10'].map((m) => `<option value="${m}" ${p.microarea===m?'selected':''}>${m}</option>`).join('')}</select></td>
            <td><input data-field="acs_phone" value="${esc(p.acs_phone || '')}" aria-label="Contato" /></td>
            <td><span class="admin-role ${p.role==='admin'?'master':''}">${p.role==='admin'?'MASTER':'ACS'}</span></td>
            <td><button class="button soft" type="button" data-admin-save>Salvar</button></td>
          </tr>`).join('')}</tbody>
      </table>`;
    filterAdminRows();
  }

  function renderAdminKpis(profiles){
    const byArea = (area) => profiles.filter((p) => p.microarea === area && p.role !== 'admin').length;
    $('#adminKpis').innerHTML = [
      ['Perfis', profiles.length],
      ['Microárea 08', byArea('08')],
      ['Microárea 09', byArea('09')],
      ['Microárea 10', byArea('10')]
    ].map(([label,value]) => `<div class="admin-kpi"><small>${label}</small><strong>${value}</strong></div>`).join('');
  }

  function filterAdminRows(){
    const query = ($('#adminSearch')?.value || '').trim().toLowerCase();
    $$('[data-admin-row]').forEach((row) => { row.hidden = query && !(row.dataset.search || '').includes(query); });
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
    const status = $('#adminStatus');
    status.textContent = 'Salvando perfil…';
    button.disabled = true;
    const { error } = await client.from('profiles').update(payload).eq('id', id);
    button.disabled = false;
    status.textContent = error ? 'Não foi possível salvar esse perfil.' : 'Perfil atualizado.';
    if (!error) setTimeout(() => { if (status.textContent === 'Perfil atualizado.') status.textContent = ''; }, 1800);
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
    sheet.innerHTML = '<div style="border-bottom:2px solid #111;padding-bottom:6mm;margin-bottom:6mm"><strong>Território Vivo • UBS Madre Tereza de Calcutá • Equipe 02</strong></div>';
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
    window.html2pdf().set({ margin: 8, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).from(sheet).save().finally(() => sheet.remove());
  }

  function init(){
    loadStyles();
    installAuthExtras();
    installAdminShell();
    installEducationTools();
    setTimeout(refreshAccess, 450);
    client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setTimeout(() => $('#passwordRecoveryDialog')?.showModal(), 0);
      setTimeout(refreshAccess, 120);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
