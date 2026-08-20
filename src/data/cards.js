export const cardCategories = [
  { id: 'all', label: 'Todas' },
  { id: 'family', label: 'Família' },
  { id: 'territory', label: 'Território' },
  { id: 'meeting', label: '5 minutos' },
  { id: 'management', label: 'Gestão' }
];

const field = (id, label, type = 'text', extra = {}) => ({ id, label, type, ...extra });

export const cardTemplates = [
  {
    id: 'my-team', category: 'family', title: 'Minha ACS e Minha Equipe',
    description: 'Referência simples para a família saber quem acompanha seu território.',
    defaultCount: 4, fields: [field('note', 'Recado opcional', 'textarea')],
    note: 'Guarde esta carteirinha. Ela mostra quem é sua referência na unidade de saúde.'
  },
  {
    id: 'welcome', category: 'family', title: 'Bem-vindo ao Meu Território',
    description: 'Acolhimento para nova família ou novo morador.',
    defaultCount: 4, fields: [field('family','Nome da família ou responsável'), field('address','Endereço / referência'), field('firstContact','Data do primeiro contato','date'), field('note','Recado para a família','textarea')],
    note: 'Conhecer sua família ajuda a equipe a planejar melhor o cuidado.'
  },
  {
    id: 'appointment', category: 'family', title: 'Meu Próximo Atendimento',
    description: 'Lembrete de dia, hora, local e serviço.', defaultCount: 8,
    fields: [field('name','Nome'), field('date','Dia','date'), field('time','Hora','time'), field('service','Com quem / serviço'), field('note','Recado ou preparo','textarea')],
    note: 'Leve seus documentos e os itens orientados pela equipe.'
  },
  {
    id: 'appointments', category: 'family', title: 'Meus Agendamentos',
    description: 'Espaço compacto para registrar até três compromissos.', defaultCount: 4,
    fields: [field('name','Nome'), field('item1','1º agendamento'), field('item2','2º agendamento'), field('item3','3º agendamento'), field('note','Observação','textarea')],
    note: 'Em caso de dúvida, confirme a informação com sua unidade de saúde.'
  },
  {
    id: 'prepare-visit', category: 'family', title: 'Prepare-se para seu Atendimento',
    description: 'Checklist simples para reduzir esquecimentos.', defaultCount: 4,
    fields: [field('service','Atendimento / serviço'), field('bring','O que levar','textarea'), field('prepare','Como se preparar','textarea')],
    note: 'Estas orientações não substituem instruções específicas da equipe.'
  },
  {
    id: 'update-family', category: 'family', title: 'Atualize sua Família',
    description: 'Lembrete para comunicar mudanças importantes à ACS.', defaultCount: 8,
    fields: [field('reference','Nome / família'), field('what','O que mudou','select',{ options:['Endereço','Telefone','Pessoas da casa','Nascimento','Gestação','Mudança de território','Outra mudança'] }), field('note','Observação','textarea')],
    note: 'Avise sua ACS quando houver mudança de endereço, telefone ou pessoas que moram na casa.'
  },
  {
    id: 'territory-change', category: 'territory', title: 'O que Mudou no Território?',
    description: 'Registro breve de mudança relevante, sem recadastro completo.', defaultCount: 4,
    fields: [field('where','Quem / onde'), field('what','O que mudou','textarea'), field('kind','Tipo','select',{ options:['Novo morador ou família','Mudança de endereço','Imóvel fechado/abandonado','Novo comércio/serviço/equipamento','Risco ambiental/sanitário','Barreira de acesso','Novo parceiro/potencialidade','Dado cadastral para atualizar'] }), field('action','Encaminhamento sugerido','textarea')],
    note: 'Registre somente o necessário para orientar a próxima ação.'
  },
  {
    id: 'priority', category: 'territory', title: 'Quem Precisa de um Olhar Prioritário?',
    description: 'Sinalização breve para discussão da equipe.', defaultCount: 4,
    fields: [field('reference','Pessoa / família / referência'), field('reason','Motivo','select',{ options:['Pessoa idosa com dificuldade','Pessoa com deficiência/barreira funcional','Gestante ou puérpera','Criança/adolescente em vulnerabilidade','Condição crônica sem acompanhamento','Saúde mental/álcool/tabaco','Barreira de acesso','Necessita visita domiciliar','Outra necessidade'] }), field('now','O que precisa ser feito agora','textarea'), field('responsible','Responsável pelo retorno')],
    note: 'Não é diagnóstico. É uma sinalização para organizar o cuidado.'
  },
  {
    id: 'risk-resource', category: 'territory', title: 'Risco, Recurso ou Potencialidade?',
    description: 'Classifique um achado territorial e pense no próximo passo.', defaultCount: 4,
    fields: [field('location','Local / referência'), field('classification','Classificação','select',{ options:['Risco','Ponto de atenção','Potencialidade','Recurso da rede','Precisa articulação intersetorial'] }), field('description','O que foi observado','textarea'), field('action','Possível ação / parceria','textarea')],
    note: 'Nem todo achado é problema: recursos e potencialidades também devem circular na equipe.'
  },
  {
    id: 'quick-note', category: 'territory', title: 'Nota Rápida do ACS',
    description: 'Memória temporária de campo para levar uma informação à equipe.', defaultCount: 8,
    fields: [field('reference','Quem / onde'), field('note','Nota','textarea'), field('next','Próximo passo')],
    note: 'Use o mínimo necessário. Não transforme a nota em prontuário paralelo.'
  },
  {
    id: 'needs-update', category: 'territory', title: 'Cadastro que Precisa Atualizar',
    description: 'Lembrete de uma lacuna cadastral encontrada no trabalho.', defaultCount: 8,
    fields: [field('reference','Pessoa / família / domicílio'), field('missing','O que precisa atualizar'), field('route','Como resolver')],
    note: 'Atualize no sistema oficial quando houver oportunidade adequada.'
  },
  {
    id: 'active-search', category: 'territory', title: 'Busca Ativa',
    description: 'Organize uma pendência concreta de localização ou acompanhamento.', defaultCount: 4,
    fields: [field('reference','Pessoa / família / referência'), field('reason','Motivo'), field('attempt','Tentativa / contato realizado','textarea'), field('next','Próximo passo','textarea')],
    note: 'Registre somente o necessário para que a pendência não se perca.'
  },
  {
    id: 'five-note', category: 'meeting', title: 'Nota para os 5 Minutos',
    description: 'Leve um achado para decisão rápida da equipe.', defaultCount: 4,
    fields: [field('where','Quem / onde'), field('finding','Achado / mudança','textarea'), field('decision','O que precisa ser decidido','textarea')],
    note: 'Um achado útil deve terminar em decisão, responsável e reavaliação.'
  },
  {
    id: 'decision', category: 'meeting', title: 'Decisão dos 5 Minutos',
    description: 'Registre o que foi decidido e quando será revisto.', defaultCount: 4,
    fields: [field('finding','Achado / situação','textarea'), field('decision','Decisão da equipe','textarea'), field('responsible','Responsável'), field('review','Revisar quando','date')],
    note: 'A informação ganha sentido quando volta ao território como ação.'
  },
  {
    id: 'system-territory', category: 'management', title: 'Sistema × Território',
    description: 'Compare o registro com o que a equipe observa na prática.', defaultCount: 2,
    fields: [field('system','O sistema mostra','textarea'), field('territory','No território observamos','textarea'), field('unknown','O que ainda não sabemos','textarea'), field('action','Próxima ação','textarea')],
    note: 'Não informado não significa inexistente. A lacuna também orienta o trabalho.'
  },
  {
    id: 'problem-action-result', category: 'management', title: 'Problema → Ação → Resultado',
    description: 'Acompanhe uma intervenção territorial sem criar relatório longo.', defaultCount: 2,
    fields: [field('problem','Problema / situação','textarea'), field('action','Ação realizada','textarea'), field('result','Resultado observado','textarea'), field('review','Próxima revisão','date')],
    note: 'Avalie a ferramenta e a ação, não o trabalhador.'
  }
];

export function getCardTemplate(id) {
  return cardTemplates.find((template) => template.id === id) || null;
}
