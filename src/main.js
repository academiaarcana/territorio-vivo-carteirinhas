import { registerRoute, setNotFoundRenderer, startRouter, navigate, currentPath, renderCurrentRoute } from './core/router.js';
import { getState, setState } from './core/store.js';
import { hydrateSession, clearSession } from './core/session.js';
import { installGlobalA11y } from './core/a11y.js';
import { CAPABILITIES } from './core/access-control.js';
import { getSession, onAuthChange } from './services/auth.js';
import { renderPublicPage, mountPublicPage } from './pages/public.js';
import { renderLoginPage, mountLoginPage, renderSignupPage, mountSignupPage, renderRecoveryPage, mountRecoveryPage } from './pages/auth.js';
import { renderAccessPendingPage, mountAccessPendingPage } from './pages/access-pending.js';
import { renderAccessManagementPage, mountAccessManagementPage } from './pages/access-management.js';
import { renderDashboard, mountDashboard } from './pages/dashboard.js';
import { renderTerritoryPage, mountTerritoryPage } from './pages/territory.js';
import { renderCardsPage, mountCardsPage } from './pages/cards.js';
import { renderFivePage, mountFivePage } from './pages/five.js';
import { renderIndicatorsPage, mountIndicatorsPage } from './pages/indicators.js';
import { renderEducationPage, mountEducationPage } from './pages/education.js';
import { renderPrescriptionsPage, mountPrescriptionsPage } from './pages/prescriptions.js';
import { renderTutorialPage, mountTutorialPage } from './pages/tutorial.js';
import { renderProfilePage, mountProfilePage } from './pages/profile.js';
import { renderAdminPage, mountAdminPage } from './pages/admin.js';

installGlobalA11y();

registerRoute('/', { render: renderPublicPage, mount: mountPublicPage });
registerRoute('/entrar', { guestOnly: true, render: renderLoginPage, mount: mountLoginPage });
registerRoute('/criar-conta', { guestOnly: true, render: renderSignupPage, mount: mountSignupPage });
registerRoute('/recuperar-senha', { auth: true, render: renderRecoveryPage, mount: mountRecoveryPage });
registerRoute('/app/aguardando', { auth: true, accessGate: true, render: renderAccessPendingPage, mount: mountAccessPendingPage });
registerRoute('/app/inicio', { auth: true, capability: CAPABILITIES.ACCESS_INTERNAL, render: renderDashboard, mount: mountDashboard });
registerRoute('/app/territorio', { auth: true, capability: CAPABILITIES.READ_UNIT_TERRITORY, render: renderTerritoryPage, mount: mountTerritoryPage });
registerRoute('/app/carteirinhas', { auth: true, capability: CAPABILITIES.USE_TEMPORARY_TOOLS, render: renderCardsPage, mount: mountCardsPage });
registerRoute('/app/5-minutos', { auth: true, capability: CAPABILITIES.USE_TEMPORARY_TOOLS, render: renderFivePage, mount: mountFivePage });
registerRoute('/app/indicadores', { auth: true, capability: CAPABILITIES.USE_TEMPORARY_TOOLS, render: renderIndicatorsPage, mount: mountIndicatorsPage });
registerRoute('/app/educacao', { auth: true, capability: CAPABILITIES.USE_TEMPORARY_TOOLS, render: renderEducationPage, mount: mountEducationPage });
registerRoute('/app/prescricoes', { auth: true, capability: CAPABILITIES.USE_EXTERNAL_PRESCRIPTIONS, render: renderPrescriptionsPage, mount: mountPrescriptionsPage });
registerRoute('/app/tutorial', { auth: true, capability: CAPABILITIES.ACCESS_INTERNAL, render: renderTutorialPage, mount: mountTutorialPage });
registerRoute('/app/perfil', { auth: true, capability: CAPABILITIES.EDIT_OWN_PROFILE_DATA, render: renderProfilePage, mount: mountProfilePage });
registerRoute('/app/aprovacoes', { auth: true, capability: CAPABILITIES.MANAGE_UNIT_PROFESSIONALS, render: renderAccessManagementPage, mount: mountAccessManagementPage });
registerRoute('/app/gestao', { auth: true, capability: CAPABILITIES.MANAGE_UNIT, render: renderAdminPage, mount: mountAdminPage });
setNotFoundRenderer(() => '<main class="standalone"><h1>Página não encontrada</h1><p><a href="#/">Voltar ao início</a></p></main>');

async function bootstrap() {
  const root = document.querySelector('#app');
  if (!root) throw new Error('Elemento #app não encontrado.');
  root.innerHTML = '<main class="standalone"><h1>Território Vivo</h1><p>Carregando ambiente…</p></main>';

  let session = null;
  try {
    session = await getSession();
    if (session) await hydrateSession(session);
    else setState({ booting: false, session: null, user: null, profile: null, context: null });
  } catch (error) {
    console.error(error);
    setState({ booting: false, lastError: error });
  }

  normalizeAuthCallbackRoute(session);

  onAuthChange(async (event, nextSession) => {
    try {
      if (event === 'PASSWORD_RECOVERY') {
        if (nextSession) await hydrateSession(nextSession);
        clearRecoveryMarker();
        await navigate('/recuperar-senha', { replace: true });
        return;
      }

      if (nextSession) {
        const previousState = getState();
        const previousAccess = accessContextFingerprint(previousState);
        await hydrateSession(nextSession);
        const nextAccess = accessContextFingerprint(getState());
        if (hasRecoveryMarker()) {
          clearRecoveryMarker();
          await navigate('/recuperar-senha', { replace: true });
          return;
        }
        if (['/entrar','/criar-conta','/'].includes(currentPath())) {
          await navigate('/app/inicio', { replace: true });
          return;
        }
        if (previousAccess === nextAccess) return;
        await renderCurrentRoute();
      } else {
        clearSession();
        if (currentPath().startsWith('/app/')) await navigate('/entrar', { replace: true });
        else await renderCurrentRoute();
      }
    } catch (error) {
      console.error('Falha ao sincronizar sessão', error);
    }
  });

  await startRouter();
}

function accessContextFingerprint(state) {
  const profile = state?.profile || {};
  const context = state?.context || {};
  return JSON.stringify({
    userId: state?.user?.id || state?.session?.user?.id || null,
    role: profile.role || null,
    accessStatus: profile.access_status || null,
    isMaster: Boolean(profile.is_master_account),
    municipalityCode: profile.municipality_code || null,
    unitCnes: profile.unit_cnes || null,
    teamId: profile.team_id || null,
    microarea: profile.microarea || null,
    contextKind: context.scope?.kind || context.kind || null,
    contextUnit: context.unit?.cnes || null,
    contextTeam: context.team?.id || null
  });
}

function hasRecoveryMarker() {
  return new URLSearchParams(location.search).get('recovery') === '1';
}

function clearRecoveryMarker() {
  const url = new URL(location.href);
  url.searchParams.delete('recovery');
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function normalizeAuthCallbackRoute(session) {
  const rawHash = location.hash.replace(/^#/, '');
  const callback = rawHash.includes('access_token=') || rawHash.includes('refresh_token=') || rawHash.includes('error_description=');
  const recovery = hasRecoveryMarker();

  if (!callback && !(recovery && session)) return;

  const url = new URL(location.href);
  if (recovery) url.searchParams.delete('recovery');
  const target = recovery && session ? '#/recuperar-senha' : session ? '#/app/inicio' : '#/entrar';
  history.replaceState(null, '', `${url.pathname}${url.search}${target}`);
}

bootstrap().catch((error) => {
  console.error(error);
  const root = document.querySelector('#app');
  if (root) root.innerHTML = '<main class="standalone"><h1>Não foi possível iniciar o Território Vivo</h1><p>Recarregue a página. Se o problema continuar, procure a administração do sistema.</p></main>';
});
