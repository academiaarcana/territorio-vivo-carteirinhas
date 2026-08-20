import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const src = path.join(root, 'src');
const errors = [];

const required = [
  'index.html','config.js','package.json',
  'src/main.js','src/core/store.js','src/core/router.js','src/core/layout.js','src/core/session.js','src/core/permissions.js',
  'src/services/supabase.js','src/services/auth.js','src/services/repository.js','src/data/cards.js','src/data/education.js','src/data/indicators.js',
  'src/pages/public.js','src/pages/auth.js','src/pages/dashboard.js','src/pages/territory.js','src/pages/cards.js','src/pages/five.js','src/pages/indicators.js',
  'src/pages/education.js','src/pages/profile.js','src/pages/admin.js','src/utils/print.js','src/styles/foundation.css','src/styles/structural.css','src/styles/print-structural.css',
  'scripts/validate-security-contract.mjs'
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
if (!index.includes('src/styles/structural.css')) errors.push('Camada estrutural de acessibilidade não está carregada.');
if (!index.includes('src/styles/print-structural.css')) errors.push('Camada estrutural de impressão não está carregada.');
if (index.includes('id="app" aria-live')) errors.push('A raiz inteira do SPA não deve ser uma live region.');

const layout = fs.readFileSync(path.join(root, 'src/core/layout.js'), 'utf8');
if (!layout.includes('skip-link')) errors.push('Shell autenticado precisa de skip link.');
if (!layout.includes('aria-current')) errors.push('Navegação autenticada precisa indicar página atual.');

const structural = fs.readFileSync(path.join(root, 'src/styles/structural.css'), 'utf8');
if (!structural.includes(':focus-visible')) errors.push('Camada estrutural precisa definir foco de teclado visível.');
if (!structural.includes('prefers-reduced-motion')) errors.push('Camada estrutural precisa respeitar redução de movimento.');

const printCss = fs.readFileSync(path.join(root, 'src/styles/print-structural.css'), 'utf8');
if (!printCss.includes('count-12')) errors.push('Impressão econômica precisa suportar 12 mini-cartões por A4.');
const printJs = fs.readFileSync(path.join(root, 'src/utils/print.js'), 'utf8');
if (!printJs.includes('[2, 4, 8, 12]')) errors.push('Utilitário de impressão precisa aceitar 2, 4, 8 e 12 por A4.');

const appFiles = walk(src).filter((file) => file.endsWith('.js')).concat([path.join(root, 'config.js'), path.join(root, 'index.html')]);
const appText = appFiles.filter(fs.existsSync).map((file) => fs.readFileSync(file,'utf8')).join('\n');
if (/service[_-]?role/i.test(appText)) errors.push('Referência proibida a service role encontrada no frontend.');

const cardsModule = await import(pathToFileUrl(path.join(root, 'src/data/cards.js')));
const ids = cardsModule.cardTemplates.map((item) => item.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) errors.push(`IDs de carteirinhas duplicados: ${[...new Set(duplicates)].join(', ')}`);
if (ids.length < 23) errors.push('Biblioteca de carteirinhas está abaixo do conjunto funcional V2 esperado.');
const categories = new Set(cardsModule.cardCategories.map((item) => item.id));
for (const template of cardsModule.cardTemplates) {
  if (!categories.has(template.category)) errors.push(`Carteirinha ${template.id} usa categoria inexistente: ${template.category}`);
  if (![2,4,8,12].includes(template.defaultCount)) errors.push(`Carteirinha ${template.id} possui defaultCount inválido.`);
}

const indicatorsModule = await import(pathToFileUrl(path.join(root, 'src/data/indicators.js')));
if (!indicatorsModule.indicatorDefinitions?.length) errors.push('Definições de indicadores ausentes.');
const indicatorIds = indicatorsModule.indicatorDefinitions.map((item) => item.id);
if (new Set(indicatorIds).size !== indicatorIds.length) errors.push('IDs de indicadores duplicados.');

const educationModule = await import(pathToFileUrl(path.join(root, 'src/data/education.js')));
const educationIds = educationModule.educationTopics.map((item) => item.id);
if (new Set(educationIds).size !== educationIds.length) errors.push('IDs de educação em saúde duplicados.');
for (const topic of educationModule.educationTopics) {
  if (!topic.sources?.length) errors.push(`Tema educativo sem fonte: ${topic.id}`);
  if (!topic.disclaimer) errors.push(`Tema educativo sem aviso de segurança: ${topic.id}`);
}

if (errors.length) {
  console.error('\nVALIDAÇÃO FALHOU\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Arquitetura V2 OK: ${jsFiles.length} módulos JS, ${ids.length} carteirinhas, ${indicatorIds.length} indicadores, ${educationIds.length} temas educativos.`);

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
