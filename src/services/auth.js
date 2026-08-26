import { supabase, appConfig } from './supabase.js';
import { hydrateSession, clearSession } from '../core/session.js';
import { resolveAuthRedirectUrl } from '../lib/auth-redirect.js';

function authRedirectUrl({ recovery = false } = {}) {
  return resolveAuthRedirectUrl({
    publicUrl: appConfig.publicUrl,
    currentUrl: location.href,
    recovery
  });
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      Promise.resolve(callback(event, session)).catch((error) => console.error('Falha no evento de autenticação', error));
    }, 0);
  });
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
  if (data.session) await hydrateSession(data.session);
  return data;
}

export async function signUp(payload) {
  const { fullName, email, password, municipalityCode, unitCnes, teamId, teamName, microarea } = payload;
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: authRedirectUrl(),
      data: {
        full_name: fullName.trim(),
        municipality_code: municipalityCode || null,
        unit_cnes: unitCnes || null,
        team_id: teamId || null,
        team_name: teamName?.trim() || '',
        microarea: microarea?.trim() || ''
      }
    }
  });
  if (error) throw error;
  if (data.session) await hydrateSession(data.session);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  clearSession();
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: authRedirectUrl({ recovery: true })
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
