import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  professionalFunctions,
  publicTeamResearch,
  quickTutorial,
  systemFunctions,
  territoryVivoObjectives,
  territoryVivoProblem
} from '../src/data/tutorial-content.js';

const main = fs.readFileSync('src/main.js', 'utf8');
const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const dashboard = fs.readFileSync('src/pages/dashboard.js', 'utf8');
const tutorial = fs.readFileSync('src/pages/tutorial.js', 'utf8');
const profile = fs.readFileSync('src/pages/profile.js', 'utf8');
const publicPage = fs.readFileSync('src/pages/public.js', 'utf8');
const migration31 = fs.readFileSync('supabase/migrations/031_enforce_management_scope_shape.sql', 'utf8');

assert.match(main, /registerRoute\('\/app\/tutorial',[\s\S]*CAPABILITIES\.ACCESS_INTERNAL/, 'Tutorial precisa ser rota interna protegida.');
assert.match(layout, /\['\/app\/tutorial', 'Objetivo e tutorial'/, 'Menu precisa expor Objetivo e tutorial.');
assert.match(dashboard, /data-go="\/app\/tutorial"/, 'Início precisa oferecer acesso ao tutorial.');
assert.match(tutorial, /O problema/, 'Tutorial precisa explicar o problema antes de listar ferramentas.');
assert.match(tutorial, /Como o sistema responde/, 'Tutorial precisa conectar problema e objetivo.');
assert.match(tutorial, /Pesquisa pública não cria automaticamente lotação/, 'Tutorial precisa separar pesquisa pública de cadastro operacional.');
assert.match(tutorial, /Não constitui sistema oficial do Ministério da Saúde/, 'Tutorial precisa manter disclaimer institucional explícito.');

assert.equal(quickTutorial.length, 7, 'Tutorial rápido precisa manter sete passos demonstráveis.');
assert.ok(territoryVivoProblem.length >= 3, 'Narrativa precisa registrar ao menos três aspectos do problema.');
assert.ok(territoryVivoObjectives.length >= 3, 'Narrativa precisa registrar objetivos claros.');
assert.ok(systemFunctions.length >= 12, 'Tutorial precisa cobrir o conjunto funcional atual.');
assert.ok(professionalFunctions.length >= 10, 'Referência profissional não pode desaparecer da apresentação.');
assert.deepEqual(
  publicTeamResearch.map((item) => item.value),
  [4, 3, 1, 'Identificado'],
  'Pesquisa resumida deve distinguir contagens CNES verificadas de modalidade rural apenas identificada.'
);

for (const expected of [
  'Início e contexto territorial',
  'Território, rede e mapa inteligente',
  'Carteirinhas e acessibilidade',
  'Lote, impressão e PDF A4',
  '5 minutos do território',
  'Indicadores',
  'Educação em saúde',
  'Meu perfil',
  'Aprovações',
  'Gestão da UBS e da rede',
  'Controle de acesso e privacidade por desenho'
]) {
  assert.ok(systemFunctions.some((item) => item.title === expected), `Função ausente do tutorial: ${expected}`);
}

assert.match(migration31, /if new\.role = 'admin' then[\s\S]*new\.municipality_code := null;[\s\S]*new\.unit_cnes := null;/, 'Banco precisa manter administração de rede sem vínculo territorial fixo.');
assert.match(profile, /networkAdmin \? \{\} : \{/, 'Perfil de Gestor/Master não pode enviar vínculo territorial fictício.');
assert.match(profile, /Toda a rede cadastrada/, 'Perfil de Gestor/Master precisa explicar o escopo real de rede.');
assert.doesNotMatch(profile, /contexto padrão de materiais não altera esse escopo/i, 'Perfil não deve prometer contexto territorial persistente que o banco remove.');

assert.match(publicPage, /Administrador da própria UBS e Gestor Municipal/, 'Página pública precisa diferenciar Administrador da UBS e Gestor Municipal.');
assert.match(publicPage, /Master \/ Desenvolvimento permanece separada/, 'Página pública precisa separar a conta técnica Master.');
assert.match(publicPage, /Território Vivo — ferramenta de apoio à Atenção Primária à Saúde\. Não constitui sistema oficial do Ministério da Saúde\./, 'Página pública precisa usar o disclaimer institucional aprovado.');

console.log('Contrato de apresentação OK: problema, objetivo, tutorial, funções, pesquisa pública, escopos e disclaimer protegidos.');
