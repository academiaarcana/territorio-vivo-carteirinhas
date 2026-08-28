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
  { id: 'bedtime', label: 'Antes de dormir', hint: 'Na hora de deitar', ...localVisual('bedtime.png') }
]);

export const prescriptionSupportCategories = Object.freeze([
  { id: 'combined', label: 'Combinados', description: 'Atalhos que preenchem via, período e observação.' },
  { id: 'indigenous', label: 'Combinados Povos Indígenas', description: 'Cenas respeitosas que precisam ser validadas com cada comunidade.' },
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
  ['combined-oral-morning', 'Comprimido pela manhã', 'Via oral + manhã', 'oral', 'morning', ''],
  ['combined-oral-lunch', 'Comprimido no almoço', 'Via oral + almoço', 'oral', 'lunch', ''],
  ['combined-oral-evening', 'Comprimido à noite', 'Via oral + noite', 'oral', 'evening', ''],
  ['combined-oral-bedtime', 'Comprimido antes de dormir', 'Via oral + hora de deitar', 'oral', 'bedtime', ''],
  ['combined-before-breakfast', 'Antes do café da manhã', 'Via oral • conferir intervalo', 'oral', 'morning', 'antes do café da manhã', 'meal-before-breakfast.webp'],
  ['combined-after-breakfast', 'Depois do café da manhã', 'Via oral • conferir intervalo', 'oral', 'morning', 'depois do café da manhã', 'meal-after-breakfast.webp'],
  ['combined-before-lunch', 'Antes do almoço', 'Via oral • conferir intervalo', 'oral', 'lunch', 'antes do almoço', 'meal-before-lunch.webp'],
  ['combined-after-lunch', 'Depois do almoço', 'Via oral • conferir intervalo', 'oral', 'lunch', 'depois do almoço', 'meal-after-lunch.webp'],
  ['combined-before-dinner', 'Antes do jantar', 'Via oral • conferir intervalo', 'oral', 'evening', 'antes do jantar', 'meal-before-dinner.webp'],
  ['combined-after-dinner', 'Depois do jantar', 'Via oral • conferir intervalo', 'oral', 'evening', 'depois do jantar', 'meal-after-dinner.webp'],
  ['combined-drops-morning', 'Gotas pela manhã', 'Gotas + manhã', 'drops', 'morning', ''],
  ['combined-topical-night', 'Aplicar à noite', 'Uso na pele + noite', 'topical', 'evening', '']
].map(([id, label, hint, route, schedule, observation, imageFile]) => ({
  id, category: 'combined', label, hint, action: 'preset', route, schedule, observation,
  image: imageFile ? assetUrl(imageFile) : prescriptionRoutes.find((item) => item.id === route)?.image
}));

const combinedMealAssociations = [
  { id: 'combined-with-food', category: 'combined', label: 'Tomar com a refeição', hint: 'Somente se estiver prescrito', action: 'observation', observation: 'junto com a refeição', ...localVisual('meal-with-food.webp') },
  { id: 'combined-fasting', category: 'combined', label: 'Tomar em jejum', hint: 'Somente se estiver prescrito', action: 'observation', observation: 'em jejum', ...localVisual('meal-fasting.webp') }
];

const indigenousMealPresets = [
  ['indigenous-before-breakfast', 'Antes do café da manhã', 'Validar com a comunidade', 'morning', 'antes do café da manhã', 'indigenous-before-breakfast.webp'],
  ['indigenous-after-breakfast', 'Depois do café da manhã', 'Validar com a comunidade', 'morning', 'depois do café da manhã', 'indigenous-after-breakfast.webp'],
  ['indigenous-before-lunch', 'Antes do almoço', 'Validar com a comunidade', 'lunch', 'antes do almoço', 'indigenous-before-lunch.webp'],
  ['indigenous-after-lunch', 'Depois do almoço', 'Validar com a comunidade', 'lunch', 'depois do almoço', 'indigenous-after-lunch.webp'],
  ['indigenous-before-dinner', 'Antes do jantar', 'Validar com a comunidade', 'evening', 'antes do jantar', 'indigenous-before-dinner.webp'],
  ['indigenous-after-dinner', 'Depois do jantar', 'Validar com a comunidade', 'evening', 'depois do jantar', 'indigenous-after-dinner.webp']
].map(([id, label, hint, schedule, observation, imageFile]) => ({
  id, category: 'indigenous', label, hint, action: 'preset', route: 'oral', schedule, observation, ...localVisual(imageFile)
}));

const indigenousMealAssociations = [
  { id: 'indigenous-with-food', category: 'indigenous', label: 'Tomar com a refeição', hint: 'Validar com a comunidade', action: 'observation', observation: 'junto com a refeição', ...localVisual('indigenous-with-food.webp') },
  { id: 'indigenous-fasting', category: 'indigenous', label: 'Tomar em jejum', hint: 'Validar com a comunidade', action: 'observation', observation: 'em jejum', ...localVisual('indigenous-fasting.webp') }
];

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

const supportItems = [
  { id: 'indigenous-morning', category: 'indigenous', label: 'Manhã com alimento', hint: 'Validar com a comunidade', action: 'support', ...localVisual('indigenous-morning.png') },
  { id: 'indigenous-night', category: 'indigenous', label: 'Noite e descanso', hint: 'Validar com a comunidade', action: 'support', ...localVisual('indigenous-night.png') },

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
  { id: 'fasting', category: 'associations', label: 'Jejum', hint: 'Somente se estiver prescrito', action: 'support', ...localVisual('meal-fasting.webp') },
  { id: 'medicine', category: 'associations', label: 'Medicamento', hint: 'Apoio geral', action: 'support', ...attributedVisual('medicine') },
  { id: 'avoid-alcohol', category: 'associations', label: 'Evitar álcool', hint: 'Somente se estiver orientado', action: 'support', ...localVisual('avoid-alcohol.png') },
  { id: 'companion', category: 'associations', label: 'Pessoa acompanhante', hint: 'Rede de apoio', action: 'support', ...attributedVisual('companion') },
  { id: 'with-food', category: 'associations', label: 'Tomar com alimento', hint: 'Somente se estiver prescrito', action: 'support', ...localVisual('meal-with-food.webp') },

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

export const prescriptionSupportItems = Object.freeze([
  ...combined,
  ...combinedMealAssociations,
  ...indigenousMealPresets,
  ...indigenousMealAssociations,
  ...routeItems,
  ...timeItems,
  ...supportItems
]);

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
