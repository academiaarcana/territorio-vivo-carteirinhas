import { escapeHtml, formToObject, setStatus } from '../lib/dom.js';
import { canSubmitForm, setButtonBusy, setSelectError, setSelectLoading, setSelectReady } from '../lib/forms.js';
import { navigate } from '../core/router.js';
import { signIn, signUp, signOut, sendPasswordReset, updatePassword } from '../services/auth.js';
import { listMunicipalities, listUnits, listTeams } from '../services/repository.js';

const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_SYMBOLS = "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";
const PASSWORD_REQUIREMENT = `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres, com letra minúscula, letra maiúscula, número e símbolo.`;

function passwordGuidance(id) {
  return `<aside id="${id}" class="clinical-disclaimer password-guidance" aria-label="Requisitos da senha">
    <strong>Antes de criar a senha</strong>
    <p>A senha precisa ter todos estes requisitos:</p>
    <ul>
      <li>${PASSWORD_MIN_LENGTH} ou mais caracteres;</li>
      <li>uma letra minúscula e uma letra maiúscula;</li>
      <li>um número;</li>
      <li>um símbolo, como !, @, # ou $.</li>
    </ul>
    <small>Esses requisitos protegem sua conta e são necessários para concluir o cadastro.</small>
  </aside>`;
}

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
  const form = root.querySelector('#login-form');
  const status = root.querySelector('#auth-status');
  const forgot = root.querySelector('[data-forgot]');
  const submit = form.querySelector('[type="submit"]');
  let actionInFlight = false;

  function setLoginActionsBusy(actor, busy, label = '') {
    if (busy) form.setAttribute('aria-busy', 'true');
    else form.removeAttribute('aria-busy');
    [submit, forgot].forEach((button) => setButtonBusy(button, busy, button === actor ? label : ''));
  }

  forgot?.addEventListener('click', async () => {
    if (forgot.disabled || actionInFlight) return;
    const email = root.querySelector('[name="email"]').value.trim();
    if (!email) return setStatus(status, 'Digite seu e-mail primeiro.', 'error');
    actionInFlight = true;
    setLoginActionsBusy(forgot, true, 'Enviando…');
    setStatus(status, 'Enviando link…', 'info');
    try {
      await sendPasswordReset(email);
      setStatus(status, 'Se o e-mail estiver cadastrado, você receberá um link para criar nova senha.', 'success');
    } catch (error) {
      console.error(error);
      setStatus(status, authErrorMessage(error, 'reset'), 'error');
    } finally {
      actionInFlight = false;
      setLoginActionsBusy(forgot, false);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (actionInFlight || !canSubmitForm(form, submit)) return;
    const { email, password } = formToObject(form);
    actionInFlight = true;
    setLoginActionsBusy(submit, true, 'Entrando…');
    setStatus(status, 'Validando sua conta…', 'info');
    try {
      await signIn(email, password);
      await navigate('/app/inicio', { replace: true });
    } catch (error) {
      console.error(error);
      setStatus(status, authErrorMessage(error, 'login'), 'error');
    } finally {
      actionInFlight = false;
      setLoginActionsBusy(submit, false);
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
      <p class="field-hint">Toda nova conta profissional entra como ACS pendente. A gestão confirma o vínculo e libera o nível correto; o cadastro não permite escolher papel ou se autoaprovar.</p>
      ${passwordGuidance('signup-password-help')}
      <label>Senha<input name="password" type="password" minlength="${PASSWORD_MIN_LENGTH}" autocomplete="new-password" aria-describedby="signup-password-help" required></label>
      <label>Repita a senha<input name="password2" type="password" minlength="${PASSWORD_MIN_LENGTH}" autocomplete="new-password" aria-describedby="signup-password-help" required></label>
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

  async function loadMunicipalities() {
    setSelectLoading(municipality, 'Carregando municípios…');
    try {
      const rows = await listMunicipalities();
      municipality.innerHTML = '<option value="">Selecione</option>' + rows.map((row) => `<option value="${escapeHtml(row.code)}">${escapeHtml(row.name)} — ${escapeHtml(row.state_code)}</option>`).join('');
      setSelectReady(municipality);
      if (rows.length === 1) municipality.value = rows[0].code;
      await loadUnits();
    } catch (error) {
      setSelectError(municipality, 'Catálogo de municípios indisponível');
      setSelectError(unit, 'Unidades indisponíveis');
      setSelectError(team, 'Equipes indisponíveis');
      throw error;
    }
  }

  async function loadUnits() {
    const municipalityCode = municipality.value;
    setSelectLoading(unit, municipalityCode ? 'Carregando unidades…' : 'Selecione o município');
    setSelectLoading(team, 'Selecione a unidade');
    customWrap.hidden = true;
    customWrap.querySelector('input').value = '';
    if (!municipalityCode) {
      setSelectReady(unit);
      setSelectReady(team);
      return;
    }
    try {
      const rows = await listUnits({ municipalityCode });
      if (municipality.value !== municipalityCode) return;
      unit.innerHTML = '<option value="">Selecione</option>' + rows.map((row) => `<option value="${escapeHtml(row.cnes)}">${escapeHtml(row.short_name)}${row.neighborhood ? ` — ${escapeHtml(row.neighborhood)}` : ''}</option>`).join('');
      setSelectReady(unit);
      team.innerHTML = '<option value="">Selecione a unidade</option>';
      setSelectReady(team);
    } catch (error) {
      if (municipality.value !== municipalityCode) return;
      setSelectError(unit, 'Não foi possível carregar as unidades');
      setSelectError(team, 'Equipes indisponíveis');
      throw error;
    }
  }

  async function loadTeams() {
    const unitCnes = unit.value;
    setSelectLoading(team, unitCnes ? 'Carregando equipes…' : 'Selecione a unidade');
    customWrap.hidden = true;
    customWrap.querySelector('input').value = '';
    if (!unitCnes) {
      setSelectReady(team);
      return;
    }
    try {
      const rows = await listTeams({ unitCnes });
      if (unit.value !== unitCnes) return;
      team.innerHTML = '<option value="">Equipe ainda não informada</option>' + rows.map((row) => `<option value="${escapeHtml(row.id)}" data-name="${escapeHtml(row.name)}">${escapeHtml(row.name)}${row.ine ? ` • INE ${escapeHtml(row.ine)}` : ''}</option>`).join('') + '<option value="__other__">Minha equipe não aparece</option>';
      setSelectReady(team);
    } catch (error) {
      if (unit.value !== unitCnes) return;
      setSelectError(team, 'Não foi possível carregar as equipes');
      throw error;
    }
  }

  function syncCustomTeam() {
    customWrap.hidden = team.value !== '__other__';
    if (!customWrap.hidden) customWrap.querySelector('input').focus();
  }

  municipality.addEventListener('change', () => loadUnits().catch((error) => {
    console.error(error);
    setStatus(status, 'Não foi possível carregar as unidades. Tente selecionar o município novamente.', 'error');
  }));
  unit.addEventListener('change', () => loadTeams().catch((error) => {
    console.error(error);
    setStatus(status, 'Não foi possível carregar as equipes. Tente selecionar a unidade novamente.', 'error');
  }));
  team.addEventListener('change', syncCustomTeam);

  try {
    await loadMunicipalities();
  } catch (error) {
    console.error(error);
    setStatus(status, 'Não foi possível carregar o catálogo territorial. Tente novamente mais tarde.', 'error');
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    if (!canSubmitForm(form, button)) {
      if (form.querySelector('select[required][data-load-state="error"]')) setStatus(status, 'O catálogo territorial não carregou corretamente. Tente novamente antes de criar a conta.', 'error');
      return;
    }
    const values = formToObject(form);
    const passwordError = validatePassword(values.password);
    if (passwordError) return setStatus(status, passwordError, 'error');
    if (values.password !== values.password2) return setStatus(status, 'As senhas não são iguais.', 'error');
    if (!values.municipalityCode || !values.unitCnes || !values.microarea.trim()) return setStatus(status, 'Preencha município, unidade e microárea.', 'error');

    let teamName = '';
    let teamId = values.teamId || null;
    if (values.teamId === '__other__') {
      teamId = null;
      teamName = values.teamName.trim();
      if (!teamName) return setStatus(status, 'Informe o nome da equipe para confirmação.', 'error');
    } else if (values.teamId) {
      teamName = team.selectedOptions[0]?.dataset.name || '';
    }

    setButtonBusy(button, true, 'Criando conta…');
    setStatus(status, 'Criando sua conta profissional…', 'info');
    try {
      const data = await signUp({ ...values, teamId, teamName });
      if (data.session) {
        setStatus(status, 'Conta criada. Seu vínculo agora aguarda aprovação da gestão.', 'success');
        setTimeout(() => navigate('/app/inicio', { replace: true }), 250);
      } else {
        setStatus(status, 'Conta criada. Confirme seu e-mail; depois o vínculo profissional ficará aguardando aprovação da gestão.', 'success');
      }
    } catch (error) {
      console.error(error);
      setStatus(status, authErrorMessage(error, 'signup'), 'error');
    } finally {
      setButtonBusy(button, false);
    }
  });
}

export function renderRecoveryPage() {
  return authFrame('Definir nova senha', 'Escolha uma nova senha para sua conta profissional.', `
    <form id="recovery-form" class="stack-form">
      ${passwordGuidance('recovery-password-help')}
      <label>Nova senha<input name="password" type="password" minlength="${PASSWORD_MIN_LENGTH}" autocomplete="new-password" aria-describedby="recovery-password-help" required></label>
      <label>Repita a senha<input name="password2" type="password" minlength="${PASSWORD_MIN_LENGTH}" autocomplete="new-password" aria-describedby="recovery-password-help" required></label>
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
    if (!canSubmitForm(form, button)) return;
    const { password, password2 } = formToObject(form);
    const passwordError = validatePassword(password);
    if (passwordError) return setStatus(status, passwordError, 'error');
    if (password !== password2) return setStatus(status, 'As senhas não são iguais.', 'error');

    setButtonBusy(button, true, 'Salvando…');
    try {
      await updatePassword(password);
      await signOut();
      setStatus(status, 'Senha atualizada com segurança. Entre novamente com a nova senha.', 'success');
      setTimeout(() => navigate('/entrar', { replace: true }), 500);
    } catch (error) {
      console.error(error);
      setStatus(status, authErrorMessage(error, 'password'), 'error');
    } finally {
      setButtonBusy(button, false);
    }
  });
}

function validatePassword(password) {
  const value = String(password || '');
  if (value.length < PASSWORD_MIN_LENGTH) return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  const hasRequiredCharacters = /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && [...value].some((character) => PASSWORD_SYMBOLS.includes(character));
  if (!hasRequiredCharacters) return PASSWORD_REQUIREMENT;
  return '';
}

function authErrorMessage(error, context) {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  if (code.includes('email_not_confirmed') || message.includes('email not confirmed')) return 'Seu e-mail ainda não foi confirmado. Abra a mensagem enviada pelo Território Vivo e tente novamente.';
  if (code.includes('invalid_credentials') || message.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (code.includes('user_already_exists') || message.includes('already registered')) return 'Não foi possível concluir o cadastro. Se você já tiver uma conta, use “Já tenho conta” ou recupere a senha.';
  if (code.includes('weak_password') || message.includes('weak password')) return PASSWORD_REQUIREMENT;
  if (code.includes('over_request_rate_limit') || code.includes('rate_limit') || message.includes('rate limit')) return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  if (context === 'reset') return 'Não foi possível enviar o link agora. Aguarde um pouco e tente novamente.';
  if (context === 'password') return 'Não foi possível atualizar a senha. Abra novamente o link de recuperação recebido por e-mail.';
  if (context === 'signup') return 'Não foi possível criar a conta. Revise os dados e tente novamente.';
  return 'Não foi possível entrar agora. Confira seus dados e tente novamente.';
}

function bindCommon(root) {
  root.querySelector('[data-home]')?.addEventListener('click', () => navigate('/'));
}
