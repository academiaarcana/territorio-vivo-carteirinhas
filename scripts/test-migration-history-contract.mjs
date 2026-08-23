import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const migrationsDir = path.join(root, 'supabase', 'migrations');
const historyPath = path.join(root, 'docs', 'MIGRATION_HISTORY.md');
const errors = [];

if (!fs.existsSync(migrationsDir)) errors.push('Diretório supabase/migrations ausente.');
if (!fs.existsSync(historyPath)) errors.push('docs/MIGRATION_HISTORY.md ausente.');

if (!errors.length) {
  const files = fs.readdirSync(migrationsDir)
    .filter((name) => /^\d{3}_.+\.sql$/.test(name))
    .sort();
  const history = fs.readFileSync(historyPath, 'utf8');

  if (!files.length) errors.push('Nenhuma migration numerada encontrada.');

  files.forEach((file, index) => {
    const expectedPrefix = String(index + 1).padStart(3, '0') + '_';
    if (!file.startsWith(expectedPrefix)) {
      errors.push(`Sequência de migrations quebrada: esperado prefixo ${expectedPrefix}, encontrado ${file}.`);
    }
    if (!history.includes(`\`${file}\``)) {
      errors.push(`Histórico não referencia a migration ${file}.`);
    }
  });

  for (const hotfix of ['harden_profile_functions', 'restrict_master_role_trigger_search_path']) {
    if (!history.includes(`\`${hotfix}\``)) errors.push(`Histórico não documenta o hotfix ${hotfix}.`);
  }

  const numberedInHistory = [...history.matchAll(/`(\d{3}_[^`]+\.sql)`/g)].map((match) => match[1]);
  const unknown = [...new Set(numberedInHistory)].filter((file) => !files.includes(file));
  if (unknown.length) errors.push(`Histórico referencia migrations numeradas inexistentes: ${unknown.join(', ')}.`);
}

if (errors.length) {
  console.error('\nCONTRATO DO HISTÓRICO DE MIGRATIONS FALHOU\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Histórico de migrations OK: sequência local completa e documentação sincronizada.');
