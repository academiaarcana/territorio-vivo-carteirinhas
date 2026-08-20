import { registerRoute, setNotFoundRenderer, startRouter, navigate, currentPath, renderCurrentRoute } from './core/router.js';
import { setState } from './core/store.js';
import { hydrateSession, clearSession } from './core/session.js';
import { getSession, onAuthChange } from './services/auth.js';
import { renderPublicPage, mountPublicPage } from './pages/public.js';
import { renderLoginPage, mountLoginPage, renderSignupPage, mountSignupPage, renderRecoveryPage, mountRecoveryPage } from './pages/auth.js';
import { renderDashboard, mountDashboard } from './pages/dashboard.js';
import { renderCardsPage, mountCardsPage } from './pages/cards.js';
import { renderFivePage, mountFivePage } from './pages/five.js';
import { renderIndicatorsPage, mountIndicatorsPage } from './pages/indicators.js';
import { renderEducationPage, mountEducationPage } from './pages/education.js';
import { renderProfilePage, mountProfilePage } from './pages/profile.js';
import { renderAdminPage, mountAdminPage } from './pages/admin.js';

registerRoute('/', { render: renderPublicPage, mount: mountPublicPage });
registerRoute('/entrar', { guestOnly: true, render: renderLoginPage, mount: mountLoginPage });
registerRoute('/criar-conta', { guestOnly: true, render: renderSignupPage, mount: mountSignupPage });
registerRoute('/recuperar-senha', { render: renderRecoveryPage, mount: mountRecoveryPage });
registerRoute('/app/inicio', { auth: true, render: renderDashboard, mount: mountDashboard });
registerRoute('/app/carteirinhas', { auth: true, render: renderCardsPage, mount: mountCardsPage });
registerRoute('/app/5-minutos', { auth: true, render: renderFivePage, mount: mountFivePage });
registerRoute('/app/indicadores', { auth: true, render: renderIndicatorsPage, mount: mountIndicatorsPage });
registerRoute('/app/educacao', { auth: true, render: renderEducationPage, mount: mountEducationPage });
registerRoute('/app/perfil', { auth: true, render: renderProfilePage, mount: mountProfilePage });
registerRoute('/app/gestao', { auth: true, admin: true, render: renderAdminPage, mount: mountAdminPage });
setNotFoundRenderer(() => '<main class="standalone"><h1>Página não encontrada</h1><p><a href="#/">Voltar ao início</a></p></main>');

async function bootstrap() {
  const root = document.querySelector('#app');
  if (!root) throw new Error('Elemento #app não encontrado.');
  root.innerHTML = '<main class="standalone"><p>Carregando Território Vivo…</p></main>';

  let session = null;
  try {
    session = await getSession();
    if (session) await hydrateSession(session);
    else setState({ booting: false, session: null, user: null, profile: null, context: null });
  } catch (error) {
    console.error(error);
    setState({ booting: false, lastError: error });
  }

  normalizeAuthCallbackHash(session);

  onAuthChange(async (event, nextSession) => {
    try {
      if (event === 'PASSWORD_RECOVERY') {
        if (nextSession) await hydrateSession(nextSession);
        await navigate('/recuperar-senha', { replace: true });
        return;
      }
      if (nextSession) {
        await hydrateSession(nextSession);
        if (['/entrar','/criar-conta','/'].includes(currentPath())) await navigate('/app/inicio', { replace: true });
        else await renderCurrentRoute();
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

function normalizeAuthCallbackHash(session) {
  const raw = location.hash.replace(/^#/, '');
  if (!raw) return;
  const looksLikeSupabaseCallback = raw.includes('access_token=') || raw.includes('refresh_token=') || raw.includes('error_description=');
  if (!looksLikeSupabaseCallback) return;
  const target = session ? '#/app/inicio' : '#/entrar';
  history.replaceState(null, '', `${location.pathname}${location.search}${target}`);
}

bootstrap().catch((error) => {
  console.error(error);
  const root = document.querySelector('#app');
  if (root) root.innerHTML = '<main class="standalone"><h1>Não foi possível iniciar o Território Vivo</h1><p>Recarregue a página. Se o problema continuar, procure a administração do sistema.</p></main>';
});
