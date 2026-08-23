const drafts = new Map();

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export function readVolatileDraft(key, fallback = null) {
  if (!drafts.has(key)) return clone(fallback);
  return clone(drafts.get(key));
}

export function writeVolatileDraft(key, value) {
  drafts.set(key, clone(value));
  return value;
}

export function clearVolatileDraft(key) {
  drafts.delete(key);
}

export function clearAllVolatileDrafts() {
  drafts.clear();
}

export function readNamedFormValues(form) {
  const values = {};
  Array.from(form?.elements || []).forEach((control) => {
    if (!control?.name) return;
    if (control.type === 'checkbox') values[control.name] = Boolean(control.checked);
    else if (control.type === 'radio') {
      if (control.checked) values[control.name] = control.value;
    } else values[control.name] = control.value;
  });
  return values;
}

export function applyNamedFormValues(form, values = {}) {
  Array.from(form?.elements || []).forEach((control) => {
    if (!control?.name || !(control.name in values)) return;
    if (control.type === 'checkbox') control.checked = Boolean(values[control.name]);
    else if (control.type === 'radio') control.checked = control.value === values[control.name];
    else control.value = values[control.name] ?? '';
  });
}
