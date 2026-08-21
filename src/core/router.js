import { getState } from './store.js';
import { CAPABILITIES, hasCapability } from './access-control.js';
import { hydrateSession } from './session.js';

const routes = new Map();
let renderNotFound = () => '<main class="standalone"><h1>Página não encontrada</h1></main>';

export function registerRoute(path, definition) {
  routes.set(normalize(path), definition);
}

export function setNotFoundRenderer(renderer) {
  renderNotFound = renderer;
}

export function navigate(path, { replace = false } = {}) {
  const normalized = normalize(path);
  const hash = `#${normalized}`;
  if (replace) {
    history.replaceState(null, '', hash);
    return renderCurrentRoute();
  }
  if (location.hash !== hash) {
    location.hash = normalized;
    return;
  }
  return renderCurrentRoute();
}

export function currentPath() {
  return normalize(location.hash.replace(/^#/, '') || '/');
}

export async function renderCurrentRoute() {
  const root = document.querySelector('#app');
  if (!root) return;

  const path = currentPath();
  const route = routes.get(path);
  if (!route) {
    root.innerHTML = renderNotFound();
    focusPageHeading(root);
    return;
  }

  let state = getState();
  if (route.auth && !state.session) return navigate('/entrar', { replace: true });
  if (route.guestOnly && state.session) return navigate('/app/inicio', { replace: true });

  if ((route.capability || route.accessGate) && state.session) {
    try {
      await hydrateSession(state.session);
      state = getState();
    } catch (error) {
      console.error('Falha ao revalidar acesso', error);
      root.innerHTML = '<main class="standalone"><h1>Não foi possível validar seu acesso</h1><p>Recarregue a página. Se o problema continuar, procure a administração do sistema.</p></main>';
      focusPageHeading(root);
      return;
    }
  }

  if (route.accessGate && hasCapability(state.profile, CAPABILITIES.ACCESS_INTERNAL)) return navigate('/app/inicio', { replace: true });
  if (route.capability && !hasCapability(state.profile, route.capability)) {
    const fallback = hasCapability(state.profile, CAPABILITIES.ACCESS_INTERNAL) ? '/app/inicio' : '/app/aguardando';
    return navigate(fallback, { replace: true });
  }

  root.dataset.route = path;
  root.innerHTML = await route.render({ path, state });
  await route.mount?.({ root, path, state });
  window.scrollTo({ top: 0, behavior: 'auto' });
  focusPageHeading(root);
}

export function startRouter() {
  window.addEventListener('hashchange', renderCurrentRoute);
  return renderCurrentRoute();
}

function focusPageHeading(root) {
  const heading = root.querySelector('h1');
  if (!heading) return;
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
}

function normalize(path) {
  const cleaned = `/${String(path || '').replace(/^\/+|\/+$/g, '')}`;
  return cleaned === '//' ? '/' : cleaned;
}
