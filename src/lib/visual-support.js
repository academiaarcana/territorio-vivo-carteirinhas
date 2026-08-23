const common = 'viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';

const svg = {
  person: `<svg ${common}><circle cx="32" cy="18" r="9"/><path d="M15 54c2-15 9-23 17-23s15 8 17 23"/></svg>`,
  family: `<svg ${common}><circle cx="22" cy="20" r="7"/><circle cx="42" cy="20" r="7"/><circle cx="32" cy="34" r="6"/><path d="M8 53c1-12 6-19 14-19 5 0 9 3 12 8M56 53c-1-12-6-19-14-19-5 0-9 3-12 8M22 56c1-10 4-16 10-16s9 6 10 16"/></svg>`,
  child: `<svg ${common}><circle cx="32" cy="19" r="9"/><path d="M20 56l3-20h18l3 20M26 36l-8 10M38 36l8 10M28 56v-12M36 56v-12"/></svg>`,
  elderly: `<svg ${common}><circle cx="28" cy="16" r="8"/><path d="M27 25c-7 7-8 18-5 30M27 29l12 9M37 38l-3 17M45 29v27M42 29h6"/></svg>`,
  pregnant: `<svg ${common}><circle cx="27" cy="14" r="7"/><path d="M25 22c-5 7-6 17-3 33M25 28c17 1 22 12 17 23-3 6-10 7-18 4M27 55v-14"/></svg>`,
  calendar: `<svg ${common}><rect x="10" y="14" width="44" height="40" rx="5"/><path d="M20 8v12M44 8v12M10 26h44"/><path d="M20 36h7M37 36h7M20 46h7"/></svg>`,
  clock: `<svg ${common}><circle cx="32" cy="32" r="23"/><path d="M32 18v16l11 7"/></svg>`,
  clinic: `<svg ${common}><path d="M10 56V22l22-12 22 12v34"/><path d="M26 28h12M32 22v12M20 56V42h24v14"/></svg>`,
  consultation: `<svg ${common}><circle cx="19" cy="19" r="7"/><circle cx="45" cy="18" r="7"/><path d="M8 47c1-11 5-17 11-17s10 6 11 17M34 47c1-11 5-17 11-17s10 6 11 17"/><path d="M26 50h20M36 35c0 5 2 8 6 8s6-3 6-8M42 43v6"/></svg>`,
  vaccine: `<svg ${common}><path d="M12 43c8-8 15-9 23-4l8 5M15 48c8 6 17 6 25 1"/><path d="M38 29l14-14M44 15l5 5M34 33l8 8M48 11l5 5M30 37l6-6"/><path d="M52 14l4-4"/></svg>`,
  dentist: `<svg ${common}><path d="M20 10c7-3 10 2 12 2s5-5 12-2c8 4 7 15 4 24-3 10-5 20-10 20-4 0-3-12-6-12s-2 12-6 12c-5 0-7-10-10-20-3-9-4-20 4-24z"/></svg>`,
  exam: `<svg ${common}><path d="M22 8h20M26 8v13L16 46c-2 5 1 10 7 10h18c6 0 9-5 7-10L38 21V8"/><path d="M20 42h24M25 49h14"/></svg>`,
  dressing: `<svg ${common}><rect x="10" y="24" width="44" height="16" rx="8" transform="rotate(-25 32 32)"/><path d="M28 28l8 8M36 28l-8 8"/></svg>`,
  medicine: `<svg ${common}><rect x="10" y="14" width="44" height="36" rx="5"/><circle cx="22" cy="26" r="5"/><circle cx="42" cy="26" r="5"/><circle cx="22" cy="40" r="5"/><circle cx="42" cy="40" r="5"/><path d="M18 54h28"/></svg>`,
  document: `<svg ${common}><path d="M16 8h24l10 10v38H16z"/><path d="M40 8v12h10M23 30h20M23 39h20M23 48h13"/></svg>`,
  susCard: `<svg ${common}><rect x="8" y="16" width="48" height="32" rx="5"/><path d="M20 32h12M26 26v12M38 28h11M38 36h8"/></svg>`,
  results: `<svg ${common}><path d="M15 8h34v48H15z"/><path d="M22 42l8-9 7 5 8-14M22 48h22M22 20h14"/></svg>`,
  fasting: `<svg ${common}><path d="M14 36h36M18 36c2 10 8 16 14 16s12-6 14-16M11 56L53 8"/><path d="M23 26c2-4 5-6 9-6s7 2 9 6"/></svg>`,
  water: `<svg ${common}><path d="M32 8s-15 18-15 31a15 15 0 0 0 30 0C47 26 32 8 32 8z"/><path d="M23 42c3 5 7 7 12 7"/></svg>`,
  companion: `<svg ${common}><circle cx="22" cy="20" r="8"/><circle cx="44" cy="20" r="8"/><path d="M8 55c1-15 6-23 14-23s13 8 14 23M30 55c1-15 6-23 14-23s13 8 14 23"/></svg>`,
  early: `<svg ${common}><circle cx="31" cy="33" r="20"/><path d="M31 21v13l9 5M13 12l7 7M49 12l-7 7"/><path d="M8 8h12M44 8h12"/></svg>`,
  home: `<svg ${common}><path d="M8 31L32 10l24 21M14 27v29h36V27M26 56V40h12v16"/></svg>`,
  school: `<svg ${common}><path d="M8 24l24-12 24 12-24 12z"/><path d="M16 30v22h32V30M25 52V40h14v12"/></svg>`,
  group: `<svg ${common}><circle cx="32" cy="20" r="7"/><circle cx="15" cy="27" r="6"/><circle cx="49" cy="27" r="6"/><path d="M20 56c1-13 5-20 12-20s11 7 12 20M4 56c1-10 4-16 11-16 4 0 7 2 9 6M60 56c-1-10-4-16-11-16-4 0-7 2-9 6"/></svg>`,
  phone: `<svg ${common}><path d="M18 10l9 9-6 6c5 10 13 18 23 23l6-6 9 9-6 7c-2 2-5 3-8 2C26 55 9 38 4 19c-1-3 0-6 2-8l7-6 5 5z"/></svg>`,
  location: `<svg ${common}><path d="M32 58s18-16 18-34a18 18 0 1 0-36 0c0 18 18 34 18 34z"/><circle cx="32" cy="24" r="6"/></svg>`,
  warning: `<svg ${common}><path d="M32 7L58 55H6z"/><path d="M32 23v16M32 47h.01"/></svg>`,
  barrier: `<svg ${common}><path d="M10 48h44M16 48V31h32v17M20 31l8 8M32 31l8 8M44 31l4 4M8 56h48"/></svg>`,
  partner: `<svg ${common}><path d="M8 27l12-10 12 8 12-8 12 10-13 18-11 8-11-8z"/><path d="M22 31l10 8 10-8M27 44l5 4 5-4"/></svg>`,
  visit: `<svg ${common}><path d="M8 30L28 13l20 17v25H8z"/><circle cx="49" cy="19" r="7"/><path d="M49 15v8M45 19h8M20 55V40h14v15"/></svg>`,
  hypertension: `<svg ${common}><path d="M14 24c6-11 19-8 18 3-1-11 12-14 18-3 7 13-18 29-18 29S7 37 14 24z"/><circle cx="47" cy="16" r="9"/><path d="M47 16l5-4M41 16h12"/></svg>`,
  diabetes: `<svg ${common}><path d="M27 8S14 24 14 37a18 18 0 0 0 36 0C50 24 37 8 37 8"/><path d="M24 38h16M32 30v16"/></svg>`,
  population: `<svg ${common}><circle cx="16" cy="22" r="6"/><circle cx="32" cy="18" r="7"/><circle cx="48" cy="22" r="6"/><path d="M5 55c1-12 5-18 11-18 4 0 7 2 9 6M59 55c-1-12-5-18-11-18-4 0-7 2-9 6M18 56c1-15 6-23 14-23s13 8 14 23"/></svg>`,
  action: `<svg ${common}><path d="M10 50h14l28-28-14-14-28 28z"/><path d="M34 12l14 14M10 50l-2 8 8-2M27 49h27"/></svg>`
};

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

  return ids.slice(0, max).map((id) => ({
    id,
    label: catalogById.get(id)?.label || id,
    svg: svg[id] || svg.action
  }));
}

export function renderVisualSupports(subject, { max = 3, showLabels = false, className = '' } = {}) {
  const items = visualSupportsFor({ ...subject, max });
  if (!items.length) return '';
  return `<span class="visual-support-set ${className}" aria-hidden="true">${items.map((item) => `<span class="visual-support-item" data-support="${item.id}"><span class="support-pictogram">${item.svg}</span>${showLabels ? `<small>${item.label}</small>` : ''}</span>`).join('')}</span>`;
}

export function renderVisualSupportForText(text, options = {}) {
  return renderVisualSupports({ value: text }, options);
}
