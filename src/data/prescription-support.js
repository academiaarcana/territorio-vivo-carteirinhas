const assetUrl = (filename) => new URL(`../assets/prescription-support/${filename}`, import.meta.url).href;

export const prescriptionRoutes = Object.freeze([
  { id: 'oral', label: 'Via oral', hint: 'Tomar pela boca', image: assetUrl('oral.png') },
  { id: 'injection', label: 'Injeção', hint: 'Uso injetável', image: assetUrl('injection.png') },
  { id: 'topical', label: 'Uso na pele', hint: 'Aplicar na pele', image: assetUrl('topical.png') },
  { id: 'drops', label: 'Gotas', hint: 'Administrar em gotas', image: assetUrl('drops.png') }
]);

export const prescriptionSchedules = Object.freeze([
  { id: 'morning', label: 'Manhã', hint: 'No começo do dia', image: assetUrl('morning.png') },
  { id: 'lunch', label: 'Almoço', hint: 'Próximo ao almoço', image: assetUrl('lunch.png') },
  { id: 'evening', label: 'Noite', hint: 'No período da noite', image: assetUrl('evening.png') },
  { id: 'bedtime', label: 'Antes de dormir', hint: 'Na hora de deitar', image: assetUrl('bedtime.png') }
]);

export function getPrescriptionRoute(id) {
  return prescriptionRoutes.find((item) => item.id === id) || prescriptionRoutes[0];
}

export function getPrescriptionSchedule(id) {
  return prescriptionSchedules.find((item) => item.id === id) || prescriptionSchedules[0];
}
