import {
  ACCESS_LEVELS, ACCESS_STATES, ACCOUNT_ROLES, CAPABILITIES,
  hasCapability, resolveAccessLevel
} from './access-control.js';

export const ROLES = ACCOUNT_ROLES;
export const ACCESS_STATUS = ACCESS_STATES;

export function isActiveProfile(profile) {
  return hasCapability(profile, CAPABILITIES.ACCESS_INTERNAL);
}

export function isPendingProfile(profile) {
  return resolveAccessLevel(profile) === ACCESS_LEVELS.ACS_PENDING;
}

export function isSuspendedProfile(profile) {
  return resolveAccessLevel(profile) === ACCESS_LEVELS.SUSPENDED;
}

export function isMaster(profile) {
  return resolveAccessLevel(profile) === ACCESS_LEVELS.MASTER_ACTIVE;
}

export function isUnitAdmin(profile) {
  return resolveAccessLevel(profile) === ACCESS_LEVELS.UNIT_ADMIN_ACTIVE;
}

export function isManagement(profile) {
  return hasCapability(profile, CAPABILITIES.MANAGE_UNIT_PROFESSIONALS);
}

export function roleLabel(profileOrRole) {
  const role = typeof profileOrRole === 'string' ? profileOrRole : profileOrRole?.role;
  if (role === ROLES.ADMIN) return 'Conta Master';
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
  if (hasCapability(profile, CAPABILITIES.MANAGE_NETWORK)) return true;
  return hasCapability(profile, CAPABILITIES.MANAGE_UNIT) && Boolean(unitCnes) && profile?.unit_cnes === unitCnes;
}

export function canManageTerritoryPoint(profile, userId, point) {
  if (!point) return false;
  if (hasCapability(profile, CAPABILITIES.MANAGE_ALL_TERRITORY)) return true;
  if (hasCapability(profile, CAPABILITIES.MANAGE_UNIT_TERRITORY)) return Boolean(point.unit_cnes) && point.unit_cnes === profile?.unit_cnes;
  return hasCapability(profile, CAPABILITIES.UPDATE_OWN_TERRITORY_POINT)
    && Boolean(userId)
    && point.created_by === userId
    && Boolean(point.unit_cnes)
    && point.unit_cnes === profile?.unit_cnes;
}

export function canChangeProfileRole(actorProfile, targetProfile) {
  return hasCapability(actorProfile, CAPABILITIES.ASSIGN_UNIT_ADMIN) && targetProfile?.role !== ROLES.ADMIN;
}

export function canChangeAccessStatus(actorProfile, targetProfile) {
  if (!targetProfile || targetProfile.role === ROLES.ADMIN) return false;
  if (hasCapability(actorProfile, CAPABILITIES.CHANGE_NON_MASTER_ACCESS)) return true;
  return hasCapability(actorProfile, CAPABILITIES.APPROVE_UNIT_ACS)
    && targetProfile.role === ROLES.ACS
    && targetProfile.unit_cnes
    && targetProfile.unit_cnes === actorProfile.unit_cnes
    && targetProfile.id !== actorProfile.id;
}
