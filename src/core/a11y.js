let installed = false;

export function installGlobalA11y() {
  if (installed) return;
  installed = true;
  document.addEventListener('keydown', handleTablistKeydown);
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
