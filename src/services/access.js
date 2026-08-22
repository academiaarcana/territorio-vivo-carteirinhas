import { supabase } from './supabase.js';

const allowedStatuses = new Set(['pending', 'active', 'suspended']);

function assertNoError(error) {
  if (error) throw error;
}

export async function listAccessProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('access_status')
    .order('unit_name')
    .order('full_name');
  assertNoError(error);
  return data || [];
}

export async function setProfileAccessStatus(profileId, accessStatus) {
  if (!allowedStatuses.has(accessStatus)) throw new Error('Status de acesso inválido.');
  const { data, error } = await supabase
    .from('profiles')
    .update({ access_status: accessStatus })
    .eq('id', profileId)
    .select('*')
    .single();
  assertNoError(error);
  return data;
}
