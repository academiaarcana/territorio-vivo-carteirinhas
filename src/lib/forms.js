export function setButtonBusy(button, busy, label = '') {
  if (!button) return;
  if (busy) {
    if (button.disabled) return;
    button.dataset.previousLabel = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (label) button.textContent = label;
    return;
  }
  button.disabled = false;
  button.removeAttribute('aria-busy');
  button.textContent = button.dataset.previousLabel || button.dataset.defaultLabel || button.textContent;
  delete button.dataset.previousLabel;
}

export function setSelectLoading(select, label = 'Carregando…') {
  if (!select) return;
  replaceSelectMessage(select, label);
  select.dataset.loadState = 'loading';
  select.setAttribute('aria-busy', 'true');
  select.removeAttribute('aria-invalid');
}

export function setSelectReady(select) {
  if (!select) return;
  select.dataset.loadState = 'ready';
  select.removeAttribute('aria-busy');
  select.removeAttribute('aria-invalid');
}

export function setSelectError(select, label = 'Não foi possível carregar') {
  if (!select) return;
  replaceSelectMessage(select, label);
  select.dataset.loadState = 'error';
  select.removeAttribute('aria-busy');
  select.setAttribute('aria-invalid', 'true');
}

export function canSubmitForm(form, button) {
  if (!form || !button || button.disabled) return false;
  const blockedCatalog = form.querySelector('select[data-load-state="loading"], select[data-load-state="error"]');
  if (blockedCatalog) return false;
  return form.reportValidity();
}

function replaceSelectMessage(select, label) {
  const option = document.createElement('option');
  option.value = '';
  option.textContent = label;
  select.replaceChildren(option);
  select.value = '';
}
