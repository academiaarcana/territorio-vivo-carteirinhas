let installed = false;
let lastOutsideFocus = null;
const dialogOpeners = new WeakMap();
let observer = null;

export function installGlobalA11y() {
  if (installed) return;
  installed = true;
  document.addEventListener('keydown', handleTablistKeydown);
  document.addEventListener('click', handleTabClick);
  document.addEventListener('focusin', rememberOutsideFocus, true);
  document.addEventListener('close', restoreDialogFocus, true);

  initializeTablists(document);
  observer = new MutationObserver(handleMutations);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['open']
  });
}

export function openAccessibleDialog(dialog, opener = document.activeElement) {
  if (!(dialog instanceof HTMLDialogElement) || dialog.open) return false;
  const resolvedOpener = canRestoreFocus(opener)
    ? opener
    : canRestoreFocus(lastOutsideFocus)
      ? lastOutsideFocus
      : null;
  dialogOpeners.set(dialog, resolvedOpener);
  dialog.showModal();
  queueMicrotask(() => focusDialog(dialog));
  return true;
}

function rememberOutsideFocus(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest('dialog[open]')) return;
  lastOutsideFocus = target;
}

function handleMutations(mutations) {
  for (const mutation of mutations) {
    if (mutation.type === 'attributes') {
      const dialog = mutation.target;
      if (!(dialog instanceof HTMLDialogElement) || mutation.attributeName !== 'open') continue;
      if (!dialog.open || dialogOpeners.has(dialog)) continue;
      const opener = canRestoreFocus(lastOutsideFocus) ? lastOutsideFocus : null;
      dialogOpeners.set(dialog, opener);
      queueMicrotask(() => focusDialog(dialog));
      continue;
    }

    for (const node of mutation.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches?.('[role="tablist"]')) initializeTablist(node);
      initializeTablists(node);
    }
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
  const fallback = dialog.querySelector('.dialog-close,button:not([disabled]),[href],[tabindex]:not([tabindex="-1"])');
  const target = preferred || fallback || dialog;
  if (target === dialog && !dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

function restoreDialogFocus(event) {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement)) return;
  const opener = dialogOpeners.get(dialog);
  dialogOpeners.delete(dialog);
  queueMicrotask(() => {
    if (canRestoreFocus(opener)) opener.focus({ preventScroll: true });
  });
}

function canRestoreFocus(element) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return false;
  if (element.matches(':disabled') || element.hidden || element.closest('[hidden],[inert]')) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return element.getClientRects().length > 0;
}

function initializeTablists(root) {
  root.querySelectorAll?.('[role="tablist"]').forEach(initializeTablist);
}

function initializeTablist(tablist) {
  const tabs = availableTabs(tablist);
  if (!tabs.length) return;
  const selected = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
  selectTab(tablist, selected);
}

function handleTabClick(event) {
  const tab = event.target.closest?.('[role="tab"]');
  if (!tab) return;
  const tablist = tab.closest('[role="tablist"]');
  if (!tablist || tab.disabled || tab.hidden) return;
  selectTab(tablist, tab);
}

function selectTab(tablist, selected) {
  availableTabs(tablist).forEach((tab) => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.setAttribute('tabindex', active ? '0' : '-1');
  });
}

function availableTabs(tablist) {
  return [...tablist.querySelectorAll('[role="tab"]')]
    .filter((tab) => !tab.disabled && !tab.hidden && !tab.closest('[hidden]'));
}

function handleTablistKeydown(event) {
  const current = event.target.closest?.('[role="tab"]');
  if (!current) return;
  const tablist = current.closest('[role="tablist"]');
  if (!tablist) return;

  const tabs = availableTabs(tablist);
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
  selectTab(tablist, next);
  next.focus({ preventScroll: true });
  next.click();
}
