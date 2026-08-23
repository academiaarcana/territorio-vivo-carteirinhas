// Biblioteca visual única do Território Vivo.
// Todos os pictogramas exibidos pela aplicação usam recursos GRATUITOS do Flaticon
// e permanecem sujeitos à atribuição obrigatória registrada no projeto.
const flaticonAssets = {
  person: { iconId: '13695871', author: 'nahumam', source: 'https://www.flaticon.com/br/icone-gratis/pessoa_13695871' },
  family: { iconId: '18408870', author: 'bsd', source: 'https://www.flaticon.com/br/icone-gratis/familia_18408870' },
  child: { iconId: '4532153', author: 'Good Ware', source: 'https://www.flaticon.com/br/icone-gratis/recem-nascido_4532153' },
  elderly: { iconId: '5814218', author: 'Witdhawaty', source: 'https://www.flaticon.com/br/icone-gratis/geriatria_5814218' },
  pregnant: { iconId: '10523012', author: 'shin_icons', source: 'https://www.flaticon.com/br/icone-gratis/gravida_10523012' },
  calendar: { iconId: '1252294', author: 'Pixel perfect', source: 'https://www.flaticon.com/br/icone-gratis/calendario_1252294' },
  clock: { iconId: '13071506', author: 'IconBaandar', source: 'https://www.flaticon.com/br/icone-gratis/relogio_13071506' },
  vaccine: { iconId: '3027535', author: 'mavadee', source: 'https://www.flaticon.com/br/icone-gratis/vacina_3027535' },
  dentist: { iconId: '5712027', author: 'kmg design', source: 'https://www.flaticon.com/br/icone-gratis/dentista_5712027' },
  exam: { iconId: '4853471', author: 'Freepik', source: 'https://www.flaticon.com/br/icone-gratis/teste-de-sangue_4853471' },
  dressing: { iconId: '2869769', author: 'nawicon', source: 'https://www.flaticon.com/br/icone-gratis/curativo_2869769' },
  medicine: { iconId: '4355923', author: 'Andy Horvath', source: 'https://www.flaticon.com/br/icone-gratis/medicamento_4355923' },
  consultation: { iconId: '7381105', author: 'Freepik', source: 'https://www.flaticon.com/br/icone-gratis/consulta-medica_7381105' },
  visit: { iconId: '12024693', author: 'kliwir art', source: 'https://www.flaticon.com/free-icon/home-care_12024693' },
  fasting: { iconId: '10008842', author: 'Freepik', source: 'https://www.flaticon.com/br/icone-gratis/jejum-intermitente_10008842' },
  water: { iconId: '14777315', author: 'Freepik', source: 'https://www.flaticon.com/br/icone-gratis/beber-agua_14777315' },
  susCard: { iconId: '16324772', author: 'Vectorslab', source: 'https://www.flaticon.com/br/icone-gratis/cartao-de-saude_16324772' },
  results: { iconId: '6655425', author: 'wanicon', source: 'https://www.flaticon.com/free-icon/medical-report_6655425' },
  document: { iconId: '8898131', author: 'JM Graphic', source: 'https://www.flaticon.com/br/icone-gratis/identidade_8898131' },
  companion: { iconId: '7070894', author: 'Freepik', source: 'https://www.flaticon.com/free-icon/caregiver_7070894' },
  early: { iconId: '13071506', author: 'IconBaandar', source: 'https://www.flaticon.com/br/icone-gratis/relogio_13071506' },
  clinic: { iconId: '9931784', author: 'Fathema Khanom', source: 'https://www.flaticon.com/br/icone-gratis/hospital_9931784' },
  school: { iconId: '13334847', author: 'Karyative', source: 'https://www.flaticon.com/br/icone-gratis/edificio-escolar_13334847' },
  home: { iconId: '11453302', author: 'VectorPortal', source: 'https://www.flaticon.com/br/icone-gratis/casas_11453302' },
  group: { iconId: '4766735', author: 'Vector Stall', source: 'https://www.flaticon.com/br/icone-gratis/reuniao_4766735' },
  phone: { iconId: '11680095', author: 'lakonicon', source: 'https://www.flaticon.com/br/icone-gratis/telefone-de-chamada_11680095' },
  location: { iconId: '1397897', author: 'turkkub', source: 'https://www.flaticon.com/br/icone-gratis/marcador_1397897' },
  warning: { iconId: '7783023', author: 'Yuju', source: 'https://www.flaticon.com/br/icone-gratis/alertas_7783023' },
  barrier: { iconId: '1964917', author: 'photo3idea_studio', source: 'https://www.flaticon.com/br/icone-gratis/barreira_1964917' },
  partner: { iconId: '1291247', author: 'cubydesign', source: 'https://www.flaticon.com/br/icone-gratis/aperto-de-mao_1291247' },
  hypertension: { iconId: '10376201', author: 'BizzBox', source: 'https://www.flaticon.com/br/icone-gratis/pressao-arterial_10376201' },
  diabetes: { iconId: '12310381', author: 'Elzicon', source: 'https://www.flaticon.com/br/icone-gratis/teste-de-diabetes_12310381' },
  population: { iconId: '3526131', author: 'GOWI', source: 'https://www.flaticon.com/br/icone-gratis/populacao_3526131' },
  action: { iconId: '7468981', author: 'Us and Up', source: 'https://www.flaticon.com/free-icon/checklist_7468981' }
};

function flaticonPngUrl(iconId) {
  const id = String(iconId);
  return `https://cdn-icons-png.flaticon.com/512/${id.slice(0, -3)}/${id}.png`;
}

export const visualSupportCatalog = [
  { id: 'vaccine', label: 'Vacina', category: 'atendimento', keywords: ['vacina', 'vacinacao', 'imunizacao', 'imunizar'] },
  { id: 'dentist', label: 'Dentista', category: 'atendimento', keywords: ['dentista', 'odontologia', 'odontologico', 'saude bucal'] },
  { id: 'exam', label: 'Exame ou coleta', category: 'atendimento', keywords: ['exame', 'coleta', 'laboratorio', 'sangue', 'teste'] },
  { id: 'pregnant', label: 'Pré-natal / gestante', category: 'publico', keywords: ['pre-natal', 'prenatal', 'gestante', 'gravida', 'puerpera'] },
  { id: 'dressing', label: 'Curativo', category: 'atendimento', keywords: ['curativo', 'ferida', 'troca de curativo'] },
  { id: 'medicine', label: 'Medicamento', category: 'preparo', keywords: ['remedio', 'medicamento', 'medicacao', 'farmacia', 'receita'] },
  { id: 'consultation', label: 'Consulta / atendimento', category: 'atendimento', keywords: ['consulta', 'atendimento', 'medico', 'medica', 'enfermeiro', 'enfermeira'] },
  { id: 'visit', label: 'Visita domiciliar', category: 'acao', keywords: ['visita domiciliar', 'visitar domicilio', 'visitar casa'] },
  { id: 'fasting', label: 'Jejum', category: 'preparo', keywords: ['jejum', 'sem comer', 'nao comer'] },
  { id: 'water', label: 'Água / hidratação', category: 'preparo', keywords: ['beber agua', 'tomar agua', 'hidratacao', 'agua'] },
  { id: 'susCard', label: 'Cartão SUS', category: 'documento', keywords: ['cartao sus', 'cartao do sus', 'cns'] },
  { id: 'results', label: 'Levar exames / resultados', category: 'documento', keywords: ['levar exame', 'levar exames', 'resultado', 'resultados', 'laudo'] },
  { id: 'document', label: 'Documento', category: 'documento', keywords: ['documento', 'documentos', 'identidade', 'rg', 'cpf'] },
  { id: 'companion', label: 'Ir acompanhado', category: 'preparo', keywords: ['acompanhado', 'acompanhante', 'vir com', 'levar responsavel'] },
  { id: 'early', label: 'Chegar cedo', category: 'preparo', keywords: ['chegar cedo', 'antecedencia', 'antes do horario'] },
  { id: 'clinic', label: 'Unidade de saúde', category: 'local', keywords: ['ubs', 'unidade de saude', 'posto de saude', 'centro de saude'] },
  { id: 'school', label: 'Escola', category: 'local', keywords: ['escola', 'creche', 'colegio'] },
  { id: 'home', label: 'Casa / domicílio', category: 'local', keywords: ['casa', 'domicilio', 'residencia'] },
  { id: 'group', label: 'Grupo / reunião', category: 'acao', keywords: ['grupo', 'reuniao', 'roda de conversa', 'palestra', 'encontro'] },
  { id: 'child', label: 'Criança', category: 'publico', keywords: ['crianca', 'bebe', 'infantil', 'pediatria'] },
  { id: 'elderly', label: 'Pessoa idosa', category: 'publico', keywords: ['idoso', 'idosa', 'terceira idade'] },
  { id: 'family', label: 'Família', category: 'publico', keywords: ['familia', 'responsavel familiar'] },
  { id: 'phone', label: 'Telefone / contato', category: 'contato', keywords: ['telefone', 'contato', 'ligar', 'celular'] },
  { id: 'barrier', label: 'Barreira de acesso', category: 'territorio', keywords: ['barreira', 'dificuldade de acesso', 'acessibilidade', 'obstaculo'] },
  { id: 'partner', label: 'Parceiro / rede de apoio', category: 'territorio', keywords: ['parceiro', 'parceria', 'rede de apoio', 'articulacao'] },
  { id: 'warning', label: 'Atenção / risco', category: 'alerta', keywords: ['risco', 'atencao', 'urgente', 'perigo', 'vulnerabilidade', 'ponto critico'] },
  { id: 'hypertension', label: 'Pressão arterial', category: 'indicador', keywords: ['hipertensao', 'pressao arterial', 'pressao alta'] },
  { id: 'diabetes', label: 'Diabetes', category: 'indicador', keywords: ['diabetes', 'glicemia', 'acucar no sangue'] },
  { id: 'population', label: 'População / pessoas', category: 'indicador', keywords: ['populacao', 'pessoas', 'cidadaos', 'ativos'] },
  { id: 'action', label: 'Ação / próximo passo', category: 'acao', keywords: ['acao', 'proximo passo', 'encaminhamento', 'decisao', 'fazer agora'] }
];

const catalogById = new Map(visualSupportCatalog.map((item) => [item.id, item]));

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s/-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function addUnique(ids, id) {
  if (id && !ids.includes(id)) ids.push(id);
}

export function visualSupportsFor({ label = '', value = '', type = '', max = 3 } = {}) {
  const ids = [];
  const normalizedValue = normalize(value);
  const normalizedLabel = normalize(label);
  const combined = `${normalizedValue} ${normalizedLabel}`.trim();

  if (type === 'date') addUnique(ids, 'calendar');
  if (type === 'time') addUnique(ids, 'clock');

  for (const item of visualSupportCatalog) {
    if (item.keywords.some((keyword) => combined.includes(normalize(keyword)))) addUnique(ids, item.id);
    if (ids.length >= max) break;
  }

  if (!ids.length) {
    if (/nome|pessoa|quem/.test(normalizedLabel)) addUnique(ids, 'person');
    else if (/data|dia|revis/.test(normalizedLabel)) addUnique(ids, 'calendar');
    else if (/hora/.test(normalizedLabel)) addUnique(ids, 'clock');
    else if (/local|onde|endereco|referencia/.test(normalizedLabel)) addUnique(ids, 'location');
    else if (/telefone|contato/.test(normalizedLabel)) addUnique(ids, 'phone');
    else if (/familia|responsavel/.test(normalizedLabel)) addUnique(ids, 'family');
    else if (/acao|decisao|encaminhamento|proximo/.test(normalizedLabel)) addUnique(ids, 'action');
  }

  return ids.slice(0, max).map((id) => {
    const source = flaticonAssets[id];
    if (!source) return null;
    return {
      id,
      label: catalogById.get(id)?.label || id,
      imageUrl: flaticonPngUrl(source.iconId),
      flaticon: source
    };
  }).filter(Boolean);
}

export function renderFlaticonIcon(id, { className = '' } = {}) {
  const source = flaticonAssets[id];
  if (!source) return '';
  return `<img class="flaticon-icon ${className}" data-flaticon-icon="${id}" src="${flaticonPngUrl(source.iconId)}" alt="" crossorigin="anonymous" referrerpolicy="no-referrer">`;
}

export function renderVisualSupports(subject, { max = 3, showLabels = false, className = '' } = {}) {
  const items = visualSupportsFor({ ...subject, max });
  if (!items.length) return '';
  return `<span class="visual-support-set ${className}" aria-hidden="true">${items.map((item) => `<span class="visual-support-item" data-support="${item.id}"><span class="support-pictogram">${renderFlaticonIcon(item.id)}</span>${showLabels ? `<small>${item.label}</small>` : ''}</span>`).join('')}</span>`;
}

export function renderVisualSupportForText(text, options = {}) {
  return renderVisualSupports({ value: text }, options);
}

export function renderFlaticonAttribution({ className = '' } = {}) {
  const authors = [...new Set(Object.values(flaticonAssets).map((item) => item.author))];
  return `<p class="flaticon-attribution ${className}">Ícones por ${authors.join(', ')} — <a href="https://www.flaticon.com/" target="_blank" rel="noopener noreferrer">Flaticon</a>. Uso gratuito com atribuição.</p>`;
}

export function hasFlaticonVisualSupport(html = '') {
  return String(html).includes('data-flaticon-icon=');
}
