import { setState, resetState } from './store.js';
import { getProfile, buildContext } from '../services/repository.js';

export async function hydrateSession(session) {
  if (!session?.user) {
    resetState();
    return null;
  }
  let profile = await getProfile(session.user.id);
  if (!profile) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    profile = await getProfile(session.user.id);
  }
  const context = profile ? await buildContext(profile) : null;
  setState({ booting: false, session, user: session.user, profile, context, lastError: null });
  return { profile, context };
}

export function clearSession() {
  resetState();
}
