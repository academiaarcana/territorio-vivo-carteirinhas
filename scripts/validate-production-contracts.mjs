import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];
const read = (file) => {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) {
    errors.push(`Arquivo obrigatório ausente: ${file}`);
    return '';
  }
  return fs.readFileSync(target, 'utf8');
};
const expect = (content, needle, message) => {
  if (!content.includes(needle)) errors.push(message);
};

const migration28 = read('supabase/migrations/028_sync_profile_network_labels_on_catalog_update.sql');
expect(migration28, 'new.municipality_code is distinct from old.municipality_code', 'Migration 028 precisa manter município como vínculo protegido.');
expect(migration28, 'new.unit_cnes is distinct from old.unit_cnes', 'Migration 028 precisa manter UBS como vínculo protegido.');
expect(migration28, 'new.team_id is distinct from old.team_id', 'Migration 028 precisa manter equipe como vínculo protegido.');
expect(migration28, 'new.microarea is distinct from old.microarea', 'Migration 028 precisa manter microárea como vínculo protegido.');
expect(migration28, 'new.unit_cnes is null and new.unit_name is distinct from old.unit_name', 'Rótulo de UBS sem FK precisa continuar protegido.');
expect(migration28, 'new.team_id is null and new.team_name is distinct from old.team_name', 'Rótulo de equipe sem FK precisa continuar protegido.');
expect(migration28, 'sync_profile_unit_label', 'Renomeação de UBS precisa sincronizar o rótulo dos perfis vinculados.');
expect(migration28, 'sync_profile_team_label', 'Renomeação de equipe precisa sincronizar o rótulo dos perfis vinculados.');
expect(migration28, 'after update of name on public.health_units', 'Trigger de UBS precisa reagir somente à identidade canônica.');
expect(migration28, 'after update of name on public.teams', 'Trigger de equipe precisa reagir somente à identidade canônica.');
expect(migration28, 'revoke execute on function public.sync_profile_unit_label() from anon, authenticated', 'Função interna de sincronização de UBS não pode ser invocada pelo cliente.');
expect(migration28, 'revoke execute on function public.sync_profile_team_label() from anon, authenticated', 'Função interna de sincronização de equipe não pode ser invocada pelo cliente.');

const migrationHistory = read('docs/MIGRATION_HISTORY.md');
expect(migrationHistory, '028_sync_profile_network_labels_on_catalog_update.sql', 'Histórico precisa registrar a migration 028.');
expect(migrationHistory, 'sync_profile_network_labels_on_catalog_update', 'Histórico precisa registrar a execução Supabase da migration 028.');

const forms = read('src/lib/forms.js');
for (const helper of ['setButtonBusy', 'canSubmitForm', 'setSelectLoading', 'setSelectReady', 'setSelectError']) {
  expect(forms, helper, `Utilitário de formulários precisa manter ${helper}.`);
}
expect(forms, "setAttribute('aria-disabled', 'true')", 'Busy state precisa expor aria-disabled junto do disabled nativo.');
expect(forms, 'buttonBusyStates', 'Busy state precisa preservar o estado anterior do botão antes de bloquear a interação.');
expect(forms, "restoreAttribute(button, 'aria-disabled'", 'Busy state precisa restaurar aria-disabled ao estado anterior.');
expect(forms, 'select[data-load-state="loading"]', 'Submissão precisa reconhecer catálogo obrigatório em carregamento.');
expect(forms, 'select[data-load-state="error"]', 'Submissão precisa reconhecer catálogo obrigatório com erro.');

for (const file of ['src/pages/auth.js', 'src/pages/profile.js', 'src/pages/access-pending.js']) {
  const content = read(file);
  expect(content, "from '../lib/forms.js'", `${file} precisa usar o estado compartilhado de formulários.`);
  expect(content, 'setSelectLoading', `${file} precisa mostrar carregamento dos selects dependentes.`);
  expect(content, 'setSelectError', `${file} precisa invalidar selects dependentes quando o catálogo falha.`);
}

const main = read('src/main.js');
expect(main, "registerRoute('/recuperar-senha', { auth: true", 'Tela de nova senha deve exigir sessão de recuperação/autenticada.');

const router = read('src/core/router.js');
expect(router, 'focusPageHeading(root)', 'Navegação SPA precisa mover foco para o título da página.');
expect(router, "heading.setAttribute('tabindex', '-1')", 'Título focado após navegação precisa aceitar foco programático sem entrar na ordem de tabulação.');
expect(router, 'heading.focus({ preventScroll: true })', 'Foco pós-navegação não deve reposicionar a página depois do scroll controlado.');
expect(router, "window.scrollTo({ top: 0, behavior: 'auto' })", 'Navegação SPA precisa retornar ao topo sem animação forçada.');

const pagesWorkflow = read('.github/workflows/pages.yml');
expect(pagesWorkflow, 'branches: ["main"]', 'GitHub Pages deve publicar por push somente a partir da main.');
expect(pagesWorkflow, "if: github.ref == 'refs/heads/main'", 'Mesmo workflow_dispatch não pode publicar uma branch diferente da main.');

const admin = read('src/pages/admin.js');
expect(admin, 'submitDialogForm', 'Gestão precisa centralizar busy state de formulários administrativos.');
expect(admin, 'refreshAfterMutation', 'Gestão não pode anunciar sucesso se o reload pós-mutation falhar silenciosamente.');
expect(admin, 'ensureFormStatus', 'Erros de formulário administrativo precisam ser anunciados dentro do diálogo ativo.');

const repository = read('src/services/repository.js');
const createPoint = repository.match(/export async function createTerritoryPoint[\s\S]*?export async function updateTerritoryPoint/)?.[0] || '';
if (!createPoint) errors.push('Serviço territorial precisa manter createTerritoryPoint.');
if (/created_by/.test(createPoint)) errors.push('Cliente não deve enviar created_by ao criar ponto territorial; autoria pertence ao trigger do banco.');
expect(repository, "String(value).trim().replace(',', '.')", 'Coordenadas precisam aceitar vírgula decimal no cliente.');
expect(repository, "'Latitude', -90, 90", 'Serviço territorial precisa validar latitude.');
expect(repository, "'Longitude', -180, 180", 'Serviço territorial precisa validar longitude.');
expect(repository, 'Informe latitude e longitude juntas.', 'Serviço territorial precisa exigir coordenadas em par.');

const printUtil = read('src/utils/print.js');
expect(printUtil, "return { mode: 'print-fallback' }", 'Utilitário de PDF precisa distinguir fallback de impressão.');
expect(printUtil, "return { mode: 'pdf' }", 'Utilitário de PDF precisa confirmar geração real de PDF.');
for (const file of ['src/pages/cards.js', 'src/pages/five.js', 'src/pages/indicators.js', 'src/pages/education.js']) {
  const content = read(file);
  expect(content, "result.mode === 'pdf'", `${file} precisa diferenciar PDF real de fallback de impressão.`);
  expect(content, 'setButtonBusy', `${file} precisa anunciar e bloquear geração repetida de PDF.`);
}

const education = read('src/pages/education.js');
expect(education, 'try {', 'Educação em saúde precisa tratar falhas do gerador de PDF.');
expect(education, 'data-topic-status', 'Educação em saúde precisa ter região de status acessível para impressão/PDF.');
expect(education, 'rel="noopener noreferrer"', 'Links externos da educação precisam proteger a página de origem.');

const a11y = read('src/core/a11y.js');
expect(a11y, 'export function openAccessibleDialog', 'Dialogs precisam de helper acessível centralizado.');
expect(a11y, "document.addEventListener('pointerdown'", 'Abertura de dialog via mouse precisa preservar o disparador para retorno de foco.');
expect(a11y, 'canRestoreFocus', 'Retorno de foco precisa validar o disparador antes de focá-lo.');
expect(a11y, "element.closest('[hidden],[inert]')", 'Retorno de foco não pode apontar para elemento oculto ou inerte.');
expect(a11y, 'element.getClientRects().length > 0', 'Retorno de foco precisa confirmar que o disparador continua visível.');
expect(a11y, "tab.setAttribute('tabindex', active ? '0' : '-1')", 'Tabs precisam implementar roving tabindex.');
expect(a11y, 'initializeTablists(document)', 'Tabs precisam ser inicializadas desde a primeira renderização.');
for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
  expect(a11y, key, `Tabs precisam manter suporte à tecla ${key}.`);
}

for (const file of ['src/pages/cards.js', 'src/pages/territory.js', 'src/pages/admin.js', 'src/pages/education.js']) {
  const content = read(file);
  expect(content, 'openAccessibleDialog', `${file} precisa usar o helper acessível de dialogs.`);
  if (/\.showModal\s*\(/.test(content)) errors.push(`${file} não deve abrir dialog diretamente com showModal().`);
}

if (errors.length) {
  console.error('\nCONTRATOS DE PRODUÇÃO FALHARAM\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Contratos de produção OK: Pages restrito à main, recuperação autenticada, foco SPA, autoria territorial, sincronização canônica, catálogos assíncronos, busy states, PDF/fallback, dialogs acessíveis e roving tabs protegidos.');
