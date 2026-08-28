const assetUrl = (filename) => new URL(`../assets/prescription-support/${filename}`, import.meta.url).href;

const localVisual = (filename) => ({ image: assetUrl(filename) });
const attributedVisual = (icon) => ({ icon });

export const prescriptionRoutes = Object.freeze([
  { id: 'oral', label: 'Via oral', hint: 'Tomar pela boca', ...localVisual('oral.png') },
  { id: 'injection', label: 'Injeção', hint: 'Uso injetável', ...localVisual('injection.png') },
  { id: 'topical', label: 'Uso na pele', hint: 'Aplicar na pele', ...localVisual('topical.png') },
  { id: 'drops', label: 'Gotas', hint: 'Administrar em gotas', ...localVisual('drops.png') },
  { id: 'inhalation', label: 'Inalação', hint: 'Usar por inalação', ...localVisual('inhalation.png') },
  { id: 'eye-drops', label: 'Gotas nos olhos', hint: 'Uso oftálmico', ...localVisual('eye-drops.png') },
  { id: 'ear-drops', label: 'Gotas no ouvido', hint: 'Uso otológico', ...localVisual('ear-drops.png') },
  { id: 'nasal-spray', label: 'Uso nasal', hint: 'Aplicar no nariz', ...localVisual('nasal-spray.png') }
]);

export const prescriptionSchedules = Object.freeze([
  { id: 'morning', label: 'Manhã', hint: 'No começo do dia', ...localVisual('morning.png') },
  { id: 'lunch', label: 'Almoço', hint: 'Próximo ao almoço', ...localVisual('lunch.png') },
  { id: 'evening', label: 'Noite', hint: 'No período da noite', ...localVisual('evening.png') },
  { id: 'bedtime', label: 'Antes de dormir', hint: 'Na hora de deitar', ...localVisual('bedtime.png') },
  { id: 'before-breakfast', label: 'Antes do café da manhã', hint: 'Antes de comer de manhã', ...localVisual('before-breakfast.png') },
  { id: 'after-breakfast', label: 'Depois do café da manhã', hint: 'Depois de comer de manhã', ...localVisual('after-breakfast.png') },
  { id: 'before-lunch', label: 'Antes do almoço', hint: 'Antes de almoçar', ...localVisual('before-meal.png') },
  { id: 'after-lunch', label: 'Depois do almoço', hint: 'Depois de almoçar', ...localVisual('after-meal.png') },
  { id: 'before-dinner', label: 'Antes do jantar', hint: 'Antes de jantar', ...localVisual('before-dinner.png') },
  { id: 'after-dinner', label: 'Depois do jantar', hint: 'Depois de jantar', ...localVisual('after-dinner.png') },
  { id: 'fasting', label: 'Em jejum', hint: 'Sem comer antes', ...localVisual('fasting.png') }
]);

export const prescriptionSupportCategories = Object.freeze([
  { id: 'combined', label: 'Modelos prontos', description: 'Atalhos que preenchem somente via, período e observação. Medicamento, dose e duração continuam obrigatórios.' },
  { id: 'indigenous', label: 'Combinados Povos Indígenas', description: 'Todos os períodos da lista geral em cenas respeitosas, que precisam ser validadas com cada comunidade.' },
  { id: 'routes', label: 'Via de uso', description: 'Formas de administração do medicamento.' },
  { id: 'reasons', label: 'Motivo do uso', description: 'Apoio para explicar a finalidade já definida na prescrição.' },
  { id: 'times', label: 'Horários', description: 'Períodos e intervalos; o horário exato continua escrito.' },
  { id: 'characters', label: 'Personagens', description: 'Públicos que podem ajudar a personalizar a orientação.' },
  { id: 'associations', label: 'Associações', description: 'Água, alimentação, jejum, companhia e cuidados associados.' },
  { id: 'taper', label: 'Retirada de corticoide(s)', description: 'Somente apoio visual; a redução exata deve estar escrita.' },
  { id: 'other', label: 'Outros', description: 'Visita, vacina, alerta e outros apoios de cuidado.' },
  { id: 'utilities', label: 'Utilitários', description: 'Calendário, relógio, local e documentos.' }
]);

const combined = [
  ['combined-oral-morning', 'Remédio pela boca — manhã', 'Via oral + manhã', 'oral', 'morning', '', true],
  ['combined-oral-lunch', 'Remédio pela boca — almoço', 'Via oral + almoço', 'oral', 'lunch', '', true],
  ['combined-oral-evening', 'Remédio pela boca — noite', 'Via oral + noite', 'oral', 'evening', '', true],
  ['combined-oral-bedtime', 'Remédio pela boca — ao deitar', 'Via oral + antes de dormir', 'oral', 'bedtime', '', true],
  ['combined-before-breakfast', 'Antes do café da manhã', 'Somente quando estiver escrito na receita', 'oral', 'before-breakfast', '', false],
  ['combined-after-breakfast', 'Depois do café da manhã', 'Somente quando estiver escrito na receita', 'oral', 'after-breakfast', '', false],
  ['combined-before-lunch', 'Antes do almoço', 'Somente quando estiver escrito na receita', 'oral', 'before-lunch', '', false],
  ['combined-after-lunch', 'Depois do almoço', 'Somente quando estiver escrito na receita', 'oral', 'after-lunch', '', false],
  ['combined-before-dinner', 'Antes do jantar', 'Somente quando estiver escrito na receita', 'oral', 'before-dinner', '', false],
  ['combined-after-dinner', 'Depois do jantar', 'Somente quando estiver escrito na receita', 'oral', 'after-dinner', '', false],
  ['combined-fasting', 'Em jejum', 'Somente quando estiver escrito na receita', 'oral', 'fasting', '', false],
  ['combined-with-food', 'Junto com alimento', 'Somente quando estiver escrito na receita', 'oral', 'lunch', 'tomar junto com alimento', false],
  ['combined-drops-morning', 'Gotas — manhã', 'Gotas + manhã', 'drops', 'morning', '', true],
  ['combined-drops-lunch', 'Gotas — almoço', 'Gotas + almoço', 'drops', 'lunch', '', false],
  ['combined-drops-evening', 'Gotas — noite', 'Gotas + noite', 'drops', 'evening', '', false],
  ['combined-drops-bedtime', 'Gotas — ao deitar', 'Gotas + antes de dormir', 'drops', 'bedtime', '', false],
  ['combined-eye-morning', 'Colírio — manhã', 'Gotas nos olhos + manhã', 'eye-drops', 'morning', '', true],
  ['combined-eye-evening', 'Colírio — noite', 'Gotas nos olhos + noite', 'eye-drops', 'evening', '', false],
  ['combined-eye-bedtime', 'Colírio — ao deitar', 'Gotas nos olhos + antes de dormir', 'eye-drops', 'bedtime', '', false],
  ['combined-ear-morning', 'Gotas no ouvido — manhã', 'Uso no ouvido + manhã', 'ear-drops', 'morning', '', false],
  ['combined-ear-evening', 'Gotas no ouvido — noite', 'Uso no ouvido + noite', 'ear-drops', 'evening', '', false],
  ['combined-nasal-morning', 'Spray nasal — manhã', 'Uso nasal + manhã', 'nasal-spray', 'morning', '', true],
  ['combined-nasal-evening', 'Spray nasal — noite', 'Uso nasal + noite', 'nasal-spray', 'evening', '', false],
  ['combined-inhalation-morning', 'Inalação — manhã', 'Via inalatória + manhã', 'inhalation', 'morning', '', true],
  ['combined-inhalation-evening', 'Inalação — noite', 'Via inalatória + noite', 'inhalation', 'evening', '', false],
  ['combined-topical-morning', 'Na pele — manhã', 'Uso na pele + manhã', 'topical', 'morning', '', false],
  ['combined-topical-night', 'Na pele — noite', 'Uso na pele + noite', 'topical', 'evening', '', true],
  ['combined-topical-bedtime', 'Na pele — ao deitar', 'Uso na pele + antes de dormir', 'topical', 'bedtime', '', false]
].map(([id, label, hint, route, schedule, observation, featured]) => ({
  id, category: 'combined', label, hint, action: 'preset', route, schedule, observation, featured,
  images: [
    prescriptionRoutes.find((item) => item.id === route)?.image,
    prescriptionSchedules.find((item) => item.id === schedule)?.image
  ].filter(Boolean)
}));

export const prescriptionQuickTemplates = Object.freeze(combined.filter((item) => item.featured));

const routeItems = prescriptionRoutes.map((item) => ({ ...item, category: 'routes', action: 'route' }));
const timeItems = [
  ...prescriptionSchedules.map((item) => ({ ...item, category: 'times', action: 'schedule' })),
  ...[
    ['every-6-hours', 'A cada 6 horas', 'Escrever também a duração', 'a cada 6 horas'],
    ['every-8-hours', 'A cada 8 horas', 'Escrever também a duração', 'a cada 8 horas'],
    ['every-12-hours', 'A cada 12 horas', 'Escrever também a duração', 'a cada 12 horas'],
    ['every-24-hours', 'A cada 24 horas', 'Escrever também a duração', 'a cada 24 horas'],
    ['thirty-minutes', '30 minutos', 'Informar antes ou depois de quê', '30 minutos']
  ].map(([id, label, hint, observation]) => ({ id, category: 'times', label, hint, action: 'observation', observation, ...attributedVisual('clock') }))
];

const indigenousScheduleAssetById = Object.freeze({
  morning: 'indigenous-morning.png',
  lunch: 'indigenous-lunch.png',
  evening: 'indigenous-evening.png',
  bedtime: 'indigenous-night.png',
  'before-breakfast': 'indigenous-before-breakfast.png',
  'after-breakfast': 'indigenous-after-breakfast.png',
  'before-lunch': 'indigenous-before-lunch.png',
  'after-lunch': 'indigenous-after-lunch.png',
  'before-dinner': 'indigenous-before-dinner.png',
  'after-dinner': 'indigenous-after-dinner.png',
  fasting: 'indigenous-fasting.png'
});

const indigenousScheduleItems = prescriptionSchedules.map((item) => ({
  id: `indigenous-${item.id}`,
  category: 'indigenous',
  label: item.label,
  hint: 'Validar com a comunidade',
  action: 'support',
  ...localVisual(indigenousScheduleAssetById[item.id])
}));

const supportItems = [
  ...indigenousScheduleItems,

  { id: 'pain', category: 'reasons', label: 'Dor ou desconforto', hint: 'Finalidade já prescrita', action: 'support', ...localVisual('pain.png') },
  { id: 'fever', category: 'reasons', label: 'Febre', hint: 'Finalidade já prescrita', action: 'support', ...localVisual('fever.png') },
  { id: 'cough', category: 'reasons', label: 'Tosse', hint: 'Finalidade já prescrita', action: 'support', ...localVisual('cough.png') },
  { id: 'stomach-discomfort', category: 'reasons', label: 'Desconforto abdominal', hint: 'Finalidade já prescrita', action: 'support', ...localVisual('stomach-discomfort.png') },
  { id: 'hypertension', category: 'reasons', label: 'Pressão arterial', hint: 'Cuidado relacionado', action: 'support', ...attributedVisual('hypertension') },
  { id: 'diabetes', category: 'reasons', label: 'Diabetes', hint: 'Cuidado relacionado', action: 'support', ...attributedVisual('diabetes') },
  { id: 'dressing', category: 'reasons', label: 'Ferida ou curativo', hint: 'Cuidado relacionado', action: 'support', ...attributedVisual('dressing') },
  { id: 'dentist', category: 'reasons', label: 'Saúde bucal', hint: 'Cuidado relacionado', action: 'support', ...attributedVisual('dentist') },

  { id: 'person', category: 'characters', label: 'Pessoa adulta', hint: 'Público da orientação', action: 'support', ...attributedVisual('person') },
  { id: 'child', category: 'characters', label: 'Criança', hint: 'Público da orientação', action: 'support', ...attributedVisual('child') },
  { id: 'elderly', category: 'characters', label: 'Pessoa idosa', hint: 'Público da orientação', action: 'support', ...attributedVisual('elderly') },
  { id: 'pregnant', category: 'characters', label: 'Gestante', hint: 'Público da orientação', action: 'support', ...attributedVisual('pregnant') },
  { id: 'family', category: 'characters', label: 'Família', hint: 'Rede de cuidado', action: 'support', ...attributedVisual('family') },

  { id: 'water', category: 'associations', label: 'Tomar com água', hint: 'Somente se estiver prescrito', action: 'support', ...attributedVisual('water') },
  { id: 'fasting-support', category: 'associations', label: 'Jejum', hint: 'Somente se estiver prescrito', action: 'support', ...attributedVisual('fasting') },
  { id: 'medicine', category: 'associations', label: 'Medicamento', hint: 'Apoio geral', action: 'support', ...attributedVisual('medicine') },
  { id: 'avoid-alcohol', category: 'associations', label: 'Evitar álcool', hint: 'Somente se estiver orientado', action: 'support', ...localVisual('avoid-alcohol.png') },
  { id: 'companion', category: 'associations', label: 'Pessoa acompanhante', hint: 'Rede de apoio', action: 'support', ...attributedVisual('companion') },
  { id: 'with-food', category: 'associations', label: 'Tomar com alimento', hint: 'Somente se estiver prescrito', action: 'support', ...localVisual('lunch.png') },

  { id: 'gradual-reduction', category: 'taper', label: 'Redução gradual', hint: 'Escrever todas as etapas', action: 'support', ...localVisual('gradual-reduction.png') },

  { id: 'visit', category: 'other', label: 'Visita domiciliar', hint: 'Apoio ao cuidado', action: 'support', ...attributedVisual('visit') },
  { id: 'vaccine', category: 'other', label: 'Vacina', hint: 'Apoio ao cuidado', action: 'support', ...attributedVisual('vaccine') },
  { id: 'barrier', category: 'other', label: 'Barreira de acesso', hint: 'Atenção à acessibilidade', action: 'support', ...attributedVisual('barrier') },
  { id: 'warning', category: 'other', label: 'Atenção', hint: 'Orientação importante', action: 'support', ...attributedVisual('warning') },
  { id: 'home', category: 'other', label: 'Casa', hint: 'Uso em domicílio', action: 'support', ...attributedVisual('home') },
  { id: 'group', category: 'other', label: 'Grupo', hint: 'Atividade coletiva', action: 'support', ...attributedVisual('group') },

  { id: 'calendar', category: 'utilities', label: 'Calendário', hint: 'Data ou duração', action: 'support', ...attributedVisual('calendar') },
  { id: 'clock', category: 'utilities', label: 'Relógio', hint: 'Horário ou intervalo', action: 'support', ...attributedVisual('clock') },
  { id: 'location', category: 'utilities', label: 'Local', hint: 'Lugar de cuidado', action: 'support', ...attributedVisual('location') },
  { id: 'document', category: 'utilities', label: 'Documento', hint: 'Receita ou orientação', action: 'support', ...attributedVisual('document') }
];

export const prescriptionSupportItems = Object.freeze([...combined, ...routeItems, ...timeItems, ...supportItems]);

const itemById = new Map(prescriptionSupportItems.map((item) => [item.id, item]));

export function getPrescriptionRoute(id) {
  return prescriptionRoutes.find((item) => item.id === id) || prescriptionRoutes[0];
}

export function getPrescriptionSchedule(id) {
  return prescriptionSchedules.find((item) => item.id === id) || prescriptionSchedules[0];
}

export function getPrescriptionSupportItem(id) {
  return itemById.get(id) || null;
}

export function prescriptionSupportItemsFor(category, query = '') {
  const normalized = String(query || '').trim().toLocaleLowerCase('pt-BR');
  return prescriptionSupportItems.filter((item) => {
    if (category && item.category !== category) return false;
    if (!normalized) return true;
    return `${item.label} ${item.hint || ''}`.toLocaleLowerCase('pt-BR').includes(normalized);
  });
}
