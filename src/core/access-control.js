export const ACCOUNT_ROLES = Object.freeze({
  ACS: 'acs',
  PHYSICIAN: 'physician',
  NURSE: 'nurse',
  UNIT_ADMIN: 'unit_admin',
  ADMIN: 'admin'
});

export const ACCESS_STATES = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended'
});

export const ACCESS_LEVELS = Object.freeze({
  VISITOR: 'visitor',
  ACS_PENDING: 'acs_pending',
  ACS_ACTIVE: 'acs_active',
  CLINICAL_PENDING: 'clinical_pending',
  PHYSICIAN_ACTIVE: 'physician_active',
  NURSE_ACTIVE: 'nurse_active',
  UNIT_ADMIN_ACTIVE: 'unit_admin_active',
  MASTER_ACTIVE: 'master_active',
  SUSPENDED: 'suspended',
  DENIED: 'denied'
});

export const CAPABILITIES = Object.freeze({
  VIEW_PUBLIC_SITE: 'view_public_site',
  VIEW_PUBLIC_CATALOG: 'view_public_catalog',
  CREATE_ACCOUNT: 'create_account',
  VIEW_ACCESS_GATE: 'view_access_gate',
  READ_OWN_PROFILE: 'read_own_profile',
  EDIT_REQUESTED_SCOPE: 'edit_requested_scope',
  ACCESS_INTERNAL: 'access_internal',
  USE_TEMPORARY_TOOLS: 'use_temporary_tools',
  VIEW_TREATMENT_GUIDES: 'view_treatment_guides',
  USE_EXTERNAL_PRESCRIPTIONS: 'use_external_prescriptions',
  EDIT_OWN_PROFILE_DATA: 'edit_own_profile_data',
  READ_UNIT_TERRITORY: 'read_unit_territory',
  CREATE_OWN_TERRITORY_POINT: 'create_own_territory_point',
  UPDATE_OWN_TERRITORY_POINT: 'update_own_territory_point',
  DELETE_OWN_TERRITORY_POINT: 'delete_own_territory_point',
  MANAGE_UNIT: 'manage_unit',
  MANAGE_UNIT_PROFESSIONALS: 'manage_unit_professionals',
  APPROVE_UNIT_ACS: 'approve_unit_acs',
  MANAGE_UNIT_TEAMS: 'manage_unit_teams',
  UPDATE_UNIT_OPERATIONS: 'update_unit_operations',
  MANAGE_UNIT_TERRITORY: 'manage_unit_territory',
  MANAGE_NETWORK: 'manage_network',
  MANAGE_MUNICIPALITIES: 'manage_municipalities',
  MANAGE_UNITS: 'manage_units',
  MANAGE_TEAMS: 'manage_teams',
  MANAGE_PROFILES: 'manage_profiles',
  ASSIGN_UNIT_ADMIN: 'assign_unit_admin',
  CHANGE_NON_MASTER_ACCESS: 'change_non_master_access',
  MANAGE_ALL_TERRITORY: 'manage_all_territory',
  MANAGE_INSTITUTIONAL_IDENTITY: 'manage_institutional_identity',
  SIGN_OUT: 'sign_out'
});

const BASE_ACTIVE = [
  CAPABILITIES.ACCESS_INTERNAL,
  CAPABILITIES.USE_TEMPORARY_TOOLS,
  CAPABILITIES.VIEW_TREATMENT_GUIDES,
  CAPABILITIES.READ_OWN_PROFILE,
  CAPABILITIES.EDIT_OWN_PROFILE_DATA,
  CAPABILITIES.READ_UNIT_TERRITORY,
  CAPABILITIES.CREATE_OWN_TERRITORY_POINT,
  CAPABILITIES.UPDATE_OWN_TERRITORY_POINT,
  CAPABILITIES.DELETE_OWN_TERRITORY_POINT,
  CAPABILITIES.SIGN_OUT
];

const CAPABILITY_MATRIX = Object.freeze({
  [ACCESS_LEVELS.VISITOR]: Object.freeze([
    CAPABILITIES.VIEW_PUBLIC_SITE,
    CAPABILITIES.VIEW_PUBLIC_CATALOG,
    CAPABILITIES.CREATE_ACCOUNT
  ]),
  [ACCESS_LEVELS.ACS_PENDING]: Object.freeze([
    CAPABILITIES.VIEW_ACCESS_GATE,
    CAPABILITIES.READ_OWN_PROFILE,
    CAPABILITIES.EDIT_REQUESTED_SCOPE,
    CAPABILITIES.SIGN_OUT
  ]),
  [ACCESS_LEVELS.CLINICAL_PENDING]: Object.freeze([
    CAPABILITIES.VIEW_ACCESS_GATE,
    CAPABILITIES.READ_OWN_PROFILE,
    CAPABILITIES.EDIT_REQUESTED_SCOPE,
    CAPABILITIES.SIGN_OUT
  ]),
  [ACCESS_LEVELS.ACS_ACTIVE]: Object.freeze([...BASE_ACTIVE]),
  [ACCESS_LEVELS.PHYSICIAN_ACTIVE]: Object.freeze([
    ...BASE_ACTIVE,
    CAPABILITIES.USE_EXTERNAL_PRESCRIPTIONS
  ]),
  [ACCESS_LEVELS.NURSE_ACTIVE]: Object.freeze([
    ...BASE_ACTIVE,
    CAPABILITIES.USE_EXTERNAL_PRESCRIPTIONS
  ]),
  [ACCESS_LEVELS.UNIT_ADMIN_ACTIVE]: Object.freeze([
    ...BASE_ACTIVE,
    CAPABILITIES.MANAGE_UNIT,
    CAPABILITIES.MANAGE_UNIT_PROFESSIONALS,
    CAPABILITIES.APPROVE_UNIT_ACS,
    CAPABILITIES.MANAGE_UNIT_TEAMS,
    CAPABILITIES.UPDATE_UNIT_OPERATIONS,
    CAPABILITIES.MANAGE_UNIT_TERRITORY
  ]),
  [ACCESS_LEVELS.MASTER_ACTIVE]: Object.freeze([
    ...BASE_ACTIVE,
    CAPABILITIES.MANAGE_UNIT,
    CAPABILITIES.MANAGE_UNIT_PROFESSIONALS,
    CAPABILITIES.APPROVE_UNIT_ACS,
    CAPABILITIES.MANAGE_UNIT_TEAMS,
    CAPABILITIES.UPDATE_UNIT_OPERATIONS,
    CAPABILITIES.MANAGE_UNIT_TERRITORY,
    CAPABILITIES.MANAGE_NETWORK,
    CAPABILITIES.MANAGE_MUNICIPALITIES,
    CAPABILITIES.MANAGE_UNITS,
    CAPABILITIES.MANAGE_TEAMS,
    CAPABILITIES.MANAGE_PROFILES,
    CAPABILITIES.ASSIGN_UNIT_ADMIN,
    CAPABILITIES.CHANGE_NON_MASTER_ACCESS,
    CAPABILITIES.MANAGE_ALL_TERRITORY,
    CAPABILITIES.MANAGE_INSTITUTIONAL_IDENTITY
  ]),
  [ACCESS_LEVELS.SUSPENDED]: Object.freeze([
    CAPABILITIES.VIEW_ACCESS_GATE,
    CAPABILITIES.READ_OWN_PROFILE,
    CAPABILITIES.SIGN_OUT
  ]),
  [ACCESS_LEVELS.DENIED]: Object.freeze([])
});

export function resolveAccessLevel(profile) {
  if (!profile) return ACCESS_LEVELS.VISITOR;
  if (profile.access_status === ACCESS_STATES.SUSPENDED) return ACCESS_LEVELS.SUSPENDED;
  if (profile.role === ACCOUNT_ROLES.ACS && profile.access_status === ACCESS_STATES.PENDING) return ACCESS_LEVELS.ACS_PENDING;
  if (profile.role === ACCOUNT_ROLES.ACS && profile.access_status === ACCESS_STATES.ACTIVE) return ACCESS_LEVELS.ACS_ACTIVE;
  if ([ACCOUNT_ROLES.PHYSICIAN, ACCOUNT_ROLES.NURSE].includes(profile.role) && profile.access_status === ACCESS_STATES.PENDING) return ACCESS_LEVELS.CLINICAL_PENDING;
  if (profile.role === ACCOUNT_ROLES.PHYSICIAN && profile.access_status === ACCESS_STATES.ACTIVE) return ACCESS_LEVELS.PHYSICIAN_ACTIVE;
  if (profile.role === ACCOUNT_ROLES.NURSE && profile.access_status === ACCESS_STATES.ACTIVE) return ACCESS_LEVELS.NURSE_ACTIVE;
  if (profile.role === ACCOUNT_ROLES.UNIT_ADMIN && profile.access_status === ACCESS_STATES.ACTIVE) return ACCESS_LEVELS.UNIT_ADMIN_ACTIVE;
  if (profile.role === ACCOUNT_ROLES.ADMIN && profile.access_status === ACCESS_STATES.ACTIVE) return ACCESS_LEVELS.MASTER_ACTIVE;
  return ACCESS_LEVELS.DENIED;
}

export function capabilitiesFor(profile) {
  return CAPABILITY_MATRIX[resolveAccessLevel(profile)] || CAPABILITY_MATRIX[ACCESS_LEVELS.DENIED];
}

export function hasCapability(profile, capability) {
  return capabilitiesFor(profile).includes(capability);
}

export function accessScope(profile) {
  const level = resolveAccessLevel(profile);
  if (level === ACCESS_LEVELS.MASTER_ACTIVE) return Object.freeze({ kind: 'network' });
  if (level === ACCESS_LEVELS.UNIT_ADMIN_ACTIVE) {
    return Object.freeze({ kind: 'unit', municipalityCode: profile.municipality_code || null, unitCnes: profile.unit_cnes || null });
  }
  if ([ACCESS_LEVELS.ACS_ACTIVE, ACCESS_LEVELS.PHYSICIAN_ACTIVE, ACCESS_LEVELS.NURSE_ACTIVE].includes(level)) {
    return Object.freeze({ kind: 'professional', municipalityCode: profile.municipality_code || null, unitCnes: profile.unit_cnes || null, teamId: profile.team_id || null, microarea: profile.microarea || null });
  }
  if ([ACCESS_LEVELS.ACS_PENDING, ACCESS_LEVELS.CLINICAL_PENDING].includes(level)) {
    return Object.freeze({ kind: 'requested', municipalityCode: profile.municipality_code || null, unitCnes: profile.unit_cnes || null, teamId: profile.team_id || null, microarea: profile.microarea || null });
  }
  return Object.freeze({ kind: 'none' });
}
