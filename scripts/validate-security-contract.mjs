import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];

const mustExist = [
  'src/core/permissions.js',
  'supabase/migrations/012_unit_admin_roles_and_policies.sql',
  'supabase/migrations/013_harden_unit_admin_and_territory_scope.sql',
  'supabase/migrations/014_restrict_territory_point_reads_by_unit.sql'
];

for (const file of mustExist) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Contrato ausente: ${file}`);
}

const permissions = read('src/core/permissions.js');
expect(permissions, "UNIT_ADMIN: 'unit_admin'", 'frontend precisa conhecer unit_admin');
expect(permissions, 'isManagement', 'frontend precisa centralizar acesso de gestão');
expect(permissions, 'canManageTerritoryPoint', 'frontend precisa centralizar gestão territorial');

const main = read('src/main.js');
expect(main, "management: true", 'rota de gestão deve exigir nível de gestão');

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

const index = read('index.html');
if (/service[_-]?role/i.test(index)) errors.push('index.html não pode conter chave/função service role.');
const config = read('config.js');
if (/service[_-]?role/i.test(config)) errors.push('config.js não pode conter service role.');

const territory = read('src/pages/territory.js');
expect(territory, 'não pessoais', 'módulo territorial deve exibir fronteira de privacidade');
expect(territory, 'canManageTerritoryPoint', 'ações territoriais devem respeitar a camada de permissão');

if (errors.length) {
  console.error('\nCONTRATO DE SEGURANÇA FALHOU\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Contrato de segurança V2 OK: papéis, escopos e fronteiras de privacidade versionados.');

function read(file) {
  const target = path.join(root, file);
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
}

function expect(content, needle, description) {
  if (!content.includes(needle)) errors.push(description);
}
