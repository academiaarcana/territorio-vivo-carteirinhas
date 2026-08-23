import { setState, resetState } from './store.js';
import { getProfile, buildContext } from '../services/repository.js';

const PROFILE_RETRY_DELAYS = [0, 150, 350, 700];

export async function hydrateSession(session) {
  if (!session?.user) {
    resetState();
    return null;
  }

  let profile = null;
  let lastError = null;
  for (const delay of PROFILE_RETRY_DELAYS) {
    if (delay) await sleep(delay);
    try {
      profile = await getProfile(session.user.id);
      if (profile) break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!profile) {
    const error = lastError || new Error('Perfil profissional não encontrado após autenticação.');
    setState({ booting: false, session, user: session.user, profile: null, context: null, lastError: error });
    throw error;
  }

  const context = await buildContext(profile);
  setState({ booting: false, session, user: session.user, profile, context, lastError: null });
  return { profile, context };
}

export function clearSession() {
  resetState();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
