import { appLayout, mountAppLayout } from '../core/layout.js';
import { registrationGuide } from '../data/registration-guide.js';
import { escapeHtml, formatDateBr } from '../lib/dom.js';
import { renderFlaticonIcon } from '../lib/visual-support.js';

function renderDimension(item, index) {
  const icons = ['home', 'location', 'family', 'person'];
  return `<article class="registration-dimension-card">
    <div class="registration-dimension-icon">${renderFlaticonIcon(icons[index])}</div>
    <div><span class="category-label">Dimensão ${index + 1}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.purpose)}</p><small><strong>Como conduzir:</strong> ${escapeHtml(item.guidance)}</small></div>
  </article>`;
}

function renderCitizenStep(item) {
  return `<details class="registration-step" ${item.number === 4 ? 'open' : ''}>
    <summary><span>${item.number}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.what)}</small></span></summary>
    <div><p><strong>Como preencher:</strong> ${escapeHtml(item.how)}</p></div>
  </details>`;
}

function renderConcept(item) {
  return `<article class="registration-concept-card"><h3>${escapeHtml(item.term)}</h3><p>${escapeHtml(item.definition)}</p><small>${escapeHtml(item.options)}</small></article>`;
}

export function renderRegistrationGuidePage() {
  const guide = registrationGuide;
  const content = `
    <section class="panel registration-guide-hero">
      <div class="registration-guide-hero-icon">${renderFlaticonIcon('document')}</div>
      <div><p class="eyebrow">Guia de cadastro inclusivo</p><h2>${escapeHtml(guide.title)}</h2><p>${escapeHtml(guide.summary)}</p><small>Conteúdo revisado em ${formatDateBr(guide.reviewedOn)}.</small></div>
      <button class="button" type="button" data-nav="/app/educacao">Voltar à Educação em saúde</button>
    </section>
    <section class="registration-guide-boundary" aria-labelledby="registration-boundary-title">
      <div>${renderFlaticonIcon('warning')}<div><p class="eyebrow">Limite do material</p><h2 id="registration-boundary-title">Este guia orienta; não coleta cadastros</h2></div></div>
      <p>Consulte sempre os campos e as regras da versão instalada do e-SUS APS e o fluxo definido pela gestão local. O Território Vivo não recebe nem armazena as respostas do cidadão nesta página.</p>
    </section>
    <section class="panel registration-guide-section" aria-labelledby="registration-dimensions-title">
      <header><p class="eyebrow">Antes do cidadão</p><h2 id="registration-dimensions-title">As dimensões do cadastro no território</h2><p>O manual organiza o cadastro em imóvel, território, família e cidadão. Use a sequência para evitar vínculos incompletos.</p></header>
      <div class="registration-dimensions">${guide.dimensions.map(renderDimension).join('')}</div>
    </section>
    <section class="panel registration-guide-section" aria-labelledby="registration-steps-title">
      <header><p class="eyebrow">Roteiro de campo</p><h2 id="registration-steps-title">Cadastro do cidadão, etapa por etapa</h2><p>Abra cada etapa para consultar o que significa e como conduzir a pergunta. A oitava aparece somente quando aplicável.</p></header>
      <div class="registration-steps">${guide.citizenSteps.map(renderCitizenStep).join('')}</div>
    </section>
    <section class="panel registration-guide-section registration-identity-section" aria-labelledby="registration-identity-title">
      <header><p class="eyebrow">Cadastro sem suposições</p><h2 id="registration-identity-title">Orientação sexual, identidade de gênero e nome social</h2><p>Esses conceitos são diferentes. A resposta pertence à pessoa e deve ser registrada conforme sua autodeclaração.</p></header>
      <div class="registration-concepts">${guide.concepts.map(renderConcept).join('')}</div>
    </section>
    <section class="panel registration-question-section" aria-labelledby="registration-questions-title">
      <header><p class="eyebrow">Perguntas prontas</p><h2 id="registration-questions-title">Como perguntar sem conduzir a resposta</h2><p>Use estas frases como apoio, em ambiente reservado e com tom natural. Leia as opções que aparecem na versão instalada do e-SUS APS.</p></header>
      <div class="registration-question-list">${guide.sampleQuestions.map((item) => `<article><span>${escapeHtml(item.title)}</span><p>“${escapeHtml(item.question)}”</p></article>`).join('')}</div>
    </section>
    <section class="registration-conversation-grid">
      <article class="panel registration-do-card"><p class="eyebrow">Como perguntar</p><h2>Conversa respeitosa</h2><ol>${guide.conversationSteps.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol></article>
      <article class="panel registration-avoid-card"><p class="eyebrow">O que evitar</p><h2>Não presumir nem expor</h2><ul>${guide.avoid.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article>
    </section>
    <section class="panel registration-sources" aria-labelledby="registration-sources-title">
      <div><p class="eyebrow">Referências oficiais</p><h2 id="registration-sources-title">Fontes usadas neste guia</h2><p>O conteúdo deve ser revisto quando o Ministério da Saúde atualizar o e-SUS APS ou as fichas de cadastro.</p></div>
      <ul>${guide.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>
    </section>`;

  return appLayout({
    title: 'Como preencher o cadastro',
    subtitle: 'Consulta rápida para o trabalho do ACS e da equipe.',
    activePath: '/app/educacao',
    content
  });
}

export function mountRegistrationGuidePage({ root }) {
  mountAppLayout(root);
}
