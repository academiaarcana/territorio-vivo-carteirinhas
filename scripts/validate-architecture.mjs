import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const src = path.join(root, 'src');
const errors = [];

const required = [
  'index.html','config.js','package.json','docs/MIGRATION_HISTORY.md','docs/CONTROLE_DE_ACESSO.md',
  'src/main.js','src/core/access-control.js','src/core/store.js','src/core/router.js','src/core/layout.js','src/core/session.js','src/core/permissions.js','src/core/a11y.js',
  'src/services/supabase.js','src/services/auth.js','src/services/repository.js','src/services/access.js','src/data/cards.js','src/data/education.js','src/data/indicators.js',
  'src/pages/public.js','src/pages/auth.js','src/pages/access-pending.js','src/pages/access-management.js','src/pages/dashboard.js','src/pages/territory.js','src/pages/cards.js','src/pages/five.js','src/pages/indicators.js',
  'src/pages/education.js','src/pages/prescriptions.js','src/pages/profile.js','src/pages/admin.js','src/lib/forms.js','src/utils/print.js','src/styles/foundation.css','src/styles/structural.css','src/styles/print-structural.css','src/styles/field-prescriptions.css',
  'scripts/validate-security-contract.mjs','scripts/test-access-control-contract.mjs','scripts/test-permissions.mjs'
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

const index = read('index.html');
for (const legacy of ['app.js','enhancements.js','multiunit.js','network-context.js','public-site.js']) {
  if (index.includes(legacy)) errors.push(`index.html ainda referencia legado: ${legacy}`);
}
if (!index.includes('type="module"') || !index.includes('src/main.js')) errors.push('index.html não inicia a arquitetura V2 por módulo.');
if (!index.includes('@supabase/supabase-js')) errors.push('Biblioteca Supabase não está carregada no index.html.');
if (!index.includes('src/styles/structural.css')) errors.push('Camada estrutural de acessibilidade não está carregada.');
if (!index.includes('src/styles/print-structural.css')) errors.push('Camada estrutural de impressão não está carregada.');
if (index.includes('id="app" aria-live')) errors.push('A raiz inteira do SPA não deve ser uma live region.');

const layout = read('src/core/layout.js');
if (!layout.includes('skip-link')) errors.push('Shell autenticado precisa de skip link.');
if (!layout.includes('aria-current')) errors.push('Navegação autenticada precisa indicar página atual.');
if (!layout.includes('/app/aprovacoes')) errors.push('Navegação de gestão precisa expor o módulo de aprovações.');

const main = read('src/main.js');
if (!main.includes("'/app/aguardando'")) errors.push('Aplicação precisa ter rota para cadastro aguardando aprovação.');
if (!main.includes("'/app/aprovacoes'")) errors.push('Aplicação precisa ter rota de gestão de aprovações.');
if (!main.includes('installGlobalA11y()')) errors.push('Aplicação precisa instalar o controlador global de acessibilidade.');
const capabilityRouteCount = [...main.matchAll(/capability:\s*CAPABILITIES\./g)].length;
if (capabilityRouteCount < 9) errors.push('Rotas internas precisam declarar capacidade explícita.');
if (!main.includes("from './core/access-control.js'")) errors.push('Registro de rotas precisa usar a matriz central de capacidades.');

const a11y = read('src/core/a11y.js');
for (const key of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End']) {
  if (!a11y.includes(key)) errors.push(`Controlador de tabs precisa tratar a tecla ${key}.`);
}
if (!a11y.includes('[role="tablist"]') || !a11y.includes('[role="tab"]')) errors.push('Controlador de tabs precisa usar a semântica ARIA correta.');
if (!a11y.includes('event.preventDefault()')) errors.push('Navegação por setas em tabs precisa impedir o scroll/ação padrão.');
if (!a11y.includes('new WeakMap()')) errors.push('Acessibilidade global precisa memorizar o elemento que abriu cada diálogo.');
if (!a11y.includes("attributeFilter: ['open']")) errors.push('Acessibilidade global precisa observar abertura de dialogs nativos.');
if (!a11y.includes('focusDialog(dialog)')) errors.push('Dialogs precisam receber foco inicial controlado.');
if (!a11y.includes('restoreDialogFocus')) errors.push('Dialogs precisam devolver foco ao elemento de origem quando fechados.');
if (!a11y.includes("document.addEventListener('close', restoreDialogFocus, true)")) errors.push('Retorno de foco dos dialogs precisa funcionar também com Escape/method=dialog.');

const structural = read('src/styles/structural.css');
if (!structural.includes(':focus-visible')) errors.push('Camada estrutural precisa definir foco de teclado visível.');
if (!structural.includes('prefers-reduced-motion')) errors.push('Camada estrutural precisa respeitar redução de movimento.');

const printCss = read('src/styles/print-structural.css');
if (!printCss.includes('count-12')) errors.push('Impressão econômica precisa suportar 12 mini-cartões por A4.');
const printJs = read('src/utils/print.js');
if (!printJs.includes('[2, 4, 8, 12]')) errors.push('Utilitário de impressão precisa aceitar 2, 4, 8 e 12 por A4.');

const formsUtil = read('src/lib/forms.js');
for (const helper of ['setButtonBusy','canSubmitForm','setSelectLoading','setSelectReady','setSelectError']) {
  if (!formsUtil.includes(helper)) errors.push(`Utilitário compartilhado precisa expor ${helper}.`);
}
if (!formsUtil.includes("setAttribute('aria-busy', 'true')")) errors.push('Estado ocupado compartilhado precisa expor aria-busy.');
if (!formsUtil.includes("setAttribute('aria-invalid', 'true')")) errors.push('Falha de catálogo precisa expor aria-invalid.');
if (!formsUtil.includes('data.loadState') && !formsUtil.includes('dataset.loadState')) errors.push('Catálogos assíncronos precisam registrar loading/ready/error.');
if (!formsUtil.includes('select[data-load-state="loading"]') || !formsUtil.includes('select[data-load-state="error"]')) errors.push('Submissão precisa reconhecer catálogos obrigatórios carregando ou com erro.');

const appFiles = walk(src).filter((file) => file.endsWith('.js')).concat([path.join(root, 'config.js'), path.join(root, 'index.html')]);
const appText = appFiles.filter(fs.existsSync).map((file) => fs.readFileSync(file,'utf8')).join('\n');
if (/service[_-]?role/i.test(appText)) errors.push('Referência proibida a service role encontrada no frontend.');
for (const fixed of ['Pimenta Bueno','UBS Madre Tereza de Calcutá','Equipe 02']) {
  if (appText.includes(fixed)) errors.push(`Runtime não pode depender de valor territorial fixo: ${fixed}`);
}
if (/['"]08['"]\s*,\s*['"]09['"]\s*,\s*['"]10['"]/.test(appText) || /<option[^>]+value=['"](?:08|09|10)['"]/i.test(appText)) {
  errors.push('Runtime não pode restringir microáreas ao conjunto fixo 08/09/10.');
}

const authPage = read('src/pages/auth.js');
if (!authPage.includes('PASSWORD_MIN_LENGTH')) errors.push('Fluxo de autenticação precisa aplicar política mínima de senha no frontend.');
if (!authPage.includes("from '../lib/forms.js'")) errors.push('Autenticação precisa reutilizar o utilitário compartilhado de formulários.');
if (!authPage.includes('setButtonBusy') || !authPage.includes('canSubmitForm')) errors.push('Formulários de autenticação precisam prevenir duplo envio com o utilitário compartilhado.');
if (!authPage.includes('setSelectLoading') || !authPage.includes('setSelectReady') || !authPage.includes('setSelectError')) errors.push('Signup precisa tratar explicitamente loading/erro dos catálogos territoriais.');
if (/function\s+setBusy\s*\(/.test(authPage)) errors.push('Autenticação não deve manter uma implementação local duplicada de busy state.');
if (!authPage.includes('aguarda aprovação') && !authPage.includes('aguardando aprovação')) errors.push('Cadastro precisa informar a etapa de aprovação profissional.');
if (authPage.includes("row.code === '110018'") || authPage.includes("municipality.value = '110018'")) errors.push('Cadastro não pode fixar o município inicial por código IBGE.');
if (!authPage.includes('rows.length === 1')) errors.push('Autocadastro deve pré-selecionar município apenas quando o catálogo tiver uma única opção.');
if (authPage.includes('Este e-mail já possui uma conta')) errors.push('Cadastro não deve confirmar explicitamente que um e-mail já existe.');
if (authPage.includes('masterEmail') || authPage.includes('syncMaster')) errors.push('Cadastro público não pode reconhecer a Conta Master pelo e-mail.');

const profilePage = read('src/pages/profile.js');
if (!profilePage.includes('scopeLocked')) errors.push('Perfil ativo precisa refletir vínculo territorial bloqueado na interface.');
if (!profilePage.includes('setSelectLoading') || !profilePage.includes('setSelectError')) errors.push('Perfil precisa invalidar catálogos dependentes que falharam ao carregar.');
if (!profilePage.includes('canSubmitForm') || !profilePage.includes('setButtonBusy')) errors.push('Perfil precisa prevenir duplo envio com estado compartilhado.');

const pendingPage = read('src/pages/access-pending.js');
if (!pendingPage.includes('Verificar aprovação')) errors.push('Perfil pendente precisa conseguir consultar aprovação.');
if (!pendingPage.includes('Depois da aprovação')) errors.push('Onboarding precisa explicar que vínculo aprovado fica protegido.');
if (!pendingPage.includes('setSelectLoading') || !pendingPage.includes('setSelectError')) errors.push('Conta pendente precisa invalidar catálogos dependentes que falharam.');
if (!pendingPage.includes('canSubmitForm') || !pendingPage.includes('setButtonBusy')) errors.push('Conta pendente precisa prevenir duplo envio com estado compartilhado.');

const repository = read('src/services/repository.js');
if (!repository.includes('normalizeCoordinates')) errors.push('Persistência territorial precisa validar coordenadas antes de enviar ao banco.');
if (!repository.includes("'Latitude', -90, 90")) errors.push('Latitude precisa ser validada entre -90 e 90.');
if (!repository.includes("'Longitude', -180, 180")) errors.push('Longitude precisa ser validada entre -180 e 180.');
if (!repository.includes('Informe latitude e longitude juntas')) errors.push('Coordenadas precisam ser fornecidas em par.');
if (repository.includes("state: payload.state?.trim() || 'RO'")) errors.push('Criação de unidade não pode usar UF fixa como fallback.');
if (repository.includes('municipality: payload.municipality')) errors.push('Rótulo textual do município da unidade deve ser derivado pelo banco, não pelo cliente.');

const adminPage = read('src/pages/admin.js');
if (adminPage.includes('option.dataset.name') || adminPage.includes('option.dataset.state')) errors.push('Gestão não deve montar município/UF textual ao cadastrar UBS.');
if (!/\bcreateUnit\(values\)/.test(adminPage)) errors.push('Cadastro de UBS deve enviar o formulário canônico diretamente ao serviço.');
if (!adminPage.includes("from '../lib/forms.js'")) errors.push('Gestão precisa reutilizar o estado ocupado compartilhado.');
if (!adminPage.includes('submitDialogForm')) errors.push('Formulários administrativos precisam centralizar busy state e tratamento de erro.');
if (!adminPage.includes('async function runInlineMutation') || !adminPage.includes('runInlineMutation(confirmUnit') || !adminPage.includes('runInlineMutation(toggleTeam') || !adminPage.includes('setButtonBusy(button, true')) errors.push('Ações administrativas fora de formulário precisam bloquear cliques repetidos.');
if (!adminPage.includes("content.setAttribute('aria-busy', 'true')")) errors.push('Recarregamento da gestão precisa sinalizar estado ocupado.');

const migrationHistory = read('docs/MIGRATION_HISTORY.md');
if (!migrationHistory.includes('harden_profile_functions')) errors.push('Histórico precisa registrar o hotfix harden_profile_functions.');
if (!migrationHistory.includes('restrict_master_role_trigger_search_path')) errors.push('Histórico precisa registrar o hotfix de search_path do master.');
for (const migration of ['020_protect_approved_profile_microarea_scope.sql','023_database_input_bounds.sql','024_least_privilege_table_grants.sql','025_canonicalize_health_unit_municipality.sql','026_protect_health_unit_identity.sql','027_restrict_territory_point_kinds.sql']) {
  if (!migrationHistory.includes(migration)) errors.push(`Histórico precisa incluir ${migration}.`);
}

const publicPage = read('src/pages/public.js');
if (!publicPage.includes('skip-link') || !publicPage.includes('id="public-main"')) errors.push('Página pública precisa de skip link para o conteúdo principal.');

const dialogContracts = [
  ['src/pages/cards.js','card-editor','card-editor-title'],
  ['src/pages/territory.js','point-dialog','point-dialog-title'],
  ['src/pages/admin.js','admin-dialog','admin-dialog-title'],
  ['src/pages/education.js','education-dialog','education-dialog-title']
];
for (const [file, dialogId, labelId] of dialogContracts) {
  const content = read(file);
  if (!content.includes(`id="${dialogId}"`) || !content.includes(`aria-labelledby="${labelId}"`) || !content.includes(`id="${labelId}"`)) {
    errors.push(`${file} precisa manter o diálogo ${dialogId} rotulado por ${labelId}.`);
  }
}

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

function read(file) {
  const target = path.join(root, file);
  return fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
}

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
