import { getState } from './store.js';

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
  if (replace) history.replaceState(null, '', hash);
  else if (location.hash !== hash) location.hash = normalized;
  else renderCurrentRoute();
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
    return;
  }

  const state = getState();
  if (route.auth && !state.session) {
    navigate('/entrar', { replace: true });
    return;
  }
  if (route.guestOnly && state.session) {
    navigate('/app/inicio', { replace: true });
    return;
  }
  if (route.admin && state.profile?.role !== 'admin') {
    navigate('/app/inicio', { replace: true });
    return;
  }

  root.dataset.route = path;
  root.innerHTML = await route.render({ path, state });
  await route.mount?.({ root, path, state });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function startRouter() {
  window.addEventListener('hashchange', renderCurrentRoute);
  return renderCurrentRoute();
}

function normalize(path) {
  const cleaned = `/${String(path || '').replace(/^\/+|\/+$/g, '')}`;
  return cleaned === '//' ? '/' : cleaned;
}
