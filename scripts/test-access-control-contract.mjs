import assert from 'node:assert/strict';
import {
  ACCESS_LEVELS, ACCESS_STATES, ACCOUNT_ROLES, CAPABILITIES,
  accessScope, capabilitiesFor, hasCapability, resolveAccessLevel
} from '../src/core/access-control.js';

const pending = { role: ACCOUNT_ROLES.ACS, access_status: ACCESS_STATES.PENDING, municipality_code: 'M-A', unit_cnes: 'U-A', team_id: 'T-A', microarea: '08' };
const acs = { ...pending, access_status: ACCESS_STATES.ACTIVE };
const unitAdmin = { ...acs, role: ACCOUNT_ROLES.UNIT_ADMIN };
const master = { ...acs, role: ACCOUNT_ROLES.ADMIN };
const suspendedMaster = { ...master, access_status: ACCESS_STATES.SUSPENDED };

assert.equal(resolveAccessLevel(null), ACCESS_LEVELS.VISITOR);
assert.equal(resolveAccessLevel(pending), ACCESS_LEVELS.ACS_PENDING);
assert.equal(resolveAccessLevel(acs), ACCESS_LEVELS.ACS_ACTIVE);
assert.equal(resolveAccessLevel(unitAdmin), ACCESS_LEVELS.UNIT_ADMIN_ACTIVE);
assert.equal(resolveAccessLevel(master), ACCESS_LEVELS.MASTER_ACTIVE);
assert.equal(resolveAccessLevel(suspendedMaster), ACCESS_LEVELS.SUSPENDED);
assert.equal(resolveAccessLevel({ role: ACCOUNT_ROLES.ADMIN, access_status: ACCESS_STATES.PENDING }), ACCESS_LEVELS.DENIED, 'Master pendente é combinação inválida e deve falhar fechada.');
assert.equal(resolveAccessLevel({ role: ACCOUNT_ROLES.UNIT_ADMIN, access_status: ACCESS_STATES.PENDING }), ACCESS_LEVELS.DENIED, 'Administrador local pendente não recebe privilégios.');
assert.equal(resolveAccessLevel({ role: 'unknown', access_status: ACCESS_STATES.ACTIVE }), ACCESS_LEVELS.DENIED, 'Papel desconhecido deve falhar fechado.');

assert.equal(hasCapability(null, CAPABILITIES.CREATE_ACCOUNT), true);
assert.equal(hasCapability(pending, CAPABILITIES.EDIT_REQUESTED_SCOPE), true);
assert.equal(hasCapability(pending, CAPABILITIES.ACCESS_INTERNAL), false);
assert.equal(hasCapability(acs, CAPABILITIES.USE_TEMPORARY_TOOLS), true);
assert.equal(hasCapability(acs, CAPABILITIES.MANAGE_UNIT), false);
assert.equal(hasCapability(unitAdmin, CAPABILITIES.APPROVE_UNIT_ACS), true);
assert.equal(hasCapability(unitAdmin, CAPABILITIES.MANAGE_NETWORK), false);
assert.equal(hasCapability(master, CAPABILITIES.MANAGE_NETWORK), true);
assert.equal(hasCapability(master, CAPABILITIES.MANAGE_INSTITUTIONAL_IDENTITY), true);
assert.equal(hasCapability(suspendedMaster, CAPABILITIES.ACCESS_INTERNAL), false);
assert.equal(hasCapability(suspendedMaster, CAPABILITIES.MANAGE_NETWORK), false);
assert.deepEqual(capabilitiesFor({ role: 'invalid', access_status: 'invalid' }), []);

assert.deepEqual(accessScope(pending), { kind: 'requested', municipalityCode: 'M-A', unitCnes: 'U-A', teamId: 'T-A', microarea: '08' });
assert.deepEqual(accessScope(acs), { kind: 'professional', municipalityCode: 'M-A', unitCnes: 'U-A', teamId: 'T-A', microarea: '08' });
assert.deepEqual(accessScope(unitAdmin), { kind: 'unit', municipalityCode: 'M-A', unitCnes: 'U-A' });
assert.deepEqual(accessScope(master), { kind: 'network' }, 'Vínculo histórico não pode limitar a Conta Master.');
assert.deepEqual(accessScope(suspendedMaster), { kind: 'none' });

console.log('Contrato de acesso OK: estado, papel, capacidade e escopo resolvidos com negação por padrão.');
