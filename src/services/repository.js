import { supabase } from './supabase.js';

function assertNoError(error) {
  if (error) throw error;
}

function pickAllowed(patch, allowed) {
  return Object.fromEntries(Object.entries(patch).filter(([key]) => allowed.includes(key)));
}

function normalizeCoordinate(value, label, min, max) {
  if (value === '' || value === null || value === undefined) return null;
  const normalized = String(value).trim().replace(',', '.');
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new RangeError(`${label} inválida. Use um valor entre ${min} e ${max}.`);
  }
  return number;
}

function normalizeCoordinates(payload) {
  const hasLatitude = Object.prototype.hasOwnProperty.call(payload, 'latitude');
  const hasLongitude = Object.prototype.hasOwnProperty.call(payload, 'longitude');
  if (!hasLatitude && !hasLongitude) return {};
  if (hasLatitude !== hasLongitude) throw new Error('Informe latitude e longitude juntas.');
  const latitude = normalizeCoordinate(payload.latitude, 'Latitude', -90, 90);
  const longitude = normalizeCoordinate(payload.longitude, 'Longitude', -180, 180);
  if ((latitude === null) !== (longitude === null)) throw new Error('Informe latitude e longitude juntas.');
  return { latitude, longitude };
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  assertNoError(error);
  return data;
}

export async function updateProfile(userId, patch) {
  const allowed = [
    'full_name','microarea','acs_phone','municipality_code','unit_cnes','team_id',
    'unit_name','team_name','unit_phone','unit_address','unit_hours',
    'doctor_name','nurse_name','tech_name'
  ];
  const clean = pickAllowed(patch, allowed);
  const { data, error } = await supabase.from('profiles').update(clean).eq('id', userId).select('*').single();
  assertNoError(error);
  return data;
}

export async function setProfileRole(userId, role) {
  if (!['acs','physician','nurse','unit_admin','admin'].includes(role)) throw new Error('Função de acesso inválida.');
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', userId).select('*').single();
  assertNoError(error);
  return data;
}

export async function listMunicipalities({ includeInactive = false } = {}) {
  let query = supabase.from('municipalities').select('*').order('name');
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  assertNoError(error);
  return data || [];
}

export async function createMunicipality(payload) {
  const clean = { code: payload.code.trim(), name: payload.name.trim(), state_code: payload.state_code.trim().toUpperCase(), active: payload.active ?? true };
  const { data, error } = await supabase.from('municipalities').insert(clean).select('*').single();
  assertNoError(error);
  return data;
}

export async function updateMunicipality(code, patch) {
  const clean = pickAllowed(patch, ['name','state_code','active']);
  if (clean.name !== undefined) clean.name = clean.name.trim();
  if (clean.state_code !== undefined) clean.state_code = clean.state_code.trim().toUpperCase();
  const { data, error } = await supabase.from('municipalities').update(clean).eq('code', code).select('*').single();
  assertNoError(error);
  return data;
}

export async function listUnits({ municipalityCode = null, includeInactive = false } = {}) {
  let query = supabase.from('health_units').select('*').order('display_order').order('short_name');
  if (municipalityCode) query = query.eq('municipality_code', municipalityCode);
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  assertNoError(error);
  return data || [];
}

export async function getUnit(cnes) {
  if (!cnes) return null;
  const { data, error } = await supabase.from('health_units').select('*').eq('cnes', cnes).maybeSingle();
  assertNoError(error);
  return data;
}

export async function listTeams({ unitCnes = null, includeInactive = false } = {}) {
  let query = supabase.from('teams').select('*').order('name');
  if (unitCnes) query = query.eq('unit_cnes', unitCnes);
  if (!includeInactive) query = query.eq('active', true);
  const { data, error } = await query;
  assertNoError(error);
  return data || [];
}

export async function getTeam(teamId) {
  if (!teamId) return null;
  const { data, error } = await supabase.from('teams').select('*').eq('id', teamId).maybeSingle();
  assertNoError(error);
  return data;
}

export async function buildContext(profile) {
  if (!profile) return null;
  const [municipality, unit, team] = await Promise.all([
    profile.municipality_code ? supabase.from('municipalities').select('*').eq('code', profile.municipality_code).maybeSingle() : Promise.resolve({ data: null, error: null }),
    profile.unit_cnes ? supabase.from('health_units').select('*').eq('cnes', profile.unit_cnes).maybeSingle() : Promise.resolve({ data: null, error: null }),
    profile.team_id ? supabase.from('teams').select('*').eq('id', profile.team_id).maybeSingle() : Promise.resolve({ data: null, error: null })
  ]);
  [municipality, unit, team].forEach((result) => assertNoError(result.error));
  return { municipality: municipality.data, unit: unit.data, team: team.data };
}

export async function listProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('role', { ascending: false }).order('unit_name').order('team_name').order('full_name');
  assertNoError(error);
  return data || [];
}

export async function adminUpdateProfile(userId, patch) {
  return updateProfile(userId, patch);
}

export async function createTeam(payload) {
  const clean = {
    unit_cnes: payload.unit_cnes, name: payload.name.trim(), ine: payload.ine?.trim() || null,
    verification_status: payload.verification_status || 'confirmed',
    source_label: payload.source_label?.trim() || 'Confirmado pela gestão/equipe', source_url: payload.source_url?.trim() || '',
    source_checked_on: payload.source_checked_on || new Date().toISOString().slice(0, 10), source_note: payload.source_note?.trim() || '', active: payload.active ?? true
  };
  const { data, error } = await supabase.from('teams').insert(clean).select('*').single();
  assertNoError(error);
  return data;
}

export async function updateTeam(teamId, patch) {
  const clean = pickAllowed(patch, ['name','ine','verification_status','source_label','source_url','source_checked_on','source_note','active']);
  if (clean.name !== undefined) clean.name = clean.name.trim();
  if (clean.ine !== undefined) clean.ine = clean.ine?.trim() || null;
  const { data, error } = await supabase.from('teams').update(clean).eq('id', teamId).select('*').single();
  assertNoError(error);
  return data;
}

export async function updateUnit(cnes, patch) {
  const clean = pickAllowed(patch, ['name','short_name','unit_type','address','neighborhood','phone','hours','data_status','source_label','source_url','source_checked_on','source_note','is_active','display_order']);
  const { data, error } = await supabase.from('health_units').update(clean).eq('cnes', cnes).select('*').single();
  assertNoError(error);
  return data;
}

export async function createUnit(payload) {
  const clean = {
    cnes: payload.cnes.trim(), name: payload.name.trim(), short_name: payload.short_name?.trim() || payload.name.trim(), unit_type: payload.unit_type || 'ubs',
    address: payload.address?.trim() || '', neighborhood: payload.neighborhood?.trim() || '', phone: payload.phone?.trim() || '', hours: payload.hours?.trim() || '',
    municipality_code: payload.municipality_code,
    source_label: payload.source_label?.trim() || 'Cadastro administrativo', source_url: payload.source_url?.trim() || '',
    source_checked_on: payload.source_checked_on || new Date().toISOString().slice(0, 10), source_note: payload.source_note?.trim() || '',
    data_status: payload.data_status || 'needs_review', is_active: payload.is_active ?? true, display_order: Number(payload.display_order || 100)
  };
  const { data, error } = await supabase.from('health_units').insert(clean).select('*').single();
  assertNoError(error);
  return data;
}

export async function listTerritoryPoints({ municipalityCode = null, unitCnes = null, teamId = null, status = null, kind = null } = {}) {
  let query = supabase.from('territory_points').select('*').order('observed_on', { ascending: false }).order('created_at', { ascending: false });
  if (municipalityCode) query = query.eq('municipality_code', municipalityCode);
  if (unitCnes) query = query.eq('unit_cnes', unitCnes);
  if (teamId) query = query.eq('team_id', teamId);
  if (status) query = query.eq('status', status);
  if (kind) query = query.eq('kind', kind);
  const { data, error } = await query;
  assertNoError(error);
  return data || [];
}

export async function createTerritoryPoint(payload) {
  const coordinates = normalizeCoordinates(payload);
  const clean = {
    municipality_code: payload.municipality_code, unit_cnes: payload.unit_cnes || null, team_id: payload.team_id || null,
    kind: payload.kind, name: payload.name.trim(), description: payload.description?.trim() || '', address: payload.address?.trim() || '',
    ...coordinates,
    observed_on: payload.observed_on || new Date().toISOString().slice(0, 10), status: payload.status || 'active',
    source_label: payload.source_label?.trim() || 'Observação territorial', source_note: payload.source_note?.trim() || ''
  };
  const { data, error } = await supabase.from('territory_points').insert(clean).select('*').single();
  assertNoError(error);
  return data;
}

export async function updateTerritoryPoint(pointId, patch) {
  const clean = pickAllowed(patch, ['kind','name','description','address','latitude','longitude','observed_on','status','source_label','source_note','municipality_code','unit_cnes','team_id']);
  if (clean.name !== undefined) clean.name = clean.name.trim();
  if (clean.description !== undefined) clean.description = clean.description?.trim() || '';
  if (clean.address !== undefined) clean.address = clean.address?.trim() || '';
  Object.assign(clean, normalizeCoordinates(clean));
  const { data, error } = await supabase.from('territory_points').update(clean).eq('id', pointId).select('*').single();
  assertNoError(error);
  return data;
}

export async function deleteTerritoryPoint(pointId) {
  const { error } = await supabase.from('territory_points').delete().eq('id', pointId);
  assertNoError(error);
}
