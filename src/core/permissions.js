export const ROLES = Object.freeze({
  ACS: 'acs',
  UNIT_ADMIN: 'unit_admin',
  ADMIN: 'admin'
});

export const ACCESS_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended'
});

export function isActiveProfile(profile) {
  return profile?.access_status === ACCESS_STATUS.ACTIVE;
}

export function isPendingProfile(profile) {
  return profile?.access_status === ACCESS_STATUS.PENDING;
}

export function isSuspendedProfile(profile) {
  return profile?.access_status === ACCESS_STATUS.SUSPENDED;
}

export function isMaster(profile) {
  return profile?.role === ROLES.ADMIN && isActiveProfile(profile);
}

export function isUnitAdmin(profile) {
  return profile?.role === ROLES.UNIT_ADMIN && isActiveProfile(profile);
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

export function accessStatusLabel(profileOrStatus) {
  const status = typeof profileOrStatus === 'string' ? profileOrStatus : profileOrStatus?.access_status;
  if (status === ACCESS_STATUS.ACTIVE) return 'Acesso ativo';
  if (status === ACCESS_STATUS.SUSPENDED) return 'Acesso suspenso';
  return 'Aguardando aprovação';
}

export function canManageUnit(profile, unitCnes) {
  if (isMaster(profile)) return true;
  return isUnitAdmin(profile) && Boolean(unitCnes) && profile?.unit_cnes === unitCnes;
}

export function canManageTerritoryPoint(profile, userId, point) {
  if (!point || !isActiveProfile(profile)) return false;
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

export function canChangeAccessStatus(actorProfile, targetProfile) {
  if (!targetProfile || targetProfile.role === ROLES.ADMIN) return false;
  if (isMaster(actorProfile)) return true;
  return isUnitAdmin(actorProfile)
    && targetProfile.unit_cnes
    && targetProfile.unit_cnes === actorProfile.unit_cnes
    && targetProfile.id !== actorProfile.id;
}
