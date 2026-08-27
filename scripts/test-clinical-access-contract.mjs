import assert from 'node:assert/strict';
import fs from 'node:fs';

const access = fs.readFileSync('src/core/access-control.js', 'utf8');
const permissions = fs.readFileSync('src/core/permissions.js', 'utf8');
const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const page = fs.readFileSync('src/pages/prescriptions.js', 'utf8');
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

assert.match(page, /https:\/\/www\.cuidadoparatodos\.com\.br\//, 'A área deve abrir o Cuidado Para Todos.');
assert.match(page, /target="_blank" rel="noopener noreferrer"/, 'Serviço externo deve abrir com isolamento de janela.');
assert.match(page, /não recebe nem grava nome de paciente, diagnóstico, medicamento, dose, receita, arquivo, assinatura ou credencial/, 'Fronteira de privacidade deve ser explícita.');
assert.doesNotMatch(page, /from ['"][^'"]*(supabase|repository)\.js['"]/, 'Área clínica externa não pode importar persistência.');
for (const forbidden of ['localStorage', 'sessionStorage', 'indexedDB']) assert.doesNotMatch(page, new RegExp(forbidden), `Área clínica não pode usar ${forbidden}.`);

assert.match(migration, /check \(role in \('acs', 'physician', 'nurse', 'unit_admin', 'admin'\)\)/, 'Banco precisa limitar papéis ao domínio ampliado.');
assert.match(migration, /caller_is_master and new\.role in \('acs', 'physician', 'nurse', 'unit_admin', 'admin'\)/, 'Somente Master pode continuar atribuindo admin.');
assert.match(migration, /role in \('acs', 'physician', 'nurse'\)/, 'Gestão local deve alcançar somente profissionais da própria UBS.');
assert.match(migration, /old\.role in \('acs', 'physician', 'nurse'\)/, 'Vínculo aprovado dos perfis clínicos deve ficar protegido.');
assert.match(migration, /to authenticated[\s\S]*with check/, 'Policy de update deve declarar papel e WITH CHECK.');
assert.match(migration, /revoke all on function public\.enforce_profile_role\(\) from public, anon, authenticated/, 'Função de papel não pode ser chamada pelo cliente.');

assert.match(css, /@media screen/, 'Camada visual clínica deve ficar restrita à tela.');
assert.match(css, /#app\[data-route="\/app\/prescricoes"\]/, 'Estilos devem ficar limitados à rota clínica.');
assert.doesNotMatch(css, /@media print/, 'Área externa não deve criar contrato de impressão local.');

console.log('Contrato clínico OK: Médico/Enfermeiro, menor privilégio, rota protegida e fronteira externa sem persistência.');
