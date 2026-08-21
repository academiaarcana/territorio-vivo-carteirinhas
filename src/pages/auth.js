import { escapeHtml, formToObject, setStatus } from '../lib/dom.js';
import { navigate } from '../core/router.js';
import { signIn, signUp, signOut, sendPasswordReset, updatePassword } from '../services/auth.js';
import { listMunicipalities, listUnits, listTeams } from '../services/repository.js';
import { appConfig } from '../services/supabase.js';

const PASSWORD_MIN_LENGTH = 10;

function authFrame(title, intro, body) {
  return `<main class="auth-page"><section class="auth-panel"><a href="#/" class="brand"><span class="brand-mark" aria-hidden="true">TV</span><span><strong>Território Vivo</strong><small>Atenção Primária</small></span></a><header><h1>${escapeHtml(title)}</h1><p>${escapeHtml(intro)}</p></header>${body}<button type="button" class="link-button" data-home>← Voltar para a apresentação</button></section></main>`;
}

export function renderLoginPage() {
  return authFrame('Entrar', 'Use o e-mail e a senha da sua conta profissional.', `
    <form id="login-form" class="stack-form">
      <label>E-mail<input name="email" type="email" autocomplete="username" required></label>
      <label>Senha<input name="password" type="password" autocomplete="current-password" required></label>
      <button class="button primary" type="submit" data-default-label="Entrar">Entrar</button>
      <p id="auth-status" class="form-status" aria-live="polite"></p>
    </form>
    <div class="auth-links"><button type="button" class="link-button" data-signup>Criar conta</button><button type="button" class="link-button" data-forgot>Esqueci minha senha</button></div>`);
}

export function mountLoginPage({ root }) {
  bindCommon(root);
  root.querySelector('[data-signup]')?.addEventListener('click', () => navigate('/criar-conta'));
  const status = root.querySelector('#auth-status');
  const forgot = root.querySelector('[data-forgot]');

  forgot?.addEventListener('click', async () => {
    if (forgot.disabled) return;
    const email = root.querySelector('[name="email"]').value.trim();
    if (!email) return setStatus(status, 'Digite seu e-mail primeiro.', 'error');
    forgot.disabled = true;
    setStatus(status, 'Enviando link…', 'info');
    try {
      await sendPasswordReset(email);
      setStatus(status, 'Se o e-mail estiver cadastrado, você receberá um link para criar nova senha.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(status, authErrorMessage(error, 'reset'), 'error');
    } finally {
      forgot.disabled = false;
    }
  });

  root.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    if (button.disabled || !form.reportValidity()) return;
    const { email, password } = formToObject(form);
    setBusy(button, true, 'Entrando…');
    setStatus(status, 'Validando sua conta…', 'info');
    try {
      await signIn(email, password);
      await navigate('/app/inicio', { replace: true });
    } catch (error) {
      console.error(error);
      setStatus(status, authErrorMessage(error, 'login'), 'error');
    } finally {
      setBusy(button, false);
    }
  });
}

export function renderSignupPage() {
  return authFrame('Criar conta profissional', 'Crie sua conta e informe seu vínculo de trabalho. Após confirmar o e-mail, a gestão valida o vínculo antes de liberar as áreas internas.', `
    <form id="signup-form" class="stack-form">
      <label>Nome completo<input name="fullName" autocomplete="name" required maxlength="160"></label>
      <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
      <label>Município<select name="municipalityCode" id="signup-municipality" required><option value="">Carregando…</option></select></label>
      <label>Unidade de saúde<select name="unitCnes" id="signup-unit" required><option value="">Selecione o município</option></select></label>
      <label>Equipe<select name="teamId" id="signup-team"><option value="">Selecione a unidade</option></select></label>
      <label id="custom-team-wrap" hidden>Nome da equipe para confirmação<input name="teamName" maxlength="120" placeholder="Ex.: Equipe 03 ou eSF Rural"></label>
      <label>Microárea<input name="microarea" id="signup-microarea" maxlength="40" placeholder="Ex.: 08" required></label>
      <p id="master-hint" class="field-hint">Município, unidade e microárea são obrigatórios para contas profissionais comuns.</p>
      <label>Senha<input name="password" type="password" minlength="${PASSWORD_MIN_LENGTH}" autocomplete="new-password" aria-describedby="password-help" required></label>
      <p id="password-help" class="field-hint">Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres, com letras e números. Evite reutilizar senha de outros serviços.</p>
      <label>Repita a senha<input name="password2" type="password" minlength="${PASSWORD_MIN_LENGTH}" autocomplete="new-password" required></label>
      <button class="button primary" type="submit" data-default-label="Criar conta">Criar conta</button>
      <p id="auth-status" class="form-status" aria-live="polite"></p>
    </form>
    <div class="auth-links"><button type="button" class="link-button" data-login>Já tenho conta</button></div>`);
}

export async function mountSignupPage({ root }) {
  bindCommon(root);
  root.querySelector('[data-login]')?.addEventListener('click', () => navigate('/entrar'));
  const form = root.querySelector('#signup-form');
  const status = root.querySelector('#auth-status');
  const municipality = root.querySelector('#signup-municipality');
  const unit = root.querySelector('#signup-unit');
  const team = root.querySelector('#signup-team');
  const customWrap = root.querySelector('#custom-team-wrap');
  const email = root.querySelector('[name="email"]');
  const microarea = root.querySelector('#signup-microarea');
  const hint = root.querySelector('#master-hint');

  async function loadMunicipalities() {
    const rows = await listMunicipalities();
    municipality.innerHTML = '<option value="">Selecione</option>' + rows.map((row) => `<option value="${escapeHtml(row.code)}">${escapeHtml(row.name)} — ${escapeHtml(row.state_code)}</option>`).join('');
    if (rows.some((row) => row.code === '110018')) municipality.value = '110018';
    await loadUnits();
  }

  async function loadUnits() {
    const rows = municipality.value ? await listUnits({ municipalityCode: municipality.value }) : [];
    unit.innerHTML = '<option value="">Selecione</option>' + rows.map((row) => `<option value="${escapeHtml(row.cnes)}">${escapeHtml(row.short_name)}${row.neighborhood ? ` — ${escapeHtml(row.neighborhood)}` : ''}</option>`).join('');
    team.innerHTML = '<option value="">Selecione a unidade</option>';
    customWrap.hidden = true;
    customWrap.querySelector('input').value = '';
  }

  async function loadTeams() {
    if (!unit.value) {
      team.innerHTML = '<option value="">Selecione a unidade</option>';
      return;
    }
    const rows = await listTeams({ unitCnes: unit.value });
    team.innerHTML = '<option value="">Equipe ainda não informada</option>' + rows.map((row) => `<option value="${escapeHtml(row.id)}" data-name="${escapeHtml(row.name)}">${escapeHtml(row.name)}${row.ine ? ` • INE ${escapeHtml(row.ine)}` : ''}</option>`).join('') + '<option value="__other__">Minha equipe não aparece</option>';
  }

  function syncCustomTeam() {
    customWrap.hidden = team.value !== '__other__';
    if (!customWrap.hidden) customWrap.querySelector('input').focus();
  }

  function syncMaster() {
    const master = email.value.trim().toLowerCase() === appConfig.masterEmail.toLowerCase();
    municipality.required = !master;
    unit.required = !master;
    microarea.required = !master;
    hint.textContent = master ? 'Conta master: município, unidade, equipe e microárea são opcionais.' : 'Após o cadastro, a gestão da UBS confirmará este vínculo antes de liberar o ambiente interno.';
  }

  municipality.addEventListener('change', () => loadUnits().catch(() => setStatus(status, 'Não foi possível carregar as unidades.', 'error')));
  unit.addEventListener('change', () => loadTeams().catch(() => setStatus(status, 'Não foi possível carregar as equipes.', 'error')));
  team.addEventListener('change', syncCustomTeam);
  email.addEventListener('input', syncMaster);

  try { await loadMunicipalities(); }
  catch (error) {
    console.error(error);
    municipality.innerHTML = '<option value="">Catálogo indisponível</option>';
    setStatus(status, 'Não foi possível carregar o catálogo territorial. Tente novamente mais tarde.', 'error');
  }
  syncMaster();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    if (button.disabled || !form.reportValidity()) return;
    const values = formToObject(form);
    const master = values.email.trim().toLowerCase() === appConfig.masterEmail.toLowerCase();
    const passwordError = validatePassword(values.password);
    if (passwordError) return setStatus(status, passwordError, 'error');
    if (values.password !== values.password2) return setStatus(status, 'As senhas não são iguais.', 'error');
    if (!master && (!values.municipalityCode || !values.unitCnes || !values.microarea.trim())) return setStatus(status, 'Preencha município, unidade e microárea.', 'error');

    let teamName = '';
    let teamId = values.teamId || null;
    if (values.teamId === '__other__') {
      teamId = null;
      teamName = values.teamName.trim();
      if (!teamName) return setStatus(status, 'Informe o nome da equipe para confirmação.', 'error');
    } else if (values.teamId) {
      teamName = team.selectedOptions[0]?.dataset.name || '';
    }

    setBusy(button, true, 'Criando conta…');
    setStatus(status, 'Criando sua conta profissional…', 'info');
    try {
      const data = await signUp({ ...values, teamId, teamName });
      if (data.session) {
        setStatus(status, master ? 'Conta master criada. Entrando…' : 'Conta criada. Seu vínculo agora aguarda aprovação da gestão.', 'success');
        setTimeout(() => navigate('/app/inicio', { replace: true }), 250);
      } else {
        setStatus(status, master
          ? 'Conta criada. Confira seu e-mail para confirmar o cadastro.'
          : 'Conta criada. Confirme seu e-mail; depois o vínculo profissional ficará aguardando aprovação da gestão.', 'success');
      }
    } catch (error) {
      console.error(error);
      setStatus(status, authErrorMessage(error, 'signup'), 'error');
    } finally {
      setBusy(button, false);
    }
  });
}

export function renderRecoveryPage() {
  return authFrame('Definir nova senha', 'Escolha uma nova senha para sua conta profissional.', `
    <form id="recovery-form" class="stack-form">
      <label>Nova senha<input name="password" type="password" minlength="${PASSWORD_MIN_LENGTH}" autocomplete="new-password" required></label>
      <label>Repita a senha<input name="password2" type="password" minlength="${PASSWORD_MIN_LENGTH}" autocomplete="new-password" required></label>
      <p class="field-hint">Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.</p>
      <button class="button primary" type="submit" data-default-label="Salvar nova senha">Salvar nova senha</button>
      <p id="auth-status" class="form-status" aria-live="polite"></p>
    </form>`);
}

export function mountRecoveryPage({ root }) {
  bindCommon(root);
  const form = root.querySelector('#recovery-form');
  const status = root.querySelector('#auth-status');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    if (button.disabled || !form.reportValidity()) return;
    const { password, password2 } = formToObject(form);
    const passwordError = validatePassword(password);
    if (passwordError) return setStatus(status, passwordError, 'error');
    if (password !== password2) return setStatus(status, 'As senhas não são iguais.', 'error');

    setBusy(button, true, 'Salvando…');
    try {
      await updatePassword(password);
      await signOut();
      setStatus(status, 'Senha atualizada com segurança. Entre novamente com a nova senha.', 'success');
      setTimeout(() => navigate('/entrar', { replace: true }), 500);
    } catch (error) {
      console.error(error);
      setStatus(status, authErrorMessage(error, 'password'), 'error');
    } finally {
      setBusy(button, false);
    }
  });
}

function validatePassword(password) {
  if (String(password || '').length < PASSWORD_MIN_LENGTH) return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return 'Use uma senha com letras e pelo menos um número.';
  return '';
}

function setBusy(button, busy, label = '') {
  if (!button) return;
  if (busy) {
    button.dataset.previousLabel = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (label) button.textContent = label;
    return;
  }
  button.disabled = false;
  button.removeAttribute('aria-busy');
  button.textContent = button.dataset.previousLabel || button.dataset.defaultLabel || button.textContent;
  delete button.dataset.previousLabel;
}

function authErrorMessage(error, context) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  if (code.includes('email_not_confirmed') || message.includes('email not confirmed')) return 'Seu e-mail ainda não foi confirmado. Abra a mensagem enviada pelo Território Vivo e tente novamente.';
  if (code.includes('invalid_credentials') || message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (code.includes('user_already_exists') || message.includes('already registered')) return 'Este e-mail já possui uma conta. Use “Já tenho conta” ou recupere a senha.';
  if (code.includes('weak_password') || message.includes('weak password')) return `Escolha uma senha mais forte, com pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (code.includes('over_request_rate_limit') || code.includes('rate_limit') || message.includes('rate limit')) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  if (context === 'reset') return 'Não foi possível enviar o link agora. Aguarde um pouco e tente novamente.';
  if (context === 'password') return 'Não foi possível atualizar a senha. Abra novamente o link de recuperação recebido por e-mail.';
  if (context === 'signup') return 'Não foi possível criar a conta. Revise os dados e tente novamente.';
  return 'Não foi possível entrar agora. Confira seus dados e tente novamente.';
}

function bindCommon(root) {
  root.querySelector('[data-home]')?.addEventListener('click', () => navigate('/'));
}
