import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const expect = (content, needle, message) => {
  if (!content.includes(needle)) errors.push(message);
};

const migration = read('supabase/migrations/20260827161226_add_microareas_and_population_counts.sql');
const repository = read('src/services/repository.js');
const admin = read('src/pages/admin.js');
const databaseTest = read('supabase/tests/microareas_population_rls_test.sql');

expect(migration, 'create table public.microareas', 'Migration precisa criar a entidade de microáreas.');
expect(migration, 'team_id uuid not null references public.teams(id)', 'Cada microárea precisa pertencer a uma equipe.');
expect(migration, 'population_count integer', 'A microárea precisa aceitar o total agregado de pessoas.');
expect(migration, 'population_count is null or population_count >= 0', 'Total populacional precisa aceitar desconhecido, mas nunca valor negativo.');
expect(migration, 'population_count is not null and population_reference_date is not null', 'Todo total informado precisa registrar uma data de referência.');
expect(migration, "data_status in ('not_informed', 'local_confirmed', 'esus_report')", 'Origem do total precisa ser explícita.');
expect(migration, 'enable row level security', 'Microáreas precisam ter RLS habilitada.');
expect(migration, 'revoke all privileges on table public.microareas from anon', 'Microáreas não podem ser expostas ao papel anônimo.');
expect(migration, 'grant select, insert, update, delete on table public.microareas to authenticated', 'A nova tabela precisa ser explicitamente exposta à Data API autenticada.');
expect(migration, 'microareas_team_id_idx', 'Chave estrangeira de equipe precisa de índice próprio.');
expect(migration, 'profiles_microarea_id_idx', 'Chave estrangeira do perfil precisa de índice próprio.');
expect(migration, '(select private.is_unit_admin_for(t.unit_cnes))', 'Gestão local precisa permanecer limitada à própria UBS.');
expect(migration, 'microareas.team_id = (select private.current_team_id())', 'Profissional ativo precisa ler somente microáreas da própria equipe.');
expect(migration, 'microarea_id uuid references public.microareas(id)', 'Perfil ACS precisa referenciar a microárea normalizada.');
expect(migration, 'new.microarea_id is distinct from old.microarea_id', 'Autoalteração do novo escopo precisa ser bloqueada.');
expect(migration, 'create policy microareas_update_by_management_scope', 'Escrita precisa ter policy administrativa específica.');
expect(migration, 'with check (', 'Policy de atualização precisa validar também o estado novo da linha.');
if (/\b(patient|citizen|cpf|cns|medical_record|diagnosis)_(id|name|number|text)\b/i.test(migration)) {
  errors.push('Migration não pode introduzir colunas de dados pessoais ou clínicos.');
}

expect(repository, "supabase.from('microareas').select('*')", 'Camada de dados precisa listar microáreas.');
expect(repository, 'normalizePopulationCount', 'Entrada de população precisa ser validada no cliente.');
expect(repository, "populationCount === null) return { population_reference_date: null, data_status: 'not_informed'", 'Campo vazio precisa continuar “não informado”, sem virar zero.');

expect(admin, 'data-admin-tab="microareas"', 'Gestão precisa expor a área de microáreas.');
expect(admin, 'Pessoas acompanhadas', 'Editor precisa identificar o total agregado de pessoas.');
expect(admin, 'Não inclua nomes, CPF, CNS, diagnósticos ou dados de prontuário.', 'Interface precisa proibir dados pessoais e clínicos no agregado.');
expect(admin, 'zero só deve ser usado quando o relatório realmente registrar zero', 'Interface precisa diferenciar desconhecido de zero.');
expect(admin, 'microarea_id:', 'Vínculo do ACS precisa usar o identificador normalizado.');

expect(databaseTest, "SELECT plan(14)", 'Teste pgTAP precisa declarar todas as verificações de schema/RLS.');
expect(databaseTest, "NOT has_table_privilege('anon', 'public.microareas', 'SELECT')", 'Teste pgTAP precisa proteger o acesso anônimo.');
expect(databaseTest, "policyname = 'microareas_update_by_management_scope'", 'Teste pgTAP precisa verificar a policy de atualização.');

if (errors.length) {
  console.error('\nCONTRATO DA ESTRUTURA TERRITORIAL FALHOU\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Estrutura territorial OK: UBS, equipe, microárea, ACS e população agregada com menor privilégio.');
