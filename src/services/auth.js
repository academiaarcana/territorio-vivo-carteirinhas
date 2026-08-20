import { supabase, appConfig } from './supabase.js';

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw error;
  return data;
}

export async function signUp(payload) {
  const { fullName, email, password, municipalityCode, unitCnes, teamId, teamName, microarea } = payload;
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: appConfig.publicUrl,
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
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${appConfig.publicUrl}#/recuperar-senha`
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
