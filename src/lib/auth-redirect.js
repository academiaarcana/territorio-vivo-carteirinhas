const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function directoryPath(pathname) {
  if (pathname.endsWith('/')) return pathname;
  return pathname.replace(/[^/]*$/, '');
}

export function resolveAuthRedirectUrl({ publicUrl, currentUrl, recovery = false }) {
  const current = new URL(currentUrl);
  const target = LOOPBACK_HOSTS.has(current.hostname)
    ? new URL(directoryPath(current.pathname), current.origin)
    : new URL(publicUrl);

  if (recovery) target.searchParams.set('recovery', '1');
  return target.toString();
}
