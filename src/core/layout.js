import { escapeHtml, initials } from '../lib/dom.js';
import { navigate } from './router.js';
import { getState } from './store.js';
import { signOut } from '../services/auth.js';

const navItems = [
  ['/app/inicio', 'Início'],
  ['/app/territorio', 'Território e rede'],
  ['/app/carteirinhas', 'Carteirinhas'],
  ['/app/5-minutos', '5 minutos'],
  ['/app/indicadores', 'Indicadores'],
  ['/app/educacao', 'Educação em saúde'],
  ['/app/perfil', 'Meu perfil']
];

export function appLayout({ title, subtitle = '', activePath, content }) {
  const { profile, context } = getState();
  const admin = profile?.role === 'admin';
  const items = admin ? [...navItems, ['/app/gestao', 'Gestão da rede']] : navItems;
  const contextLabel = [context?.unit?.short_name || profile?.unit_name, context?.team?.name || profile?.team_name]
    .filter(Boolean).join(' • ') || 'Atenção Primária';

  return `
    <div class="app-shell">
      <aside class="sidebar" aria-label="Navegação principal">
        <a class="brand" href="#/app/inicio"><span class="brand-mark">TV</span><span><strong>Território Vivo</strong><small>${escapeHtml(contextLabel)}</small></span></a>
        <nav class="app-nav">
          ${items.map(([path, label]) => `<button type="button" class="nav-link ${activePath === path ? 'active' : ''}" data-nav="${path}">${escapeHtml(label)}</button>`).join('')}
        </nav>
        <div class="account-card">
          <span class="avatar">${escapeHtml(initials(profile?.full_name))}</span>
          <div><strong>${escapeHtml(profile?.full_name || 'Profissional')}</strong><small>${admin ? 'Conta master' : (profile?.microarea ? `Microárea ${escapeHtml(profile.microarea)}` : 'Perfil profissional')}</small></div>
          <button type="button" class="link-button" data-signout>Sair</button>
        </div>
      </aside>
      <div class="workspace">
        <header class="workspace-header">
          <div><p class="eyebrow">${escapeHtml(context?.municipality?.name || 'Pimenta Bueno')} • ${escapeHtml(context?.municipality?.state_code || 'RO')}</p><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>
        </header>
        <main class="page-content">${content}</main>
      </div>
    </div>`;
}

export function mountAppLayout(root) {
  root.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.nav)));
  root.querySelector('[data-signout]')?.addEventListener('click', async () => {
    await signOut();
    navigate('/');
  });
}
