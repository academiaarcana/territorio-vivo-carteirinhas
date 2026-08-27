import { escapeHtml, initials } from '../lib/dom.js';
import { setButtonBusy } from '../lib/forms.js';
import { renderFlaticonAttribution, renderFlaticonIcon } from '../lib/visual-support.js';
import { navigate } from './router.js';
import { getState } from './store.js';
import { signOut } from '../services/auth.js';
import { CAPABILITIES, hasCapability } from './access-control.js';
import { accessStatusLabel, isManagement, isMaster, isMasterAccount, roleLabel } from './permissions.js';

const navItems = [
  ['/app/inicio', 'Início', 'home'],
  ['/app/territorio', 'Território e rede', 'location'],
  ['/app/carteirinhas', 'Carteirinhas', 'document'],
  ['/app/5-minutos', '5 minutos', 'clock'],
  ['/app/indicadores', 'Indicadores', 'population'],
  ['/app/educacao', 'Educação em saúde', 'group'],
  ['/app/tutorial', 'Objetivo e tutorial', 'action'],
  ['/app/perfil', 'Meu perfil', 'person']
];

export function appLayout({ title, subtitle = '', activePath, content }) {
  const { profile, context } = getState();
  const management = isManagement(profile);
  const networkAdmin = isMaster(profile);
  const masterAccount = isMasterAccount(profile);
  const prescriptionItems = hasCapability(profile, CAPABILITIES.USE_EXTERNAL_PRESCRIPTIONS)
    ? [['/app/prescricoes', 'Prescrições e receitas', 'prescription']]
    : [];
  const managementItems = management
    ? [['/app/aprovacoes', 'Aprovações', 'action'], ['/app/gestao', networkAdmin ? 'Gestão da rede' : 'Gestão da UBS', 'partner']]
    : [];
  const items = [...navItems.slice(0, 6), ...prescriptionItems, ...navItems.slice(6), ...managementItems];
  const contextLabel = masterAccount
    ? 'Master / Desenvolvimento • Administração técnica'
    : networkAdmin
      ? 'Gestão municipal • Rede cadastrada'
      : [context?.unit?.short_name || profile?.unit_name, context?.team?.name || profile?.team_name]
        .filter(Boolean).join(' • ') || 'Atenção Primária';
  const territoryScopeLabel = masterAccount
    ? 'Administração técnica do Território Vivo'
    : networkAdmin
      ? 'Rede municipal cadastrada'
      : [
          context?.unit?.short_name || profile?.unit_name,
          context?.team?.name || profile?.team_name,
          profile?.microarea ? `Microárea ${profile.microarea}` : null
        ].filter(Boolean).join(' • ') || 'Atenção Primária';
  const municipalityName = [context?.municipality?.name, context?.municipality?.state_code].filter(Boolean).join(' • ');
  const headerBrandLabel = masterAccount
    ? 'Território Vivo • Master / Desenvolvimento'
    : networkAdmin
      ? 'Território Vivo • Gestão municipal'
      : municipalityName || 'Rede de Atenção Primária';
  const accountRoleLabel = masterAccount
    ? 'Master / Desenvolvimento • Administração técnica'
    : networkAdmin
      ? 'Gestor Municipal • Administração geral'
      : `${escapeHtml(roleLabel(profile))}${profile?.microarea ? ` • Microárea ${escapeHtml(profile.microarea)}` : ''}`;
  const territoryScopeControl = masterAccount
    ? `<button type="button" class="workspace-territory workspace-territory-action" data-nav="/app/gestao" aria-label="Abrir administração técnica do Território Vivo">${escapeHtml(territoryScopeLabel)}</button>`
    : '';
  const scopeItems = masterAccount
    ? [
        ['partner', 'Escopo', 'Administração técnica'],
        ['population', 'Abrangência', 'Rede cadastrada'],
        ['action', 'Conta', 'Master protegida']
      ]
    : networkAdmin
      ? [
          ['population', 'Escopo', 'Gestão municipal'],
          ['location', 'Abrangência', 'Rede cadastrada'],
          ['action', 'Acesso', 'Administração geral']
        ]
      : management
        ? [
            ['clinic', 'UBS', context?.unit?.short_name || profile?.unit_name || 'Unidade cadastrada'],
            ['person', 'Papel', roleLabel(profile)],
            ['location', 'Abrangência', 'Unidade de saúde']
          ]
        : [
            ['clinic', 'UBS', context?.unit?.short_name || profile?.unit_name || 'Unidade não informada'],
            ['group', 'Equipe', context?.team?.name || profile?.team_name || 'Equipe não informada'],
            [profile?.role === 'acs' ? 'location' : 'person', profile?.role === 'acs' ? 'Microárea' : 'Papel', profile?.role === 'acs' ? (profile?.microarea || 'Não informada') : roleLabel(profile)]
          ];
  const scopeBand = `<section class="workspace-scope-band" aria-label="Escopo de acesso atual">
    ${scopeItems.map(([icon, label, value]) => `<div class="workspace-scope-item">${renderFlaticonIcon(icon, { className: 'workspace-scope-icon' })}<span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></span></div>`).join('')}
  </section>`;

  return `
    <a class="skip-link" href="#main-content">Pular para o conteúdo</a>
    <div class="app-shell">
      <aside class="sidebar" aria-label="Navegação principal">
        <a class="brand brand-app" href="#/app/inicio" aria-label="Território Vivo — Início">
          <span class="brand-mark brand-symbol" aria-hidden="true">
            <svg class="territory-vivo-symbol" viewBox="0 0 52 52" focusable="false" aria-hidden="true">
              <rect x="1" y="1" width="50" height="50" rx="12" fill="currentColor"/>
              <path d="M26 7.5c-7.7 0-14 6.1-14 13.7 0 10.3 14 23.3 14 23.3s14-13 14-23.3c0-7.6-6.3-13.7-14-13.7Z" fill="#fff"/>
              <path d="m18.8 23.1 7.2-6 7.2 6v8.4H18.8v-8.4Z" fill="currentColor"/>
              <circle cx="23" cy="24.8" r="1.8" fill="#fff"/>
              <circle cx="29" cy="24.8" r="1.8" fill="#fff"/>
              <path d="M21.4 29.3c.5-1.7 1.6-2.6 3.1-2.6s2.6.9 3.1 2.6M27 29.3c.4-1.4 1.3-2.1 2.6-2.1 1.2 0 2.1.7 2.6 2.1" fill="none" stroke="#fff" stroke-width="1.45" stroke-linecap="round"/>
              <circle cx="39.5" cy="39.5" r="5.2" fill="#2e7d32" stroke="#fff" stroke-width="2"/>
            </svg>
          </span>
          <span class="brand-copy">
            <strong>Território Vivo</strong>
            <small class="brand-signature">Atenção Primária à Saúde</small>
            <small class="brand-program">Estratégia Saúde da Família</small>
            <small class="brand-context">${escapeHtml(contextLabel)}</small>
          </span>
        </a>
        <nav class="app-nav">
          ${items.map(([path, label, icon]) => `<button type="button" class="nav-link ${activePath === path ? 'active' : ''}" data-nav="${path}" ${activePath === path ? 'aria-current="page"' : ''}>${renderFlaticonIcon(icon, { className: 'nav-flaticon-icon' })}<span>${escapeHtml(label)}</span></button>`).join('')}
        </nav>
        <div class="account-card">
          <span class="avatar" aria-hidden="true">${escapeHtml(initials(profile?.full_name))}</span>
          <div><strong>${escapeHtml(profile?.full_name || 'Profissional')}</strong><small>${accountRoleLabel}</small><small>${escapeHtml(accessStatusLabel(profile))}</small></div>
        </div>
      </aside>
      <div class="workspace">
        <header class="workspace-header">
          <div class="workspace-heading">
            <div class="workspace-brandline">
              <span class="workspace-context-label">${escapeHtml(headerBrandLabel)}</span>
            </div>
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="workspace-subtitle">${escapeHtml(subtitle)}</p>` : ''}
            ${territoryScopeControl}
          </div>
          <button type="button" class="button workspace-signout" data-signout>Sair da conta</button>
        </header>
        ${scopeBand}
        <main id="main-content" class="page-content" tabindex="-1">${content}</main>
        <footer class="workspace-credits">
          <p class="institutional-disclaimer">Território Vivo — ferramenta de apoio à Atenção Primária à Saúde. Não constitui sistema oficial do Ministério da Saúde.</p>
          <div class="workspace-attribution">${renderFlaticonAttribution()}</div>
        </footer>
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
