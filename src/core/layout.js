import { escapeHtml, initials } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { navigate } from './router.js';
import { getState } from './store.js';
import { signOut } from '../services/auth.js';
import { accessStatusLabel, isManagement, isMaster, isMasterAccount, roleLabel } from './permissions.js';

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
  const networkAdmin = isMaster(profile);
  const masterAccount = isMasterAccount(profile);
  const managementItems = management
    ? [['/app/aprovacoes', 'Aprovações'], ['/app/gestao', networkAdmin ? 'Gestão da rede' : 'Gestão da UBS']]
    : [];
  const items = [...navItems, ...managementItems];
  const contextLabel = masterAccount
    ? 'Master / Desenvolvimento • Administração técnica'
    : networkAdmin
      ? 'Gestão municipal • Rede cadastrada'
      : [context?.unit?.short_name || profile?.unit_name, context?.team?.name || profile?.team_name]
        .filter(Boolean).join(' • ') || 'Atenção Primária';
  const municipalityLabel = masterAccount
    ? 'Território Vivo • Master / Desenvolvimento'
    : networkAdmin
      ? 'Território Vivo • Gestão municipal'
      : [context?.municipality?.name, context?.municipality?.state_code].filter(Boolean).join(' • ') || 'Rede de Atenção Primária';
  const accountRoleLabel = masterAccount
    ? 'Master / Desenvolvimento • Administração técnica'
    : networkAdmin
      ? 'Gestor Municipal • Administração geral'
      : `${escapeHtml(roleLabel(profile))}${profile?.microarea ? ` • Microárea ${escapeHtml(profile.microarea)}` : ''}`;

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
          <div><strong>${escapeHtml(profile?.full_name || 'Profissional')}</strong><small>${accountRoleLabel}</small><small>${escapeHtml(accessStatusLabel(profile))}</small></div>
        </div>
      </aside>
      <div class="workspace">
        <header class="workspace-header">
          <div><p class="eyebrow">${escapeHtml(municipalityLabel)}</p><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div>
          <button type="button" class="button workspace-signout" data-signout>Sair da conta</button>
        </header>
        <main id="main-content" class="page-content" tabindex="-1">${content}</main>
      </div>
    </div>`;
}

export function mountAppLayout(root) {
  root.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.nav)));
  const signout = root.querySelector('[data-signout]');
  signout?.addEventListener('click', async () => {
    if (signout.disabled) return;
    setButtonBusy(signout, true, 'Saindo…');
    try {
      await signOut();
      await navigate('/');
    } catch (error) {
      console.error(error);
      window.alert('Não foi possível sair agora. Tente novamente.');
    } finally {
      setButtonBusy(signout, false);
    }
  });
}
