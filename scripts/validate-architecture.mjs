import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const src = path.join(root, 'src');
const errors = [];

const required = [
  'index.html','config.js','src/main.js','src/core/store.js','src/core/router.js','src/core/layout.js','src/core/session.js',
  'src/services/supabase.js','src/services/auth.js','src/services/repository.js','src/data/cards.js','src/data/education.js',
  'src/pages/public.js','src/pages/auth.js','src/pages/dashboard.js','src/pages/territory.js','src/pages/cards.js','src/pages/five.js','src/pages/indicators.js',
  'src/pages/education.js','src/pages/profile.js','src/pages/admin.js','src/utils/print.js','src/styles/foundation.css'
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo obrigatório ausente: ${file}`);
}

const jsFiles = walk(src).filter((file) => file.endsWith('.js'));
for (const file of jsFiles) {
  const code = fs.readFileSync(file, 'utf8');
  for (const match of code.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = match[1];
    if (!spec.startsWith('.')) continue;
    const resolved = path.resolve(path.dirname(file), spec);
    if (!fs.existsSync(resolved)) errors.push(`Import quebrado em ${relative(file)}: ${spec}`);
  }
}

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const legacy of ['app.js','enhancements.js','multiunit.js','network-context.js','public-site.js']) {
  if (index.includes(legacy)) errors.push(`index.html ainda referencia legado: ${legacy}`);
}
if (!index.includes('type="module"') || !index.includes('src/main.js')) errors.push('index.html não inicia a arquitetura V2 por módulo.');
if (!index.includes('@supabase/supabase-js')) errors.push('Biblioteca Supabase não está carregada no index.html.');

const repoText = required.filter((file) => fs.existsSync(path.join(root,file)) && !file.endsWith('.css')).map((file) => fs.readFileSync(path.join(root,file),'utf8')).join('\n');
if (repoText.includes('service_role')) errors.push('Referência proibida a service_role encontrada nos arquivos da V2.');

const cardsModule = await import(pathToFileUrl(path.join(root, 'src/data/cards.js')));
const ids = cardsModule.cardTemplates.map((item) => item.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) errors.push(`IDs de carteirinhas duplicados: ${[...new Set(duplicates)].join(', ')}`);

const educationModule = await import(pathToFileUrl(path.join(root, 'src/data/education.js')));
const educationIds = educationModule.educationTopics.map((item) => item.id);
if (new Set(educationIds).size !== educationIds.length) errors.push('IDs de educação em saúde duplicados.');

if (errors.length) {
  console.error('\nVALIDAÇÃO FALHOU\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Arquitetura V2 OK: ${jsFiles.length} módulos JS, ${ids.length} carteirinhas, ${educationIds.length} temas educativos.`);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll('\\','/');
}

function pathToFileUrl(file) {
  const normalized = file.replaceAll('\\','/');
  return `file://${normalized.startsWith('/') ? '' : '/'}${normalized}`;
}
