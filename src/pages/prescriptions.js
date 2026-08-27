import { appLayout, mountAppLayout } from '../core/layout.js';
import { escapeHtml } from '../lib/dom.js';
import { renderFlaticonIcon } from '../lib/visual-support.js';
import { ROLES, roleLabel } from '../core/permissions.js';

const CUIDADO_PARA_TODOS_URL = 'https://www.cuidadoparatodos.com.br/';

export function renderPrescriptionsPage({ state }) {
  const profile = state.profile || {};
  const nurse = profile.role === ROLES.NURSE;
  const professionalNotice = nurse
    ? 'A prescrição de enfermagem deve ocorrer no contexto da consulta de enfermagem e seguir os protocolos e rotinas aprovados pelo serviço, os programas de saúde pública e os limites da habilitação profissional.'
    : 'A emissão e a assinatura de receitas devem seguir as regras profissionais aplicáveis, o registro do conselho e os requisitos de validade da plataforma utilizada.';
  const content = `
    <section class="prescription-hero panel">
      <div class="prescription-hero-icon">${renderFlaticonIcon('prescription')}</div>
      <div>
        <p class="eyebrow">Acesso clínico externo</p>
        <h2>Prescrições acessíveis, fora do Território Vivo.</h2>
        <p>Use o Cuidado Para Todos para elaborar prescrições visualmente acessíveis. O serviço abre em outra página e mantém conta, conteúdo, validação e políticas próprias.</p>
        <div class="actions"><a class="button primary prescription-primary-action" href="${CUIDADO_PARA_TODOS_URL}" target="_blank" rel="noopener noreferrer">Abrir Cuidado Para Todos <span aria-hidden="true">↗</span></a></div>
      </div>
    </section>
    <section class="prescription-boundary" aria-labelledby="prescription-boundary-title">
      <div><p class="eyebrow">Fronteira de privacidade</p><h2 id="prescription-boundary-title">Nenhuma receita é armazenada aqui</h2></div>
      <p>O Território Vivo não recebe nem grava nome de paciente, diagnóstico, medicamento, dose, receita, arquivo, assinatura ou credencial usada no serviço externo.</p>
    </section>
    <section class="prescription-grid">
      <article class="panel prescription-step"><span>1</span><div><h3>Confirme o contexto</h3><p>Você está acessando como <strong>${escapeHtml(roleLabel(profile))}</strong>, com vínculo profissional aprovado no Território Vivo.</p></div></article>
      <article class="panel prescription-step"><span>2</span><div><h3>Abra o serviço externo</h3><p>Entre diretamente no Cuidado Para Todos. Não há login único nem compartilhamento automático de conta.</p></div></article>
      <article class="panel prescription-step"><span>3</span><div><h3>Valide antes de emitir</h3><p>${escapeHtml(professionalNotice)}</p></div></article>
    </section>
    <section class="panel prescription-guidance">
      <div>${renderFlaticonIcon('warning')}<div><p class="eyebrow">Responsabilidade profissional</p><h2>O acesso não amplia atribuições clínicas</h2></div></div>
      <p>${escapeHtml(professionalNotice)} Confira também os requisitos de identificação, assinatura, registro em prontuário e entrega do documento antes da emissão.</p>
      <ul>
        ${nurse ? '<li><a href="https://www.cofen.gov.br/resolucao-cofen-no-801-de-14-de-janeiro-de-2026/" target="_blank" rel="noopener noreferrer">Diretrizes do Cofen para prescrição por enfermeiros</a></li>' : '<li><a href="https://portal.cfm.org.br/noticias/cfm-atualiza-plataforma-que-permite-aos-medicos-prescreverem-receitas-digitalmente/" target="_blank" rel="noopener noreferrer">Orientações do CFM sobre receitas digitais</a></li>'}
        <li><a href="https://www.cuidadoparatodos.com.br/sobre" target="_blank" rel="noopener noreferrer">Conheça a plataforma Cuidado Para Todos</a></li>
      </ul>
    </section>`;

  return appLayout({
    title: 'Prescrições e receitas',
    subtitle: 'Acesso exclusivo para médicas(os) e enfermeiras(os) com perfil ativo.',
    activePath: '/app/prescricoes',
    content
  });
}

export function mountPrescriptionsPage({ root }) {
  mountAppLayout(root);
}
