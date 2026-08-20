export const educationTopics = [
  {
    id: 'pressure',
    category: 'Pressão arterial',
    title: 'Mapa da pressão',
    summary: 'Guia simples para conversar sobre medida da pressão e acompanhamento.',
    reviewedOn: '2026-08-20',
    sources: [
      { label: 'Ministério da Saúde — Linha de Cuidado da Hipertensão Arterial Sistêmica', url: 'https://linhasdecuidado.saude.gov.br/portal/hipertensao-arterial-sistemica-%28HAS%29-no-adulto/unidade-de-atencao-primaria/has-cronica/' },
      { label: 'Diretriz Brasileira de Hipertensão Arterial 2025', url: 'https://abccardiol.org/article/diretriz-brasileira-de-hipertensao-arterial-2025/' }
    ],
    blocks: [
      { title: 'Antes de medir', items: ['Descanse alguns minutos.', 'Sente-se com costas apoiadas e pés no chão.', 'Evite conversar durante a medida.', 'Use manguito adequado ao braço e aparelho confiável.'] },
      { title: 'Leitura simplificada para orientação', items: ['Valores até 120/80 mmHg são usados como referência de pressão normal no material do Ministério da Saúde.', 'Valores persistentemente acima da faixa esperada precisam ser avaliados pela equipe.', 'O diagnóstico de hipertensão não deve ser feito por uma medida isolada.'] },
      { title: 'Procure avaliação', items: ['Se as medidas estiverem repetidamente elevadas.', 'Se houver dúvida sobre a técnica ou o aparelho.', 'Se a pessoa apresentar sintomas importantes ou situação de urgência.'] }
    ],
    disclaimer: 'Material educativo. Não substitui avaliação clínica, diagnóstico ou conduta individual.'
  },
  {
    id: 'insulin',
    category: 'Diabetes',
    title: 'Como usar insulina com segurança',
    summary: 'Passos de segurança para apoiar a orientação feita pela equipe.',
    reviewedOn: '2026-08-20',
    sources: [
      { label: 'Ministério da Saúde — Linha de Cuidado do Diabetes Mellitus tipo 2 / Insulinoterapia', url: 'https://linhasdecuidado.saude.gov.br/portal/diabetes-mellitus-tipo-2-(DM2)-no-adulto/unidade-de-atencao-primaria/cuidados-com-a-insulinoterapia/' }
    ],
    blocks: [
      { title: 'Antes da aplicação', items: ['Confira o tipo de insulina e a dose prescrita.', 'Higienize as mãos.', 'Separe o material e confira o dispositivo.', 'Faça rodízio dos locais de aplicação conforme orientação recebida.'] },
      { title: 'Com caneta', items: ['Coloque uma agulha nova.', 'Faça o teste de fluxo conforme orientação do fabricante.', 'Selecione a dose prescrita.', 'Aplique no tecido subcutâneo e mantenha a agulha no local por pelo menos 10 segundos antes de retirar.'] },
      { title: 'Com seringa', items: ['Use seringa e agulha adequadas.', 'Prepare somente a dose prescrita.', 'Aplique de forma contínua no tecido subcutâneo.', 'Mantenha a agulha no local por alguns segundos antes de retirar.'] },
      { title: 'Depois', items: ['Não reutilize agulhas ou seringas.', 'Descarte perfurocortantes em recipiente adequado.', 'Armazene a insulina conforme orientação do fabricante e da equipe.', 'Não altere a dose por conta própria.'] }
    ],
    disclaimer: 'Material educativo. Dose, tipo de insulina, técnica e ajustes devem seguir prescrição e orientação individual.'
  }
];

export function getEducationTopic(id) {
  return educationTopics.find((topic) => topic.id === id) || null;
}
