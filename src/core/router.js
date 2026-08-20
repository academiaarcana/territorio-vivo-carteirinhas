import { getState } from './store.js';
import { isManagement, isMaster } from './permissions.js';

const routes = new Map();
let renderNotFound = () => '<main class="standalone"><h1>Página não encontrada</h1></main>';
let rendering = false;

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
  if (rendering) return;
  const root = document.querySelector('#app');
  if (!root) return;

  rendering = true;
  try {
    const path = currentPath();
    const route = routes.get(path);
    if (!route) {
      root.innerHTML = renderNotFound();
      focusPageHeading(root);
      return;
    }

    const state = getState();
    if (route.auth && !state.session) {
      await navigate('/entrar', { replace: true });
      return;
    }
    if (route.guestOnly && state.session) {
      await navigate('/app/inicio', { replace: true });
      return;
    }
    if (route.management && !isManagement(state.profile)) {
      await navigate('/app/inicio', { replace: true });
      return;
    }
    if (route.master && !isMaster(state.profile)) {
      await navigate('/app/inicio', { replace: true });
      return;
    }

    root.dataset.route = path;
    root.innerHTML = await route.render({ path, state });
    await route.mount?.({ root, path, state });
    window.scrollTo({ top: 0, behavior: 'auto' });
    focusPageHeading(root);
  } finally {
    rendering = false;
  }
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
