const buttonBusyStates = new WeakMap();

export function setButtonBusy(button, busy, label = '') {
  if (!button) return;

  if (busy) {
    if (buttonBusyStates.has(button)) return;
    buttonBusyStates.set(button, {
      disabled: button.disabled,
      ariaDisabled: button.getAttribute('aria-disabled'),
      ariaBusy: button.getAttribute('aria-busy'),
      label: button.textContent
    });
    button.disabled = true;
    button.setAttribute('aria-disabled', 'true');
    button.setAttribute('aria-busy', 'true');
    if (label) button.textContent = label;
    return;
  }

  const previous = buttonBusyStates.get(button);
  if (!previous) return;

  button.disabled = previous.disabled;
  restoreAttribute(button, 'aria-disabled', previous.ariaDisabled);
  restoreAttribute(button, 'aria-busy', previous.ariaBusy);
  button.textContent = previous.label ?? button.dataset.defaultLabel ?? button.textContent;
  buttonBusyStates.delete(button);
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
  const blockedCatalog = [...form.querySelectorAll('select[data-load-state="loading"], select[data-load-state="error"]')]
    .some((select) => select.required);
  if (blockedCatalog) return false;
  return form.reportValidity();
}

function restoreAttribute(element, name, value) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function replaceSelectMessage(select, label) {
  const option = document.createElement('option');
  option.value = '';
  option.textContent = label;
  select.replaceChildren(option);
  select.value = '';
}
