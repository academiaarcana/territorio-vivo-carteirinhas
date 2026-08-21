let installed = false;
let lastOutsideFocus = null;
const dialogOpeners = new WeakMap();
let dialogObserver = null;

export function installGlobalA11y() {
  if (installed) return;
  installed = true;
  document.addEventListener('keydown', handleTablistKeydown);
  document.addEventListener('focusin', rememberOutsideFocus, true);
  document.addEventListener('close', restoreDialogFocus, true);

  dialogObserver = new MutationObserver(handleDialogMutations);
  dialogObserver.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ['open']
  });
}

function rememberOutsideFocus(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest('dialog[open]')) return;
  lastOutsideFocus = target;
}

function handleDialogMutations(mutations) {
  for (const mutation of mutations) {
    const dialog = mutation.target;
    if (!(dialog instanceof HTMLDialogElement) || mutation.attributeName !== 'open') continue;
    if (!dialog.open || dialogOpeners.has(dialog)) continue;

    const opener = lastOutsideFocus instanceof HTMLElement && lastOutsideFocus.isConnected
      ? lastOutsideFocus
      : null;
    dialogOpeners.set(dialog, opener);
    queueMicrotask(() => focusDialog(dialog));
  }
}

function focusDialog(dialog) {
  if (!dialog.open) return;
  const preferred = dialog.querySelector([
    '[autofocus]',
    'input:not([type="hidden"]):not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not(.dialog-close):not([disabled])',
    'a[href]'
  ].join(','));
  const fallback = dialog.querySelector('.dialog-close,button,[href],[tabindex]:not([tabindex="-1"])');
  const target = preferred || fallback || dialog;
  if (target === dialog && !dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

function restoreDialogFocus(event) {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement)) return;
  const opener = dialogOpeners.get(dialog);
  dialogOpeners.delete(dialog);
  if (!(opener instanceof HTMLElement)) return;
  queueMicrotask(() => {
    if (opener.isConnected) opener.focus({ preventScroll: true });
  });
}

function handleTablistKeydown(event) {
  const current = event.target.closest?.('[role="tab"]');
  if (!current) return;
  const tablist = current.closest('[role="tablist"]');
  if (!tablist) return;

  const tabs = [...tablist.querySelectorAll('[role="tab"]')].filter((tab) => !tab.disabled && !tab.hidden);
  if (!tabs.length) return;
  const index = tabs.indexOf(current);
  if (index < 0) return;

  let nextIndex = null;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = tabs.length - 1;
  if (nextIndex === null) return;

  event.preventDefault();
  const next = tabs[nextIndex];
  next.focus();
  next.click();
}
