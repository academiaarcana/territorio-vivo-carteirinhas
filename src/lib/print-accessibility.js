export function renderPrintAccessibilityOptions(prefix, { visualSupport = true } = {}) {
  return `<div class="print-accessibility-options" data-print-options="${prefix}"><strong>Opções de impressão</strong><label class="check"><input type="checkbox" data-print-option="easyRead"> Leitura fácil</label>${visualSupport ? '<label class="check"><input type="checkbox" data-print-option="visualSupport"> Apoio visual</label>' : ''}<label class="check"><input type="checkbox" data-print-option="largePrint"> Letra ampliada</label><label class="check"><input type="checkbox" data-print-option="economy"> Econômica</label></div>${visualSupport ? '<p class="visual-support-note">Apoio visual usa imagens específicas apenas quando o conteúdo permite uma interpretação segura. Data, hora, números e orientações clínicas continuam escritos.</p>' : ''}`;
}

export function readPrintAccessibilityOptions(root, prefix) {
  const container = root.querySelector(`[data-print-options="${prefix}"]`);
  const read = (name) => Boolean(container?.querySelector(`[data-print-option="${name}"]`)?.checked);
  return {
    easyRead: read('easyRead'),
    visualSupport: read('visualSupport'),
    largePrint: read('largePrint'),
    economy: read('economy')
  };
}

export function applyPrintAccessibilityOptions(root, prefix, options = {}) {
  const container = root.querySelector(`[data-print-options="${prefix}"]`);
  if (!container) return;
  for (const name of ['easyRead', 'visualSupport', 'largePrint', 'economy']) {
    const control = container.querySelector(`[data-print-option="${name}"]`);
    if (control) control.checked = Boolean(options[name]);
  }
}

export function printAccessibilityClasses({ easyRead = false, visualSupport = false, largePrint = false, economy = false } = {}) {
  return [
    easyRead ? 'print-easy-read' : '',
    visualSupport ? 'print-visual-support' : '',
    largePrint ? 'print-large' : '',
    economy ? 'print-economy' : ''
  ].filter(Boolean).join(' ');
}
