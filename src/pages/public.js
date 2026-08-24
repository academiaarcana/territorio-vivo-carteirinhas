import { escapeHtml, formatDateBr } from '../lib/dom.js';
import { navigate } from '../core/router.js';
import { listMunicipalities, listUnits } from '../services/repository.js';
import { quickTutorial, territorializationCycle, territoryVivoObjectives } from '../data/tutorial-content.js';

export function renderPublicPage() {
  return `
    <a class="skip-link" href="#public-main">Pular para o conteúdo</a>
    <div class="public-page">
      <header class="public-header">
        <a href="#/" class="brand brand-public" aria-label="Território Vivo — Início"><span class="brand-mark brand-symbol" aria-hidden="true"><svg class="territory-vivo-symbol" viewBox="0 0 52 52" focusable="false" aria-hidden="true"><rect x="1" y="1" width="50" height="50" rx="12" fill="currentColor"/><path d="M26 7.5c-7.7 0-14 6.1-14 13.7 0 10.3 14 23.3 14 23.3s14-13 14-23.3c0-7.6-6.3-13.7-14-13.7Z" fill="#fff"/><path d="m18.8 23.1 7.2-6 7.2 6v8.4H18.8v-8.4Z" fill="currentColor"/><circle cx="23" cy="24.8" r="1.8" fill="#fff"/><circle cx="29" cy="24.8" r="1.8" fill="#fff"/><path d="M21.4 29.3c.5-1.7 1.6-2.6 3.1-2.6s2.6.9 3.1 2.6M27 29.3c.4-1.4 1.3-2.1 2.6-2.1 1.2 0 2.1.7 2.6 2.1" fill="none" stroke="#fff" stroke-width="1.45" stroke-linecap="round"/><circle cx="39.5" cy="39.5" r="5.2" fill="#2f6f52" stroke="#fff" stroke-width="2"/></svg></span><span><strong>Território Vivo</strong><small>Apoio à Atenção Primária</small></span></a>
        <nav aria-label="Acesso"><button type="button" class="link-button" data-login>Entrar</button><button type="button" class="button primary" data-signup>Criar conta</button></nav>
      </header>
      <main id="public-main">
        <section class="public-hero public-hero-territory">
          <div><p class="eyebrow">Territorialização para planejamento</p><h1>Do território observado ao próximo passo da equipe.</h1><p>O Território Vivo organiza achados não pessoais, rede, indicadores e materiais de comunicação para apoiar planejamento e reavaliação na Atenção Primária — sem criar um prontuário paralelo.</p><div class="actions"><button class="button primary" data-signup>Criar minha conta</button><button class="button" data-login>Já tenho acesso</button></div></div>
          <aside class="public-summary"><strong>Como funciona</strong><ol><li>O profissional acessa o sistema no escopo autorizado.</li><li>A equipe reconhece recursos, barreiras e mudanças do território.</li><li>O achado é interpretado e levado para decisão.</li><li>Uma ação possível ganha responsável e revisão.</li><li>Dados clínicos identificáveis permanecem nos sistemas oficiais.</li></ol></aside>
        </section>

        <section class="section-block"><header><p class="eyebrow">Objetivo</p><h2>Reconhecer, compreender e planejar a partir do território.</h2><p>O Território Vivo aproxima observação de campo, dados, rede e decisão da equipe. Territorialização aqui é processo contínuo: conhecer, interpretar, priorizar, agir e reavaliar.</p></header><div class="feature-grid">${territoryVivoObjectives.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}</div></section>

        <section class="section-block section-emphasis"><header><p class="eyebrow">Território vivo</p><h2>Mais do que localizar pontos no mapa</h2><p>O território reúne pessoas, relações, serviços, recursos, barreiras, circulação e condições sociais e ambientais que mudam ao longo do tempo.</p></header><div class="concept-flow compact-flow">${territorializationCycle.map(([title, text], index) => `<article class="concept-step"><span class="concept-number">${index + 1}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></article>`).join('')}</div></section>

        <section class="section-block"><header><p class="eyebrow">Tutorial rápido</p><h2>Como demonstrar o Território Vivo</h2><p>Um roteiro simples para apresentar o sistema do contexto territorial até a reavaliação.</p></header><div class="feature-grid">${quickTutorial.slice(0, 6).map(([step, title, text]) => `<article><span class="status-badge">Passo ${escapeHtml(step)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div><div class="actions"><button class="button primary" data-login>Entrar para abrir o tutorial completo</button></div></section>

        <section class="section-block"><header><p class="eyebrow">Ferramentas</p><h2>Tarefas reais da APS organizadas em um único fluxo.</h2></header><div class="feature-grid"><article><h3>Território e rede</h3><p>Unidades, equipes e achados territoriais não pessoais para leitura territorial.</p></article><article><h3>Carteirinhas</h3><p>Materiais temporários para orientação, reunião e organização do cuidado com impressão A4.</p></article><article><h3>5 minutos</h3><p>Achado, significado, decisão, responsável e reavaliação sem relatório longo.</p></article><article><h3>Indicadores</h3><p>Números para orientar perguntas e planejamento, não para ranquear trabalhadores.</p></article><article><h3>Educação em saúde</h3><p>Materiais curtos com fonte técnica, data de revisão e impressão/PDF.</p></article><article><h3>Gestão por escopo</h3><p>Profissional/ACS, Administrador da própria UBS e Gestor Municipal têm capacidades compatíveis com seu papel; a conta Master / Desenvolvimento permanece separada para administração técnica.</p></article></div></section>
        <section class="section-block"><header><p class="eyebrow">Rede cadastrada</p><h2>Unidades e pontos de atenção</h2><p>O catálogo pode crescer para outros municípios sem alterar a arquitetura. Dados públicos aparecem com fonte e status de verificação; equipes e lotações são confirmadas localmente.</p></header><div id="public-units" class="unit-grid" aria-live="polite"><p>Carregando unidades…</p></div></section>
        <section class="section-block privacy-block"><h2>Privacidade por desenho</h2><p>O Supabase guarda dados profissionais, institucionais e achados territoriais não pessoais necessários ao funcionamento. Campos usados para gerar carteirinhas e notas de reunião ficam temporários no navegador por padrão.</p></section>
      </main>
      <footer class="public-footer">Território Vivo — ferramenta de apoio à Atenção Primária à Saúde. Não constitui sistema oficial do Ministério da Saúde.</footer>
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
