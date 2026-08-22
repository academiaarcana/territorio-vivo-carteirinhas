import assert from 'node:assert/strict';
import {
  ACCESS_STATUS, ROLES,
  isActiveProfile, isMaster, isUnitAdmin, isManagement,
  canManageUnit, canManageTerritoryPoint, canChangeProfileRole, canChangeAccessStatus
} from '../src/core/permissions.js';

const acsA = { id: 'acs-a', role: ROLES.ACS, access_status: ACCESS_STATUS.ACTIVE, unit_cnes: 'UNIT-A' };
const acsB = { id: 'acs-b', role: ROLES.ACS, access_status: ACCESS_STATUS.ACTIVE, unit_cnes: 'UNIT-B' };
const pendingA = { ...acsA, id: 'pending-a', access_status: ACCESS_STATUS.PENDING };
const suspendedA = { ...acsA, id: 'suspended-a', access_status: ACCESS_STATUS.SUSPENDED };
const unitAdminA = { id: 'unit-admin-a', role: ROLES.UNIT_ADMIN, access_status: ACCESS_STATUS.ACTIVE, unit_cnes: 'UNIT-A' };
const unitAdminB = { id: 'unit-admin-b', role: ROLES.UNIT_ADMIN, access_status: ACCESS_STATUS.ACTIVE, unit_cnes: 'UNIT-B' };
const suspendedUnitAdminA = { ...unitAdminA, access_status: ACCESS_STATUS.SUSPENDED };
const master = { id: 'master', role: ROLES.ADMIN, access_status: ACCESS_STATUS.ACTIVE, unit_cnes: 'UNIT-A' };
const suspendedMaster = { ...master, access_status: ACCESS_STATUS.SUSPENDED };

const ownPointA = { id: 'point-own', created_by: acsA.id, unit_cnes: 'UNIT-A' };
const otherPointA = { id: 'point-other', created_by: 'other-user', unit_cnes: 'UNIT-A' };
const pointB = { id: 'point-b', created_by: acsA.id, unit_cnes: 'UNIT-B' };

assert.equal(isActiveProfile(acsA), true);
assert.equal(isActiveProfile(pendingA), false);
assert.equal(isActiveProfile(suspendedA), false);

assert.equal(isMaster(master), true);
assert.equal(isMaster(suspendedMaster), false, 'master suspenso não pode manter privilégio');
assert.equal(isUnitAdmin(unitAdminA), true);
assert.equal(isUnitAdmin(suspendedUnitAdminA), false, 'unit_admin suspenso não pode manter privilégio');
assert.equal(isManagement(acsA), false);
assert.equal(isManagement(unitAdminA), true);
assert.equal(isManagement(master), true);

assert.equal(canManageUnit(master, 'UNIT-B'), true);
assert.equal(canManageUnit(unitAdminA, 'UNIT-A'), true);
assert.equal(canManageUnit(unitAdminA, 'UNIT-B'), false);
assert.equal(canManageUnit(suspendedUnitAdminA, 'UNIT-A'), false);
assert.equal(canManageUnit(acsA, 'UNIT-A'), false);

assert.equal(canManageTerritoryPoint(acsA, acsA.id, ownPointA), true);
assert.equal(canManageTerritoryPoint(acsA, acsA.id, otherPointA), false, 'ACS não gerencia ponto de outro autor');
assert.equal(canManageTerritoryPoint(acsA, acsA.id, pointB), false, 'ACS não gerencia ponto de outra UBS');
assert.equal(canManageTerritoryPoint(pendingA, pendingA.id, ownPointA), false, 'conta pendente não gerencia território');
assert.equal(canManageTerritoryPoint(suspendedA, suspendedA.id, ownPointA), false, 'conta suspensa não gerencia território');
assert.equal(canManageTerritoryPoint(unitAdminA, unitAdminA.id, otherPointA), true);
assert.equal(canManageTerritoryPoint(unitAdminA, unitAdminA.id, pointB), false);
assert.equal(canManageTerritoryPoint(unitAdminB, unitAdminB.id, pointB), true);
assert.equal(canManageTerritoryPoint(master, master.id, pointB), true);

assert.equal(canChangeProfileRole(master, acsA), true);
assert.equal(canChangeProfileRole(master, unitAdminA), true);
assert.equal(canChangeProfileRole(master, master), false, 'papel master não pode ser alterado pelo frontend');
assert.equal(canChangeProfileRole(unitAdminA, acsA), false);
assert.equal(canChangeProfileRole(suspendedMaster, acsA), false);

assert.equal(canChangeAccessStatus(master, acsA), true);
assert.equal(canChangeAccessStatus(master, unitAdminA), true);
assert.equal(canChangeAccessStatus(master, master), false);
assert.equal(canChangeAccessStatus(unitAdminA, acsA), true);
assert.equal(canChangeAccessStatus(unitAdminA, acsB), false, 'unit_admin não aprova outra UBS');
assert.equal(canChangeAccessStatus(unitAdminA, unitAdminB), false, 'unit_admin não controla outro administrador');
assert.equal(canChangeAccessStatus(suspendedUnitAdminA, acsA), false);

console.log('Matriz de permissões do frontend OK: pending/active/suspended, ACS, unit_admin e master.');
