export const territoryVivoObjectives = [
  {
    title: 'Transformar território em decisão',
    text: 'Organizar informações territoriais úteis para que a equipe reconheça mudanças, priorize situações, combine ações e reavalie resultados.'
  },
  {
    title: 'Apoiar o vínculo com famílias e comunidade',
    text: 'Produzir materiais simples, legíveis e temporários para comunicação, orientação e organização do cuidado sem criar prontuário paralelo.'
  },
  {
    title: 'Conectar dado, equipe e planejamento',
    text: 'Aproximar indicadores, conhecimento dos ACS, rede local e decisões da equipe em um fluxo curto, compartilhável e territorial.'
  }
];

export const systemFunctions = [
  {
    title: 'Território e rede',
    text: 'Consulta a rede cadastrada e organiza achados territoriais não pessoais: recursos, potencialidades, parceiros, riscos, pontos críticos e barreiras de acesso.'
  },
  {
    title: 'Carteirinhas',
    text: 'Gera materiais temporários para famílias, território, reuniões, indicadores e gestão, com leitura fácil, apoio visual, modo econômico, letra ampliada, lote e impressão/PDF.'
  },
  {
    title: '5 minutos do território',
    text: 'Transforma um achado em conversa objetiva: o que mudou, por que importa, qual decisão será tomada, quem fica responsável e quando revisar.'
  },
  {
    title: 'Indicadores',
    text: 'Ajuda a interpretar números como perguntas de território e planejar ações, sem usar indicadores para ranquear trabalhadores.'
  },
  {
    title: 'Educação em saúde',
    text: 'Reúne materiais educativos curtos com fonte técnica e opções de impressão/PDF para apoio às atividades da APS.'
  },
  {
    title: 'Perfil territorial',
    text: 'Mantém o vínculo profissional com município, UBS, equipe e microárea para preencher automaticamente o contexto dos materiais.'
  },
  {
    title: 'Aprovações',
    text: 'Permite à gestão responsável revisar vínculos e liberar ou suspender acessos dentro do escopo autorizado.'
  },
  {
    title: 'Gestão da UBS e da rede',
    text: 'Administra unidades, equipes, perfis e escopos conforme o papel do usuário, com o banco como autoridade final de segurança.'
  },
  {
    title: 'PDF e impressão A4',
    text: 'Organiza carteirinhas e materiais em folhas A4 com layouts de 2, 4, 8 ou 12 posições conforme a ferramenta e as regras de acessibilidade.'
  },
  {
    title: 'Privacidade por desenho',
    text: 'Mantém carteirinhas, notas dos 5 minutos e reflexões de indicadores como rascunhos voláteis da aba, sem transformá-los em banco paralelo.'
  }
];

export const quickTutorial = [
  ['1', 'Confira seu contexto', 'Veja no cabeçalho se UBS, equipe e microárea correspondem ao seu vínculo.'],
  ['2', 'Reconheça o território', 'Abra Território e rede para consultar unidades, equipes e achados não pessoais.'],
  ['3', 'Transforme uma necessidade em material', 'Use Carteirinhas para gerar lembretes, orientações, busca ativa, notas territoriais ou indicadores.'],
  ['4', 'Leve uma mudança para a equipe', 'Use 5 minutos do território para registrar a situação, decidir o próximo passo e combinar revisão.'],
  ['5', 'Use números para perguntar', 'Abra Indicadores, registre o dado e escreva o que ele pode significar no território e qual ação merece teste.'],
  ['6', 'Apoie educação e comunicação', 'Use Educação em saúde e as opções de impressão/PDF quando precisar levar a informação para fora da tela.'],
  ['7', 'Revise e não acumule', 'Rascunhos temporários desaparecem ao recarregar, fechar a aba ou sair. O que precisar ser registro clínico deve permanecer nos sistemas oficiais.']
];

export const verifiedPublicTeams = [
  { type: 'ESF', ine: '0000001511', name: 'UBS Madre Tereza de Calcutá 01', source: 'CNES / Ministério da Saúde' },
  { type: 'ESF', ine: '0002332566', name: 'UBS Madre Tereza de Calcutá 02', source: 'CNES + relatórios e-SUS do projeto' },
  { type: 'ESF', ine: '0002459353', name: 'UBS Madre Tereza de Calcutá 03', source: 'CNES / Ministério da Saúde' },
  { type: 'ESF', ine: '0002431327', name: 'UBS Madre Tereza de Calcutá 04', source: 'CNES / Ministério da Saúde' },
  { type: 'ESB', ine: '0001809490', name: 'ESB Madre Tereza de Calcutá 01', source: 'CNES / Ministério da Saúde' },
  { type: 'ESB', ine: '0002461722', name: 'ESB Madre Tereza de Calcutá 02', source: 'CNES / Ministério da Saúde' },
  { type: 'ESB', ine: '0002481898', name: 'ESB Madre Tereza 03', source: 'CNES / Ministério da Saúde' },
  { type: 'eMulti', ine: '0002460459', name: 'UBS Madre Tereza eMulti', source: 'CNES / Ministério da Saúde' }
];

export const publicTeamTypes = [
  {
    title: 'Saúde da Família',
    text: 'O CNES público identifica quatro equipes ESF na UBS Madre Tereza de Calcutá: 01, 02, 03 e 04. A composição pública pesquisada inclui medicina, enfermagem, técnico/auxiliar de enfermagem e agentes comunitários de saúde.'
  },
  {
    title: 'Saúde Bucal',
    text: 'O CNES identifica três equipes de Saúde Bucal vinculadas à unidade: ESB 01, ESB 02 e ESB 03, além das funções de cirurgião-dentista/odontólogo e auxiliar em saúde bucal.'
  },
  {
    title: 'eMulti / apoio multiprofissional',
    text: 'O CNES identifica uma eMulti vinculada à UBS. Escalas públicas municipais também mostram fisioterapia, nutrição, psicologia, serviço social e educação física no apoio multiprofissional.'
  },
  {
    title: 'Equipe rural',
    text: 'Escalas públicas municipais distinguem atendimento/equipe rural vinculada à Atenção Primária. O tutorial não atribui número ou INE à equipe rural quando a fonte consultada não o informa.'
  }
];

export const professionalFunctions = [
  'Médico(a) da Estratégia Saúde da Família',
  'Enfermeiro(a) da Estratégia Saúde da Família',
  'Técnico(a) de enfermagem da Estratégia Saúde da Família',
  'Auxiliar de enfermagem',
  'Agente Comunitário de Saúde',
  'Vacinador(a)',
  'Cirurgião-dentista / Odontólogo(a)',
  'Auxiliar em Saúde Bucal',
  'Fisioterapeuta',
  'Nutricionista',
  'Psicólogo(a)',
  'Assistente social',
  'Profissional de Educação Física',
  'Gerência de UBS',
  'Agente administrativo',
  'Assessoria / apoio administrativo',
  'Auxiliar de serviços gerais',
  'Residente de Medicina',
  'Residente de Fisioterapia',
  'Residente de Odontologia',
  'Residente de Nutrição',
  'Residente de Psicologia',
  'Residente de Serviço Social',
  'Residente de Educação Física'
];

export const researchNote = 'As funções e equipes acima foram consolidadas a partir de fontes públicas do CNES/Ministério da Saúde, escalas públicas municipais e relatórios e-SUS já fornecidos ao projeto. O Território Vivo não inventa número, INE ou lotação: a lista de referência pode apresentar equipes confirmadas na fonte pública, enquanto o cadastro operacional do sistema continua sujeito à verificação administrativa adequada.';
