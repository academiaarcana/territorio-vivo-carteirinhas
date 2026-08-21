import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];

const mustExist = [
  'src/core/permissions.js',
  'src/services/access.js',
  'src/pages/access-pending.js',
  'src/pages/access-management.js',
  'supabase/migrations/012_unit_admin_roles_and_policies.sql',
  'supabase/migrations/013_harden_unit_admin_and_territory_scope.sql',
  'supabase/migrations/014_restrict_territory_point_reads_by_unit.sql',
  'supabase/migrations/015_protect_unit_admin_institutional_scope.sql',
  'supabase/migrations/016_profile_access_approval_and_membership.sql',
  'supabase/migrations/017_restrict_unit_admin_access_status_management.sql',
  'supabase/migrations/018_canonicalize_profile_network_labels.sql'
];

for (const file of mustExist) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Contrato ausente: ${file}`);
}

const permissions = read('src/core/permissions.js');
expect(permissions, "UNIT_ADMIN: 'unit_admin'", 'frontend precisa conhecer unit_admin');
expect(permissions, "PENDING: 'pending'", 'frontend precisa conhecer conta pendente');
expect(permissions, 'isActiveProfile', 'frontend precisa centralizar perfil ativo');
expect(permissions, 'isManagement', 'frontend precisa centralizar acesso de gestão');
expect(permissions, 'canManageTerritoryPoint', 'frontend precisa centralizar gestão territorial');
expect(permissions, 'canChangeAccessStatus', 'frontend precisa centralizar aprovação de acessos');

const main = read('src/main.js');
expect(main, 'management: true', 'rota de gestão deve exigir nível de gestão');
expect(main, 'active: true', 'rotas internas devem exigir perfil aprovado');
expect(main, "'/app/aguardando'", 'perfil não aprovado precisa de rota segura de espera');

const migration12 = read('supabase/migrations/012_unit_admin_roles_and_policies.sql');
expect(migration12, "role in ('acs','unit_admin','admin')", 'constraint de papéis deve conter os três níveis');
expect(migration12, 'private.is_unit_admin_for', 'RLS de unit_admin precisa ser baseado na própria UBS');
expect(migration12, 'profiles_select_by_scope', 'perfis precisam de policy por escopo');

const migration13 = read('supabase/migrations/013_harden_unit_admin_and_territory_scope.sql');
expect(migration13, 'Administrador de UBS não pode alterar a própria unidade de gestão', 'unit_admin não pode mover o próprio escopo');
expect(migration13, 'current_team_id', 'ponto territorial de ACS precisa respeitar a equipe');
expect(migration13, 'unit_cnes = private.current_unit_cnes()', 'escrita territorial de ACS precisa ficar na própria UBS');

const migration14 = read('supabase/migrations/014_restrict_territory_point_reads_by_unit.sql');
expect(migration14, 'territory_points_select_by_scope', 'leitura territorial precisa de policy de escopo');
expect(migration14, 'unit_cnes = private.current_unit_cnes()', 'leitura territorial não deve vazar para outras UBS');

const migration15 = read('supabase/migrations/015_protect_unit_admin_institutional_scope.sql');
expect(migration15, 'protect_health_unit_structure', 'alterações estruturais da UBS precisam de trigger protetor');
expect(migration15, 'new.is_active is distinct from old.is_active', 'unit_admin não pode ativar/desativar UBS via API');
expect(migration15, 'new.municipality_code is distinct from old.municipality_code', 'unit_admin não pode mover UBS entre municípios');

const migration16 = read('supabase/migrations/016_profile_access_approval_and_membership.sql');
expect(migration16, "access_status in ('pending','active','suspended')", 'perfil precisa ter ciclo de aprovação explícito');
expect(migration16, 'private.is_active_member()', 'acesso territorial precisa exigir membro ativo');
expect(migration16, "initial_status := case", 'novas contas precisam nascer pendentes, exceto master');
expect(migration16, 'O usuário não pode alterar o próprio status de acesso', 'usuário não pode se autoaprovar');
expect(migration16, 'Profissional ativo não pode alterar o próprio vínculo institucional', 'ACS ativo não pode trocar o próprio escopo');

const migration17 = read('supabase/migrations/017_restrict_unit_admin_access_status_management.sql');
expect(migration17, "old.role <> 'acs'", 'unit_admin só pode aprovar ou suspender perfil profissional');
expect(migration17, 'Somente o master pode alterar o acesso de administradores', 'administradores devem ser controlados pelo master');

const migration18 = read('supabase/migrations/018_canonicalize_profile_network_labels.sql');
expect(migration18, 'new.unit_name := resolved_unit_name', 'nome da unidade no perfil deve vir do cadastro institucional');
expect(migration18, 'new.team_name := resolved_team_name', 'nome da equipe vinculada deve vir do cadastro institucional');
expect(migration18, "new.role <> 'admin' and new.access_status = 'active'", 'perfil profissional ativo precisa exigir UBS válida');
expect(migration18, 'new.unit_name is distinct from old.unit_name', 'rótulo textual da UBS deve participar da proteção do escopo');
expect(migration18, 'new.team_name is distinct from old.team_name', 'rótulo textual da equipe deve participar da proteção do escopo');

const index = read('index.html');
if (/service[_-]?role/i.test(index)) errors.push('index.html não pode conter chave/função service role.');
const config = read('config.js');
if (/service[_-]?role/i.test(config)) errors.push('config.js não pode conter service role.');

const territory = read('src/pages/territory.js');
expect(territory, 'não pessoais', 'módulo territorial deve exibir fronteira de privacidade');
expect(territory, 'canManageTerritoryPoint', 'ações territoriais devem respeitar a camada de permissão');

const pendingPage = read('src/pages/access-pending.js');
expect(pendingPage, 'Verificar aprovação', 'perfil pendente precisa conseguir consultar aprovação');
expect(pendingPage, 'Depois da aprovação', 'onboarding precisa explicar que vínculo aprovado fica protegido');

const accessService = read('src/services/access.js');
if (accessService.includes("'role'")) errors.push('Serviço de aprovação não deve alterar papel de acesso junto com status.');

if (errors.length) {
  console.error('\nCONTRATO DE SEGURANÇA FALHOU\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Contrato de segurança V2 OK: aprovação, papéis, escopos, vínculo canônico e privacidade versionados.');

function read(file) {
  const target = path.join(root, file);
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
}

function expect(content, needle, description) {
  if (!content.includes(needle)) errors.push(description);
}
