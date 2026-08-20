export const ROLES = Object.freeze({
  ACS: 'acs',
  UNIT_ADMIN: 'unit_admin',
  ADMIN: 'admin'
});

export function isMaster(profile) {
  return profile?.role === ROLES.ADMIN;
}

export function isUnitAdmin(profile) {
  return profile?.role === ROLES.UNIT_ADMIN;
}

export function isManagement(profile) {
  return isMaster(profile) || isUnitAdmin(profile);
}

export function roleLabel(profileOrRole) {
  const role = typeof profileOrRole === 'string' ? profileOrRole : profileOrRole?.role;
  if (role === ROLES.ADMIN) return 'Master municipal';
  if (role === ROLES.UNIT_ADMIN) return 'Administrador da UBS';
  return 'Profissional / ACS';
}

export function canManageUnit(profile, unitCnes) {
  if (isMaster(profile)) return true;
  return isUnitAdmin(profile) && Boolean(unitCnes) && profile?.unit_cnes === unitCnes;
}

export function canManageTerritoryPoint(profile, userId, point) {
  if (!point) return false;
  if (isMaster(profile)) return true;
  if (isUnitAdmin(profile)) return Boolean(point.unit_cnes) && point.unit_cnes === profile?.unit_cnes;
  return Boolean(userId)
    && point.created_by === userId
    && Boolean(point.unit_cnes)
    && point.unit_cnes === profile?.unit_cnes;
}

export function canChangeProfileRole(actorProfile, targetProfile) {
  return isMaster(actorProfile) && targetProfile?.role !== ROLES.ADMIN;
}
