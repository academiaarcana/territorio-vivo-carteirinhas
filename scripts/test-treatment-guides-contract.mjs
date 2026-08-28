import assert from 'node:assert/strict';
import fs from 'node:fs';

const access = fs.readFileSync('src/core/access-control.js', 'utf8');
const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const main = fs.readFileSync('src/main.js', 'utf8');
const page = fs.readFileSync('src/pages/treatments.js', 'utf8');
const data = fs.readFileSync('src/data/treatment-guides.js', 'utf8');
const css = fs.readFileSync('src/styles/field-treatments.css', 'utf8');

assert.match(access, /VIEW_TREATMENT_GUIDES: 'view_treatment_guides'/, 'Guias precisam de capacidade explícita.');
assert.match(access, /BASE_ACTIVE[\s\S]*CAPABILITIES\.VIEW_TREATMENT_GUIDES/, 'Todo perfil ativo deve consultar os guias.');
assert.match(layout, /\/app\/tratamentos', 'Tratamentos ilustrados', 'medicine'/, 'Menu deve incluir a nova página.');
assert.match(main, /'\/app\/tratamentos'.*CAPABILITIES\.VIEW_TREATMENT_GUIDES/, 'Rota deve falhar fechada por capacidade.');

assert.match(page, /CLINICAL_ROLES = \[ROLES\.PHYSICIAN, ROLES\.NURSE\]/, 'Somente médica(o) e enfermeira(o) personalizam campos clínicos.');
assert.match(page, /profile\.role === ROLES\.ACS/, 'ACS precisa receber orientação própria.');
assert.match(page, /Não defina dose, intervalo, troca de marca ou duração/, 'Limite do ACS deve ser explícito.');
assert.match(page, /Laboratório \/ fabricante \*/, 'Laboratório deve ser campo profissional obrigatório.');
assert.match(page, /Não escreva nome, CPF ou diagnóstico/, 'Fronteira de privacidade precisa aparecer na tela.');
assert.match(page, /apenas na memória desta aba/, 'Duração do rascunho temporário deve ser explicada.');
assert.match(page, /speechSynthesis/, 'Guias precisam oferecer leitura em voz alta.');
assert.match(page, /Mostre com suas mãos como você vai fazer em casa/, 'Confirmação de entendimento deve usar demonstração.');
assert.match(page, /printHtml/, 'Guia precisa permitir impressão local.');
assert.match(page, /downloadPdf/, 'Guia precisa permitir PDF local.');
assert.doesNotMatch(page, /name="(patient|patient_name|cpf|diagnosis)"/, 'Página não pode coletar identificação ou diagnóstico.');
assert.doesNotMatch(page, /from ['"][^'"]*(supabase|repository)\.js['"]/, 'Página não pode importar persistência.');
for (const forbidden of ['localStorage', 'sessionStorage', 'indexedDB']) assert.doesNotMatch(page, new RegExp(forbidden), `Página não pode usar ${forbidden}.`);

for (const guide of [
  'Bombinha com espaçador — plano para crise', 'Bombinha de controle — uso contínuo', 'Bombinha sem espaçador',
  'Spray ou jato nasal', 'Pomada para os olhos', 'Creme vaginal com aplicador', 'Insulina NPH',
  'Insulina Regular', 'Insulina glargina', 'Água segura para beber — hipoclorito',
  'Água segura para beber — filtrar e ferver', 'Depois da bombinha com corticoide',
  'Spray nasal — higiene e cuidado', 'Pomada para os olhos — evitar contaminação',
  'Insulina — guardar, transportar e descartar', 'Hipoclorito — qual produto pode usar?',
  'Sinais de alerta — procure ajuda sem demora', 'Falta de ar grave — procure ajuda',
  'Desmaio ou convulsão — procure ajuda', 'Problema grave no olho — procure ajuda',
  'Como pedir ajuda — SAMU 192'
]) assert.match(data, new RegExp(guide), `Catálogo deve incluir ${guide}.`);

for (const safety of [
  'Não coloque o frasco metálico na água', 'Não sacuda com força', 'Não compartilhe e não reutilize',
  'não será calculada automaticamente', 'ponta do tubo não deve tocar'
]) assert.match(data, new RegExp(safety, 'i'), `Conteúdo seguro ausente: ${safety}.`);

for (const file of [
  'inhaler-spacer-crisis-detailed.webp', 'inhaled-controller-spacer-detailed.webp',
  'inhaler-no-spacer-steps.webp', 'nasal-spray-steps.webp',
  'vaginal-cream-steps.webp', 'insulin-nph-steps.webp', 'insulin-regular-steps.webp',
  'insulin-glargine-pen-steps.webp', 'eye-ointment-steps.webp',
  'safe-water-drops-steps.webp', 'safe-water-boil-steps.webp',
  'inhaled-steroid-mouth-care.webp', 'nasal-spray-hygiene.webp',
  'eye-ointment-hygiene.webp', 'insulin-storage-disposal.webp',
  'safe-water-product-check.webp', 'urgent-warning-signs.webp', 'urgent-breathing.webp',
  'urgent-hypoglycemia.webp', 'urgent-eye.webp', 'urgent-call-192.webp'
]) {
  assert.match(data, new RegExp(file.replace('.', '\\.')), `Catálogo deve referenciar ${file}.`);
  assert.ok(fs.statSync(`src/assets/treatment-guides/${file}`).size > 20_000, `${file} precisa ser um ativo visual real.`);
}

assert.match(data, /2 gotas em cada 1 litro/, 'Método com hipoclorito deve proteger a proporção oficial.');
assert.match(data, /Hipoclorito de sódio 2,5%/, 'Guia deve ajudar a reconhecer o frasco correto sem depender da marca.');
assert.match(data, /mantenha a fervura por 5 minutos/, 'Método por fervura deve proteger o tempo oficial.');
assert.match(data, /Não misture os dois métodos/, 'Os dois caminhos de tratamento da água devem permanecer separados.');
assert.match(data, /2,0% a 2,5% de cloro ativo/, 'Complemento do hipoclorito deve explicar a alternativa sem aditivos.');
assert.match(data, /não deixe a insulina encostar no gelo/i, 'Transporte não pode permitir contato direto da insulina com gelo.');
assert.match(data, /Não use garrafa PET/, 'Descarte de perfurocortante precisa excluir recipiente frágil.');
assert.match(data, /Não engula a água usada para enxaguar/, 'Corticoide inalatório precisa orientar enxaguar, gargarejar e cuspir.');
assert.match(data, /Cada pessoa deve usar o próprio frasco/, 'Spray nasal não pode ser compartilhado.');
assert.match(data, /não pode tocar o olho, os cílios, a pele ou os dedos/i, 'Pomada ocular precisa evitar contaminação da ponta.');
assert.match(data, /não dê comida, bebida ou medicamento pela boca/i, 'Alerta de inconsciência precisa impedir administração oral insegura.');
assert.match(data, /SAMU 192/, 'Guia de sinais de alerta precisa orientar busca imediata de ajuda.');
assert.match(data, /Respire 10 vezes/, 'Espaçador deve explicar dez respirações depois de cada jato.');
assert.match(data, /validada pelo protocolo local/i, 'A sequência de dez respirações precisa exigir validação local.');
assert.match(data, /Quando o plano de crise orientar, espere 20 minutos/, 'O intervalo de crise não pode aparecer como regra universal.');

assert.match(css, /#app\[data-route="\/app\/tratamentos"\]/, 'Estilos precisam ficar limitados à rota.');
assert.match(css, /@media print/, 'Guias precisam ter contrato de impressão.');
assert.match(css, /treatment-print-sheet/, 'Impressão precisa de folha própria.');

console.log('Contrato dos Tratamentos Ilustrados OK: leitura fácil, papéis separados, imagens autorais e rascunho volátil.');
