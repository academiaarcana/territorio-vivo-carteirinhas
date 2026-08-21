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

export function canSubmitForm(form, button) {
  if (!form || !button || button.disabled) return false;
  return form.reportValidity();
}
