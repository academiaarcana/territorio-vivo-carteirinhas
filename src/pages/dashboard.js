import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml } from '../lib/dom.js';
import { navigate } from '../core/router.js';

export function renderDashboard({ state }) {
  const profile = state.profile || {};
  const context = state.context || {};
  const territory = [context.unit?.short_name || profile.unit_name, context.team?.name || profile.team_name, profile.microarea ? `Microárea ${profile.microarea}` : ''].filter(Boolean).join(' • ') || 'Complete seu perfil territorial';
  const content = `
    <section class="hero-panel"><p class="eyebrow">Território Vivo</p><h2>Informação que circula vira cuidado.</h2><p>Use o sistema para registrar somente o que ajuda a equipe a decidir, agir e reavaliar.</p><div class="actions"><button class="button primary" data-go="/app/carteirinhas">Criar carteirinha</button><button class="button" data-go="/app/5-minutos">Abrir 5 minutos</button></div></section>
    <section class="dashboard-grid">
      <article class="panel"><h3>Seu contexto</h3><dl class="summary-list"><div><dt>Profissional</dt><dd>${escapeHtml(profile.full_name || '—')}</dd></div><div><dt>Território</dt><dd>${escapeHtml(territory)}</dd></div><div><dt>Contato</dt><dd>${escapeHtml(profile.acs_phone || 'Não informado')}</dd></div></dl><button class="link-button" data-go="/app/perfil">Atualizar perfil</button></article>
      <article class="panel"><h3>5 minutos do território</h3><p>Leve uma mudança, uma pessoa, um risco, uma lacuna ou uma potencialidade para decisão da equipe.</p><button class="link-button" data-go="/app/5-minutos">Registrar nota rápida</button></article>
      <article class="panel"><h3>Carteirinhas</h3><p>Formulários temporários com impressão A4, leitura fácil e modo econômico.</p><button class="link-button" data-go="/app/carteirinhas">Abrir biblioteca</button></article>
      <article class="panel"><h3>Indicadores</h3><p>Transforme números em perguntas e ações, sem usar indicador como ranking de trabalhadores.</p><button class="link-button" data-go="/app/indicadores">Abrir indicadores</button></article>
    </section>`;
  return appLayout({ title: 'Início', subtitle: 'Visão rápida do trabalho territorial.', activePath: '/app/inicio', content });
}

export function mountDashboard({ root }) {
  mountAppLayout(root);
  root.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.go)));
}
