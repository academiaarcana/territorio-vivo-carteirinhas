import { escapeHtml, initials } from '../lib/dom.js';
import { navigate } from './router.js';
import { getState } from './store.js';
import { signOut } from '../services/auth.js';
import { accessStatusLabel, isManagement, isMaster, roleLabel } from './permissions.js';

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
  const management = isManagement(profile);
  const managementItems = management
    ? [['/app/aprovacoes', 'Aprovações'], ['/app/gestao', isMaster(profile) ? 'Gestão da rede' : 'Gestão da UBS']]
    : [];
  const items = [...navItems, ...managementItems];
  const contextLabel = [context?.unit?.short_name || profile?.unit_name, context?.team?.name || profile?.team_name]
    .filter(Boolean).join(' • ') || 'Atenção Primária';
  const municipalityLabel = [context?.municipality?.name, context?.municipality?.state_code].filter(Boolean).join(' • ') || 'Rede de Atenção Primária';

  return `
    <a class="skip-link" href="#main-content">Pular para o conteúdo</a>
    <div class="app-shell">
      <aside class="sidebar" aria-label="Navegação principal">
        <a class="brand" href="#/app/inicio"><span class="brand-mark" aria-hidden="true">TV</span><span><strong>Território Vivo</strong><small>${escapeHtml(contextLabel)}</small></span></a>
        <nav class="app-nav">
          ${items.map(([path, label]) => `<button type="button" class="nav-link ${activePath === path ? 'active' : ''}" data-nav="${path}" ${activePath === path ? 'aria-current="page"' : ''}>${escapeHtml(label)}</button>`).join('')}
        </nav>
        <div class="account-card">
          <span class="avatar" aria-hidden="true">${escapeHtml(initials(profile?.full_name))}</span>
          <div><strong>${escapeHtml(profile?.full_name || 'Profissional')}</strong><small>${escapeHtml(roleLabel(profile))}${profile?.microarea && !isMaster(profile) ? ` • Microárea ${escapeHtml(profile.microarea)}` : ''}</small><small>${escapeHtml(accessStatusLabel(profile))}</small></div>
          <button type="button" class="link-button" data-signout>Sair</button>
        </div>
      </aside>
      <div class="workspace">
        <header class="workspace-header">
          <div><p class="eyebrow">${escapeHtml(municipalityLabel)}</p><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>
        </header>
        <main id="main-content" class="page-content" tabindex="-1">${content}</main>
      </div>
    </div>`;
}

export function mountAppLayout(root) {
  root.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.nav)));
  bindTabKeyboard(root);
  root.querySelector('[data-signout]')?.addEventListener('click', async () => {
    const button = root.querySelector('[data-signout]');
    button.disabled = true;
    try {
      await signOut();
      await navigate('/');
    } finally {
      button.disabled = false;
    }
  });
}

function bindTabKeyboard(root) {
  root.querySelectorAll('[role="tablist"]').forEach((tablist) => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]:not([disabled])')];
    if (!tabs.length) return;
    tabs.forEach((tab) => tab.setAttribute('tabindex', tab.getAttribute('aria-selected') === 'true' ? '0' : '-1'));
    tablist.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      let next = current;
      if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      tabs[next].focus();
      tabs[next].click();
    });
  });
}
