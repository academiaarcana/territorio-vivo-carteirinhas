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
  'supabase/migrations/010_territory_points.sql',
  'supabase/migrations/012_unit_admin_roles_and_policies.sql',
  'supabase/migrations/013_harden_unit_admin_and_territory_scope.sql',
  'supabase/migrations/014_restrict_territory_point_reads_by_unit.sql',
  'supabase/migrations/015_protect_unit_admin_institutional_scope.sql',
  'supabase/migrations/016_profile_access_approval_and_membership.sql',
  'supabase/migrations/017_restrict_unit_admin_access_status_management.sql',
  'supabase/migrations/018_canonicalize_profile_network_labels.sql',
  'supabase/migrations/019_restrict_unit_admin_profile_updates_to_acs.sql',
  'supabase/migrations/020_protect_approved_profile_microarea_scope.sql',
  'supabase/migrations/021_least_privilege_unit_admin_visibility.sql'
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

const migration10 = read('supabase/migrations/010_territory_points.sql');
expect(migration10, 'new.created_by := auth.uid()', 'autoria territorial precisa ser definida pelo banco no insert');
expect(migration10, 'new.created_by := old.created_by', 'autoria territorial precisa ser imutável em updates');
expect(migration10, 'revoke all on public.territory_points from anon', 'territory_points não pode conceder acesso anônimo');

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
expect(migration16, "role = 'admin'\n      and access_status = 'active'", 'master suspenso não pode manter privilégio administrativo');
expect(migration16, "role = 'unit_admin' and access_status = 'active'", 'administrador de UBS suspenso não pode manter privilégio administrativo');
expect(migration16, 'initial_status := case', 'novas contas precisam nascer pendentes, exceto master');
expect(migration16, 'O usuário não pode alterar o próprio status de acesso', 'usuário não pode se autoaprovar');

const migration17 = read('supabase/migrations/017_restrict_unit_admin_access_status_management.sql');
expect(migration17, "old.role <> 'acs'", 'unit_admin só pode aprovar ou suspender perfil profissional');
expect(migration17, 'Somente o master pode alterar o acesso de administradores', 'administradores devem ser controlados pelo master');

const migration18 = read('supabase/migrations/018_canonicalize_profile_network_labels.sql');
expect(migration18, 'new.unit_name := resolved_unit_name', 'nome da unidade no perfil deve vir do cadastro institucional');
expect(migration18, 'new.team_name := resolved_team_name', 'nome da equipe vinculada deve vir do cadastro institucional');
expect(migration18, "new.role <> 'admin' and new.access_status = 'active'", 'perfil profissional ativo precisa exigir UBS válida');

const migration19 = read('supabase/migrations/019_restrict_unit_admin_profile_updates_to_acs.sql');
expect(migration19, "and role = 'acs'", 'unit_admin só pode atualizar perfil profissional dentro da própria UBS');
expect(migration19, 'unit_cnes = private.current_unit_cnes()', 'edição local de perfil precisa permanecer na própria UBS');
expect(migration19, 'profiles_update_by_scope', 'policy de atualização de perfis precisa estar versionada');

const migration20 = read('supabase/migrations/020_protect_approved_profile_microarea_scope.sql');
expect(migration20, 'new.microarea is distinct from old.microarea', 'microárea precisa integrar o vínculo territorial protegido');
expect(migration20, "old.role = 'acs' and old.access_status <> 'pending'", 'ACS aprovado não pode alterar o próprio escopo');
expect(migration20, 'Profissional ativo não pode alterar o próprio vínculo institucional', 'tentativa de alteração do vínculo aprovado precisa falhar no banco');
expect(migration20, 'before update of id, access_status, municipality_code, unit_cnes, team_id, microarea, unit_name, team_name', 'trigger precisa observar todo o vínculo territorial');

const migration21 = read('supabase/migrations/021_least_privilege_unit_admin_visibility.sql');
expect(migration21, "and role = 'acs'", 'unit_admin só deve enxergar perfis profissionais da própria UBS além de si mesmo');
expect(migration21, 'or private.is_unit_admin_for(unit_cnes)', 'unit_admin precisa enxergar equipes inativas da própria UBS para poder reativá-las');
expect(migration21, 'or private.is_unit_admin_for(cnes)', 'unit_admin precisa enxergar a própria unidade mesmo se ficar inativa');

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

const profilePage = read('src/pages/profile.js');
expect(profilePage, 'scopeLocked', 'perfil ativo precisa refletir vínculo territorial bloqueado na interface');

const adminPage = read('src/pages/admin.js');
expect(adminPage, 'canEditManagedProfile', 'gestão local não deve oferecer edição de perfis administrativos protegidos');

const accessService = read('src/services/access.js');
if (accessService.includes("'role'")) errors.push('Serviço de aprovação não deve alterar papel de acesso junto com status.');

for (const file of ['src/pages/cards.js','src/pages/five.js','src/pages/indicators.js']) {
  const content = read(file);
  for (const forbidden of ['localStorage','sessionStorage','indexedDB']) {
    if (content.includes(forbidden)) errors.push(`${file} não pode persistir dados temporários via ${forbidden}.`);
  }
  if (/from\s+['"][^'"]*(supabase|repository)\.js['"]/.test(content)) {
    errors.push(`${file} não pode importar camada de persistência; seus dados devem permanecer temporários.`);
  }
}

expect(read('src/pages/cards.js'), 'não são gravados no banco', 'carteirinhas devem declarar não persistência ao usuário');
expect(read('src/pages/five.js'), 'não é salvo no banco', '5 minutos deve declarar não persistência ao usuário');
expect(read('src/pages/indicators.js'), 'não é salvo automaticamente', 'indicadores devem declarar não persistência ao usuário');

if (errors.length) {
  console.error('\nCONTRATO DE SEGURANÇA FALHOU\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Contrato de segurança V2 OK: aprovação, menor privilégio, escopos, autoria, dados temporários e privacidade versionados.');

function read(file) {
  const target = path.join(root, file);
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
}

function expect(content, needle, description) {
  if (!content.includes(needle)) errors.push(description);
}
