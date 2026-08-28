import assert from 'node:assert/strict';
import fs from 'node:fs';
import { prescriptionSchedules, prescriptionSupportItemsFor } from '../src/data/prescription-support.js';

const access = fs.readFileSync('src/core/access-control.js', 'utf8');
const permissions = fs.readFileSync('src/core/permissions.js', 'utf8');
const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const page = fs.readFileSync('src/pages/prescriptions.js', 'utf8');
const support = fs.readFileSync('src/data/prescription-support.js', 'utf8');
const admin = fs.readFileSync('src/pages/admin.js', 'utf8');
const css = fs.readFileSync('src/styles/field-prescriptions.css', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20260826234754_add_clinical_professional_roles.sql', 'utf8');

assert.match(access, /PHYSICIAN: 'physician'/, 'Médico precisa ter papel explícito.');
assert.match(access, /NURSE: 'nurse'/, 'Enfermeiro precisa ter papel explícito.');
assert.match(access, /USE_EXTERNAL_PRESCRIPTIONS/, 'Prescrições precisam de capacidade exclusiva.');
assert.match(permissions, /return 'Médica\(o\)'/, 'Papel médico precisa de rótulo próprio.');
assert.match(permissions, /return 'Enfermeira\(o\)'/, 'Papel enfermeiro precisa de rótulo próprio.');
assert.match(layout, /hasCapability\(profile, CAPABILITIES\.USE_EXTERNAL_PRESCRIPTIONS\)/, 'Menu clínico deve ser resolvido pela capacidade.');
assert.match(main, /'\/app\/prescricoes'.*CAPABILITIES\.USE_EXTERNAL_PRESCRIPTIONS/, 'Rota clínica deve falhar fechada para outros papéis.');
assert.match(admin, /<option value="physician"/, 'Gestão precisa atribuir papel médico.');
assert.match(admin, /<option value="nurse"/, 'Gestão precisa atribuir papel enfermeiro.');

assert.match(page, /Biblioteca própria do Território Vivo/, 'A biblioteca precisa funcionar dentro do produto.');
assert.doesNotMatch(page, /<iframe|receita-facil-support-icons|storage\.googleapis\.com\/aps-cuidado-para-todos/, 'A área não pode incorporar página ou bucket de terceiros.');
assert.match(page, /Dados temporários: nada é salvo no Supabase/, 'Fronteira de não persistência deve ser explícita.');
assert.match(page, /permanecem somente nesta aba/, 'A duração do rascunho precisa ser explicada.');
assert.match(page, /não interpreta nem corrige a prescrição/, 'A tela não pode prometer interpretação automática da receita.');
assert.match(page, /Apoio visual não substitui o texto da prescrição/, 'O limite clínico dos pictogramas deve ser explícito.');
assert.match(page, /Validação cultural necessária/, 'Conteúdo para povos indígenas precisa exigir validação comunitária.');
assert.match(page, /Retirada de corticoide:[\s\S]*dose, datas e duração/, 'Retirada gradual precisa manter o esquema exato em texto.');
assert.match(page, /MAX_OPTIONAL_SUPPORTS = 4/, 'A quantidade de apoios adicionais precisa ser limitada.');
assert.match(page, /prescriptionSupportItemsFor/, 'A biblioteca precisa ter busca e categorias navegáveis.');
assert.match(page, /\['ArrowLeft', 'ArrowRight', 'Home', 'End'\]/, 'Abas da biblioteca precisam de navegação por teclado.');
assert.match(page, /role="tabpanel"/, 'Categorias precisam controlar um painel semântico.');
assert.match(page, /readVolatileDraft/, 'Rascunho deve usar somente o armazenamento volátil compartilhado.');
assert.match(page, /printHtml/, 'Orientação deve permitir impressão local.');
assert.match(page, /downloadPdf/, 'Orientação deve permitir PDF local.');
assert.doesNotMatch(page, /name="(patient|patient_name|cpf|diagnosis)"/, 'V1 não deve coletar identificação ou diagnóstico do paciente.');
assert.doesNotMatch(page, /from ['"][^'"]*(supabase|repository)\.js['"]/, 'Área clínica externa não pode importar persistência.');
for (const forbidden of ['localStorage', 'sessionStorage', 'indexedDB']) assert.doesNotMatch(page, new RegExp(forbidden), `Área clínica não pode usar ${forbidden}.`);

for (const category of ['Modelos prontos', 'Combinados Povos Indígenas', 'Via de uso', 'Motivo do uso', 'Horários', 'Personagens', 'Associações', 'Retirada de corticoide(s)', 'Outros', 'Utilitários']) {
  assert.match(support, new RegExp(category.replace(/[()]/g, '\\$&'), 'u'), `Catálogo deve incluir a categoria ${category}.`);
}

for (const template of ['combined-oral-morning', 'combined-drops-morning', 'combined-eye-morning', 'combined-nasal-morning', 'combined-inhalation-morning', 'combined-topical-night']) {
  assert.match(support, new RegExp(template), `Catálogo deve incluir o modelo frequente ${template}.`);
}
for (const schedule of ['Antes do café da manhã', 'Depois do café da manhã', 'Antes do almoço', 'Depois do almoço', 'Antes do jantar', 'Depois do jantar', 'Em jejum']) {
  assert.match(support, new RegExp(schedule), `Períodos precisam incluir ${schedule}.`);
}
assert.match(support, /const indigenousScheduleItems = prescriptionSchedules\.map/, 'Períodos indígenas precisam permanecer sincronizados com a lista geral.');
assert.equal(prescriptionSchedules.length, 11, 'Lista geral precisa conter onze períodos explícitos.');
assert.deepEqual(
  prescriptionSupportItemsFor('indigenous').map((item) => item.label),
  prescriptionSchedules.map((item) => item.label),
  'Catálogo indígena precisa espelhar todos os períodos e manter a mesma ordem.'
);
assert.match(page, /café da manhã, almoço, jantar ou em jejum/, 'Opções ligadas às refeições precisam lembrar a conferência profissional.');
assert.match(support, /prescriptionQuickTemplates/, 'Modelos frequentes precisam ter uma coleção própria.');
assert.ok(
  prescriptionSupportItemsFor('combined').every((item) => item.images?.length === 2 && item.images[0] !== item.images[1]),
  'Cada modelo pronto precisa combinar dois pictogramas diferentes: via e período.'
);
assert.match(page, /Escolha um modelo frequente/, 'A tela precisa destacar modelos antes do preenchimento manual.');
assert.match(page, /Modelo aplicado\. Agora informe medicamento e dose/, 'Aplicar um modelo deve lembrar os campos clínicos obrigatórios.');
assert.match(page, /applyPrescriptionTemplate/, 'Modelos rápidos e biblioteca precisam usar a mesma aplicação segura.');
assert.match(page, /prescription-combined-visual/, 'Modelos prontos precisam renderizar via e período como dois pictogramas reais.');
assert.match(css, /prescription-combined-visual/, 'Composição de via e período precisa ter layout próprio e legível.');

for (const file of [
  'morning.png', 'lunch.png', 'evening.png', 'bedtime.png', 'before-breakfast.png', 'after-breakfast.png', 'before-meal.png', 'after-meal.png', 'before-dinner.png', 'after-dinner.png', 'fasting.png', 'oral.png', 'injection.png', 'topical.png', 'drops.png',
  'inhalation.png', 'eye-drops.png', 'ear-drops.png', 'nasal-spray.png', 'pain.png', 'fever.png', 'cough.png',
  'stomach-discomfort.png', 'avoid-alcohol.png', 'gradual-reduction.png', 'indigenous-morning.png', 'indigenous-lunch.png', 'indigenous-evening.png', 'indigenous-night.png',
  'indigenous-before-breakfast.png', 'indigenous-after-breakfast.png', 'indigenous-before-lunch.png', 'indigenous-after-lunch.png',
  'indigenous-before-dinner.png', 'indigenous-after-dinner.png', 'indigenous-fasting.png'
]) {
  assert.match(support, new RegExp(file.replace('.', '\\.')), `Catálogo deve referenciar ${file}.`);
  assert.ok(fs.statSync(`src/assets/prescription-support/${file}`).size > 10_000, `${file} precisa ser um ativo visual real.`);
}

assert.match(migration, /check \(role in \('acs', 'physician', 'nurse', 'unit_admin', 'admin'\)\)/, 'Banco precisa limitar papéis ao domínio ampliado.');
assert.match(migration, /caller_is_master and new\.role in \('acs', 'physician', 'nurse', 'unit_admin', 'admin'\)/, 'Somente Master pode continuar atribuindo admin.');
assert.match(migration, /role in \('acs', 'physician', 'nurse'\)/, 'Gestão local deve alcançar somente profissionais da própria UBS.');
assert.match(migration, /old\.role in \('acs', 'physician', 'nurse'\)/, 'Vínculo aprovado dos perfis clínicos deve ficar protegido.');
assert.match(migration, /to authenticated[\s\S]*with check/, 'Policy de update deve declarar papel e WITH CHECK.');
assert.match(migration, /revoke all on function public\.enforce_profile_role\(\) from public, anon, authenticated/, 'Função de papel não pode ser chamada pelo cliente.');

assert.match(css, /@media screen/, 'Camada visual clínica deve ficar restrita à tela.');
assert.match(css, /#app\[data-route="\/app\/prescricoes"\]/, 'Estilos devem ficar limitados à rota clínica.');
assert.match(css, /@media print/, 'Orientações locais precisam de contrato de impressão.');
assert.match(css, /prescription-print-sheet/, 'Impressão deve ter folha própria.');

console.log('Contrato clínico OK: Médico/Enfermeiro, menor privilégio, pictogramas autorais e rascunho local sem persistência.');
