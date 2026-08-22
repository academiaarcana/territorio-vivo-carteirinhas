import { escapeHtml, formatDateBr } from '../lib/dom.js';
import { navigate } from '../core/router.js';
import { listMunicipalities, listUnits } from '../services/repository.js';

export function renderPublicPage() {
  return `
    <a class="skip-link" href="#public-main">Pular para o conteúdo</a>
    <div class="public-page">
      <header class="public-header">
        <a href="#/" class="brand"><span class="brand-mark" aria-hidden="true">TV</span><span><strong>Território Vivo</strong><small>Apoio à Atenção Primária</small></span></a>
        <nav aria-label="Acesso"><button type="button" class="link-button" data-login>Entrar</button><button type="button" class="button primary" data-signup>Criar conta</button></nav>
      </header>
      <main id="public-main">
        <section class="public-hero">
          <div><p class="eyebrow">Territorialização que vira ação</p><h1>Informação do território organizada para apoiar quem cuida.</h1><p>Carteirinhas, 5 minutos do território, indicadores, educação em saúde, mapa inteligente e gestão da rede em uma aplicação simples, sem criar um prontuário paralelo.</p><div class="actions"><button class="button primary" data-signup>Criar minha conta</button><button class="button" data-login>Já tenho acesso</button></div></div>
          <aside class="public-summary"><strong>O fluxo</strong><ol><li>Profissional cria e confirma sua conta.</li><li>Informa município, unidade, equipe e microárea.</li><li>A gestão da UBS confirma o vínculo profissional.</li><li>O perfil aprovado alimenta automaticamente os materiais.</li><li>Dados temporários de famílias não ficam salvos por padrão.</li></ol></aside>
        </section>
        <section class="section-block"><header><p class="eyebrow">Ferramentas</p><h2>Um sistema dividido por tarefas reais da APS.</h2></header><div class="feature-grid"><article><h3>Território e rede</h3><p>Unidades, equipes e achados territoriais não pessoais para apoiar o mapa inteligente.</p></article><article><h3>Carteirinhas</h3><p>Modelos para família, território, reunião, indicadores e gestão com impressão A4.</p></article><article><h3>5 minutos</h3><p>Achado, decisão, responsável e reavaliação sem relatório longo.</p></article><article><h3>Indicadores</h3><p>Números para orientar perguntas e planejamento, não para ranquear trabalhadores.</p></article><article><h3>Educação em saúde</h3><p>Materiais curtos com fonte técnica e impressão/PDF.</p></article><article><h3>Gestão por escopo</h3><p>Profissional, administrador da própria UBS e master municipal com permissões protegidas no banco.</p></article></div></section>
        <section class="section-block"><header><p class="eyebrow">Rede cadastrada</p><h2>Unidades e pontos de atenção</h2><p>O catálogo pode crescer para outros municípios sem alterar a arquitetura. Dados públicos aparecem com fonte e status de verificação; equipes e lotações são confirmadas localmente.</p></header><div id="public-units" class="unit-grid" aria-live="polite"><p>Carregando unidades…</p></div></section>
        <section class="section-block privacy-block"><h2>Privacidade por desenho</h2><p>O Supabase guarda dados profissionais, institucionais e achados territoriais não pessoais necessários ao funcionamento. Campos usados para gerar carteirinhas e notas de reunião ficam temporários no navegador por padrão.</p></section>
      </main>
      <footer class="public-footer">Território Vivo • Ferramenta de apoio à Atenção Primária. Não substitui e-SUS APS, PEC ou prontuário.</footer>
    </div>`;
}

export async function mountPublicPage({ root }) {
  root.querySelectorAll('[data-login]').forEach((button) => button.addEventListener('click', () => navigate('/entrar')));
  root.querySelectorAll('[data-signup]').forEach((button) => button.addEventListener('click', () => navigate('/criar-conta')));
  const target = root.querySelector('#public-units');
  try {
    const [municipalities, units] = await Promise.all([listMunicipalities(), listUnits()]);
    const municipalityMap = new Map(municipalities.map((item) => [item.code, item]));
    target.innerHTML = units.length ? units.map((unit) => {
      const municipality = municipalityMap.get(unit.municipality_code);
      const place = [municipality?.name, municipality?.state_code].filter(Boolean).join('/') || [unit.municipality, unit.state].filter(Boolean).join('/') || 'Município a confirmar';
      return `<article class="unit-card"><div><span class="status-badge">${unit.data_status === 'team_confirmed' ? 'Confirmado' : unit.data_status === 'needs_review' ? 'A confirmar' : 'Fonte pública'}</span><h3>${escapeHtml(unit.short_name)}</h3><small>${escapeHtml(place)}</small></div><p>${escapeHtml([unit.address, unit.neighborhood].filter(Boolean).join(' — ') || 'Localização a confirmar')}</p><small>CNES ${escapeHtml(unit.cnes)}${unit.source_checked_on ? ` • verificado ${formatDateBr(unit.source_checked_on)}` : ''}</small></article>`;
    }).join('') : '<div class="empty-state"><h3>Nenhuma unidade cadastrada</h3><p>A rede ainda não possui unidades ativas publicadas.</p></div>';
  } catch (error) {
    console.error(error);
    target.innerHTML = '<div class="empty-state"><h3>Catálogo indisponível</h3><p>As unidades não puderam ser carregadas agora.</p></div>';
  }
}
