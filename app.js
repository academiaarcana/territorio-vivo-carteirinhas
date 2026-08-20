const STORAGE_KEY = 'territorio-vivo-equipe-v1';

const fieldIds = [
  'acs', 'microarea', 'acsPhone', 'unit', 'team', 'unitPhone',
  'address', 'hours', 'doctor', 'nurse', 'tech'
];

const placeholders = {
  acs: '________________',
  microarea: '__',
  acsPhone: '________________',
  unit: 'UBS Madre Tereza de Calcutá',
  team: 'Equipe 02',
  unitPhone: '________________',
  address: '________________',
  hours: '________________',
  doctor: '________________',
  nurse: '________________',
  tech: '________________'
};

const getField = (id) => document.getElementById(id);

function sanitizeText(value) {
  return String(value ?? '').replace(/[<>]/g, '').trim();
}

function getFormData() {
  return fieldIds.reduce((acc, id) => {
    acc[id] = sanitizeText(getField(id)?.value);
    return acc;
  }, {});
}

function updatePreview() {
  const data = getFormData();

  Object.entries(data).forEach(([key, value]) => {
    document.querySelectorAll(`[data-bind="${key}"]`).forEach((node) => {
      node.textContent = value || placeholders[key] || '________________';
    });
  });

  document.body.classList.toggle('economy', getField('economyMode').checked);
  document.body.classList.toggle('easy-read', getField('easyRead').checked);
}

function saveTeamData() {
  const data = getFormData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  showTemporaryMessage('Dados da equipe salvos neste dispositivo.');
}

function loadTeamData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return;

    fieldIds.forEach((id) => {
      if (saved[id] !== undefined && getField(id)) getField(id).value = saved[id];
    });
  } catch (error) {
    console.warn('Não foi possível carregar os dados salvos.', error);
  }
}

function clearSavedData() {
  localStorage.removeItem(STORAGE_KEY);
  showTemporaryMessage('Dados salvos apagados deste dispositivo.');
}

function showTemporaryMessage(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    right: '18px',
    bottom: '18px',
    zIndex: '9999',
    background: '#152033',
    color: 'white',
    padding: '11px 14px',
    borderRadius: '10px',
    boxShadow: '0 8px 22px rgba(0,0,0,.18)',
    fontWeight: '700'
  });
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function buildPrintSheet(side) {
  updatePreview();
  const root = document.getElementById('printRoot');
  const perPage = Number(getField('perPage').value) === 2 ? 2 : 4;
  const source = document.getElementById(side === 'front' ? 'frontPreview' : 'backPreview');

  root.innerHTML = '';
  const sheet = document.createElement('section');
  sheet.className = `print-sheet per-${perPage}`;
  sheet.setAttribute('aria-label', side === 'front' ? 'Folha A4 — frentes' : 'Folha A4 — versos');

  for (let i = 0; i < perPage; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'print-slot';
    const clone = source.cloneNode(true);
    clone.removeAttribute('id');
    slot.appendChild(clone);
    sheet.appendChild(slot);
  }

  root.appendChild(sheet);
  return root;
}

function printSide(side) {
  buildPrintSheet(side);
  document.body.dataset.printSide = side;

  window.setTimeout(() => {
    window.print();
  }, 80);
}

function attachEvents() {
  document.querySelectorAll('#card-form input, #card-form select').forEach((element) => {
    element.addEventListener('input', updatePreview);
    element.addEventListener('change', updatePreview);
  });

  document.getElementById('saveTeam').addEventListener('click', saveTeamData);
  document.getElementById('clearSaved').addEventListener('click', clearSavedData);
  document.getElementById('printFront').addEventListener('click', () => printSide('front'));
  document.getElementById('printBack').addEventListener('click', () => printSide('back'));
}

loadTeamData();
attachEvents();
updatePreview();
