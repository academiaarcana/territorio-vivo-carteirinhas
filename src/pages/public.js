import { escapeHtml, formatDateBr } from '../lib/dom.js';
import { navigate } from '../core/router.js';
import { listUnits } from '../services/repository.js';

export function renderPublicPage() {
  return `
    <div class="public-page">
      <header class="public-header">
        <a href="#/" class="brand"><span class="brand-mark">TV</span><span><strong>Território Vivo</strong><small>Atenção Primária • Pimenta Bueno/RO</small></span></a>
        <nav><button type="button" class="link-button" data-login>Entrar</button><button type="button" class="button primary" data-signup>Criar conta</button></nav>
      </header>
      <main>
        <section class="public-hero">
          <div><p class="eyebrow">Territorialização que vira ação</p><h1>Informação do território organizada para apoiar quem cuida.</h1><p>Carteirinhas, 5 minutos do território, indicadores, educação em saúde e gestão da rede em uma aplicação simples, sem criar um prontuário paralelo.</p><div class="actions"><button class="button primary" data-signup>Criar minha conta</button><button class="button" data-login>Já tenho acesso</button></div></div>
          <aside class="public-summary"><strong>O fluxo</strong><ol><li>Profissional cria sua conta.</li><li>Vincula município, unidade, equipe e microárea.</li><li>O perfil alimenta automaticamente os materiais.</li><li>Dados temporários de famílias não ficam salvos por padrão.</li></ol></aside>
        </section>
        <section class="section-block"><header><p class="eyebrow">Ferramentas</p><h2>Um sistema dividido por tarefas reais da APS.</h2></header><div class="feature-grid"><article><h3>Carteirinhas</h3><p>Modelos para família, território, reunião e gestão com impressão A4.</p></article><article><h3>5 minutos</h3><p>Achado, decisão, responsável e reavaliação sem relatório longo.</p></article><article><h3>Indicadores</h3><p>Números para orientar perguntas e planejamento, não para ranquear trabalhadores.</p></article><article><h3>Educação em saúde</h3><p>Materiais curtos com fonte técnica e impressão/PDF.</p></article></div></section>
        <section class="section-block"><header><p class="eyebrow">Rede cadastrada</p><h2>Unidades e pontos de atenção</h2><p>Dados públicos aparecem com fonte e status de verificação. Equipes e lotações são confirmadas localmente.</p></header><div id="public-units" class="unit-grid"><p>Carregando unidades…</p></div></section>
        <section class="section-block privacy-block"><h2>Privacidade por desenho</h2><p>O Supabase guarda somente dados profissionais e institucionais necessários ao funcionamento. Campos usados para gerar carteirinhas ficam temporários no navegador por padrão.</p></section>
      </main>
      <footer class="public-footer">Território Vivo • Ferramenta de apoio à Atenção Primária. Não substitui e-SUS APS, PEC ou prontuário.</footer>
    </div>`;
}

export async function mountPublicPage({ root }) {
  root.querySelectorAll('[data-login]').forEach((button) => button.addEventListener('click', () => navigate('/entrar')));
  root.querySelectorAll('[data-signup]').forEach((button) => button.addEventListener('click', () => navigate('/criar-conta')));
  const target = root.querySelector('#public-units');
  try {
    const units = await listUnits();
    target.innerHTML = units.map((unit) => `
      <article class="unit-card">
        <div><span class="status-badge">${unit.data_status === 'team_confirmed' ? 'Confirmado' : unit.data_status === 'needs_review' ? 'A confirmar' : 'Fonte pública'}</span><h3>${escapeHtml(unit.short_name)}</h3></div>
        <p>${escapeHtml([unit.address, unit.neighborhood].filter(Boolean).join(' — ') || 'Localização a confirmar')}</p>
        <small>CNES ${escapeHtml(unit.cnes)}${unit.source_checked_on ? ` • verificado ${formatDateBr(unit.source_checked_on)}` : ''}</small>
      </article>`).join('') || '<p>Nenhuma unidade cadastrada.</p>';
  } catch {
    target.innerHTML = '<p>O catálogo de unidades está temporariamente indisponível.</p>';
  }
}
