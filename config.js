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
      <label>Microárea
        <select id="signupMicroarea">
          <option value="">Não se aplica / conta master</option>
          <option value="08">08</option>
          <option value="09">09</option>
          <option value="10">10</option>
        </select>
      </label>
      <label>Senha<input id="signupPassword" type="password" autocomplete="new-password" minlength="8" required /></label>
      <label>Repita a senha<input id="signupPassword2" type="password" autocomplete="new-password" minlength="8" required /></label>
      <button class="button primary wide" type="submit">Criar conta</button>
      <button id="cancelSignup" class="button soft wide" type="button">Voltar para o login</button>
      <p id="signupStatus" class="form-status" aria-live="polite"></p>
    </form>`;
  button.insertAdjacentElement('afterend', panel);

  const registrationClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
  const showLogin = () => { panel.hidden = true; loginForm.hidden = false; button.hidden = false; };
  const showSignup = () => { panel.hidden = false; loginForm.hidden = true; button.hidden = true; };

  button.addEventListener('click', showSignup);
  panel.querySelector('#cancelSignup').addEventListener('click', showLogin);

  panel.querySelector('#signupForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = panel.querySelector('#signupStatus');
    const name = panel.querySelector('#signupName').value.trim();
    const email = panel.querySelector('#signupEmail').value.trim().toLowerCase();
    const microarea = panel.querySelector('#signupMicroarea').value;
    const password = panel.querySelector('#signupPassword').value;
    const password2 = panel.querySelector('#signupPassword2').value;

    if (email !== MASTER_EMAIL && !microarea) {
      status.textContent = 'Selecione sua microárea: 08, 09 ou 10.';
      return;
    }

    if (password !== password2) {
      status.textContent = 'As senhas não são iguais.';
      return;
    }

    status.textContent = 'Criando sua conta…';
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    const { data, error } = await registrationClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, microarea },
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      status.textContent = 'Não foi possível criar a conta. Verifique os dados e tente novamente.';
      return;
    }

    if (data?.session) {
      status.textContent = 'Conta criada. Entrando…';
      setTimeout(() => window.location.reload(), 500);
    } else {
      status.textContent = 'Conta criada. Confira seu e-mail para confirmar o cadastro e depois faça login.';
    }
  });
})();

(function loadTerritorioVivoEnhancements(){
  if (document.querySelector('script[data-tv-enhancements]')) return;
  const script = document.createElement('script');
  script.src = 'enhancements.js';
  script.async = false;
  script.dataset.tvEnhancements = 'true';
  document.head.appendChild(script);
})();
