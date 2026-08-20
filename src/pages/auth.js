import { escapeHtml, formToObject, setStatus } from '../lib/dom.js';
import { navigate } from '../core/router.js';
import { signIn, signUp, sendPasswordReset, updatePassword } from '../services/auth.js';
import { listMunicipalities, listUnits, listTeams } from '../services/repository.js';
import { appConfig } from '../services/supabase.js';

function authFrame(title, intro, body) {
  return `<main class="auth-page"><section class="auth-panel"><a href="#/" class="brand"><span class="brand-mark">TV</span><span><strong>Território Vivo</strong><small>Atenção Primária</small></span></a><header><h1>${escapeHtml(title)}</h1><p>${escapeHtml(intro)}</p></header>${body}<button type="button" class="link-button" data-home>← Voltar para a apresentação</button></section></main>`;
}

export function renderLoginPage() {
  return authFrame('Entrar', 'Use o e-mail e a senha da sua conta profissional.', `
    <form id="login-form" class="stack-form">
      <label>E-mail<input name="email" type="email" autocomplete="username" required></label>
      <label>Senha<input name="password" type="password" autocomplete="current-password" required></label>
      <button class="button primary" type="submit">Entrar</button>
      <p id="auth-status" class="form-status" aria-live="polite"></p>
    </form>
    <div class="auth-links"><button type="button" class="link-button" data-signup>Criar conta</button><button type="button" class="link-button" data-forgot>Esqueci minha senha</button></div>`);
}

export function mountLoginPage({ root }) {
  bindCommon(root);
  root.querySelector('[data-signup]')?.addEventListener('click', () => navigate('/criar-conta'));
  root.querySelector('[data-forgot]')?.addEventListener('click', async () => {
    const email = root.querySelector('[name="email"]').value.trim();
    const status = root.querySelector('#auth-status');
    if (!email) return setStatus(status, 'Digite seu e-mail primeiro.', 'error');
    setStatus(status, 'Enviando link…', 'info');
    try {
      await sendPasswordReset(email);
      setStatus(status, 'Se o e-mail estiver cadastrado, você receberá um link para criar nova senha.', 'success');
    } catch {
      setStatus(status, 'Não foi possível enviar o link agora.', 'error');
    }
  });
  root.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = root.querySelector('#auth-status');
    const { email, password } = formToObject(event.currentTarget);
    setStatus(status, 'Entrando…', 'info');
    try {
      await signIn(email, password);
      navigate('/app/inicio', { replace: true });
    } catch {
      setStatus(status, 'Não foi possível entrar. Confira e-mail, senha e confirmação da conta.', 'error');
    }
  });
}

export function renderSignupPage() {
  return authFrame('Criar conta profissional', 'Informe seus dados de trabalho. Dados de pacientes não são cadastrados aqui.', `
    <form id="signup-form" class="stack-form">
      <label>Nome completo<input name="fullName" autocomplete="name" required maxlength="160"></label>
      <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
      <label>Município<select name="municipalityCode" id="signup-municipality" required><option value="">Carregando…</option></select></label>
      <label>Unidade de saúde<select name="unitCnes" id="signup-unit" required><option value="">Selecione o município</option></select></label>
      <label>Equipe<select name="teamId" id="signup-team"><option value="">Selecione a unidade</option></select></label>
      <label id="custom-team-wrap" hidden>Nome da equipe para confirmação<input name="teamName" maxlength="120" placeholder="Ex.: Equipe 03 ou eSF Rural"></label>
      <label>Microárea<input name="microarea" id="signup-microarea" maxlength="40" placeholder="Ex.: 08" required></label>
      <p id="master-hint" class="field-hint">Município, unidade e microárea são obrigatórios para contas profissionais comuns.</p>
      <label>Senha<input name="password" type="password" minlength="8" autocomplete="new-password" required></label>
      <label>Repita a senha<input name="password2" type="password" minlength="8" autocomplete="new-password" required></label>
      <button class="button primary" type="submit">Criar conta</button>
      <p id="auth-status" class="form-status" aria-live="polite"></p>
    </form>
    <div class="auth-links"><button type="button" class="link-button" data-login>Já tenho conta</button></div>`);
}

export async function mountSignupPage({ root }) {
  bindCommon(root);
  root.querySelector('[data-login]')?.addEventListener('click', () => navigate('/entrar'));
  const municipality = root.querySelector('#signup-municipality');
  const unit = root.querySelector('#signup-unit');
  const team = root.querySelector('#signup-team');
  const customWrap = root.querySelector('#custom-team-wrap');
  const email = root.querySelector('[name="email"]');
  const microarea = root.querySelector('#signup-microarea');
  const hint = root.querySelector('#master-hint');

  async function loadMunicipalities() {
    const rows = await listMunicipalities();
    municipality.innerHTML = rows.map((row) => `<option value="${escapeHtml(row.code)}">${escapeHtml(row.name)} — ${escapeHtml(row.state_code)}</option>`).join('');
    if (rows.some((row) => row.code === '110018')) municipality.value = '110018';
    await loadUnits();
  }

  async function loadUnits() {
    const rows = await listUnits({ municipalityCode: municipality.value || null });
    unit.innerHTML = '<option value="">Selecione</option>' + rows.map((row) => `<option value="${escapeHtml(row.cnes)}">${escapeHtml(row.short_name)}${row.neighborhood ? ` — ${escapeHtml(row.neighborhood)}` : ''}</option>`).join('');
    team.innerHTML = '<option value="">Selecione a unidade</option>';
    customWrap.hidden = true;
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
    const isMaster = email.value.trim().toLowerCase() === appConfig.masterEmail.toLowerCase();
    municipality.required = !isMaster;
    unit.required = !isMaster;
    microarea.required = !isMaster;
    hint.textContent = isMaster ? 'Conta master: município, unidade, equipe e microárea são opcionais.' : 'Município, unidade e microárea são obrigatórios para contas profissionais comuns.';
  }

  municipality.addEventListener('change', loadUnits);
  unit.addEventListener('change', loadTeams);
  team.addEventListener('change', syncCustomTeam);
  email.addEventListener('input', syncMaster);

  try { await loadMunicipalities(); } catch { municipality.innerHTML = '<option value="">Não foi possível carregar</option>'; }
  syncMaster();

  root.querySelector('#signup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = root.querySelector('#auth-status');
    const values = formToObject(event.currentTarget);
    const isMaster = values.email.trim().toLowerCase() === appConfig.masterEmail.toLowerCase();
    if (values.password !== values.password2) return setStatus(status, 'As senhas não são iguais.', 'error');
    if (!isMaster && (!values.municipalityCode || !values.unitCnes || !values.microarea.trim())) return setStatus(status, 'Preencha município, unidade e microárea.', 'error');
    let teamName = '';
    let teamId = values.teamId || null;
    if (values.teamId === '__other__') {
      teamId = null;
      teamName = values.teamName.trim();
      if (!teamName) return setStatus(status, 'Informe o nome da equipe para confirmação.', 'error');
    } else if (values.teamId) {
      teamName = team.selectedOptions[0]?.dataset.name || '';
    }
    setStatus(status, 'Criando conta…', 'info');
    try {
      const data = await signUp({ ...values, teamId, teamName });
      if (data.session) {
        setStatus(status, 'Conta criada. Entrando…', 'success');
        setTimeout(() => navigate('/app/inicio', { replace: true }), 300);
      } else {
        setStatus(status, 'Conta criada. Confira seu e-mail para confirmar o cadastro e depois faça login.', 'success');
      }
    } catch {
      setStatus(status, 'Não foi possível criar a conta. Revise os dados e tente novamente.', 'error');
    }
  });
}

export function renderRecoveryPage() {
  return authFrame('Definir nova senha', 'Abra esta página pelo link enviado ao seu e-mail e escolha uma nova senha.', `
    <form id="recovery-form" class="stack-form"><label>Nova senha<input name="password" type="password" minlength="8" required></label><label>Repita a senha<input name="password2" type="password" minlength="8" required></label><button class="button primary">Salvar nova senha</button><p id="auth-status" class="form-status" aria-live="polite"></p></form>`);
}

export function mountRecoveryPage({ root }) {
  bindCommon(root);
  root.querySelector('#recovery-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = root.querySelector('#auth-status');
    const { password, password2 } = formToObject(event.currentTarget);
    if (password !== password2) return setStatus(status, 'As senhas não são iguais.', 'error');
    try {
      await updatePassword(password);
      setStatus(status, 'Senha atualizada. Você já pode entrar.', 'success');
      setTimeout(() => navigate('/entrar'), 600);
    } catch {
      setStatus(status, 'Não foi possível atualizar a senha. Abra novamente o link recebido por e-mail.', 'error');
    }
  });
}

function bindCommon(root) {
  root.querySelector('[data-home]')?.addEventListener('click', () => navigate('/'));
}
