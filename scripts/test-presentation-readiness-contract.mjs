import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  intersectoralLenses,
  managementLevels,
  professionalFunctions,
  publicTeamResearch,
  quickTutorial,
  systemFunctions,
  territorializationCycle,
  territoryVivoObjectives,
  territoryVivoProblem
} from '../src/data/tutorial-content.js';

const main = fs.readFileSync('src/main.js', 'utf8');
const layout = fs.readFileSync('src/core/layout.js', 'utf8');
const dashboard = fs.readFileSync('src/pages/dashboard.js', 'utf8');
const tutorial = fs.readFileSync('src/pages/tutorial.js', 'utf8');
const five = fs.readFileSync('src/pages/five.js', 'utf8');
const profile = fs.readFileSync('src/pages/profile.js', 'utf8');
const publicPage = fs.readFileSync('src/pages/public.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
const territoryCss = fs.readFileSync('src/styles/territory-refinement.css', 'utf8');
const migration31 = fs.readFileSync('supabase/migrations/031_enforce_management_scope_shape.sql', 'utf8');

assert.match(main, /registerRoute\('\/app\/tutorial',[\s\S]*CAPABILITIES\.ACCESS_INTERNAL/, 'Tutorial precisa ser rota interna protegida.');
assert.match(layout, /\['\/app\/tutorial', 'Objetivo e tutorial'/, 'Menu precisa expor Objetivo e tutorial.');
assert.match(dashboard, /data-go="\/app\/tutorial"/, 'Início precisa oferecer acesso ao tutorial.');
assert.match(tutorial, /O problema/, 'Tutorial precisa explicar o problema antes de listar ferramentas.');
assert.match(tutorial, /Território → decisão/, 'Tutorial precisa explicitar o ciclo território para decisão.');
assert.match(tutorial, /Do território à gestão/, 'Tutorial precisa explicar como o conhecimento territorial muda de escala na gestão.');
assert.match(tutorial, /Olhar intersetorial/, 'Tutorial precisa reconhecer a dimensão intersetorial sem criar taxonomia operacional nova.');
assert.match(tutorial, /Pesquisa pública não cria automaticamente lotação/, 'Tutorial precisa separar pesquisa pública de cadastro operacional.');
assert.match(tutorial, /Não constitui sistema oficial do Ministério da Saúde/, 'Tutorial precisa manter disclaimer institucional explícito.');

assert.equal(quickTutorial.length, 8, 'Tutorial rápido precisa manter oito passos demonstráveis do contexto à reavaliação.');
assert.ok(territoryVivoProblem.length >= 3, 'Narrativa precisa registrar ao menos três aspectos do problema.');
assert.ok(territoryVivoObjectives.length >= 3, 'Narrativa precisa registrar objetivos claros.');
assert.ok(systemFunctions.length >= 12, 'Tutorial precisa cobrir o conjunto funcional atual.');
assert.ok(professionalFunctions.length >= 10, 'Referência profissional não pode desaparecer da apresentação.');
assert.deepEqual(
  territorializationCycle.map(([title]) => title),
  ['Conhecer', 'Interpretar', 'Priorizar', 'Planejar', 'Agir', 'Reavaliar'],
  'Ciclo territorial precisa ligar conhecimento, prioridade, ação e reavaliação em ordem explícita.'
);
assert.ok(managementLevels.some((item) => item.title === 'ACS e profissionais do território'), 'Gestão territorial precisa começar pelo conhecimento situado dos profissionais.');
assert.ok(managementLevels.some((item) => item.title === 'Equipe de Saúde'), 'Equipe precisa aparecer como nível de decisão compartilhada.');
assert.ok(managementLevels.some((item) => item.title === 'UBS'), 'UBS precisa aparecer como nível organizador local.');
assert.ok(managementLevels.some((item) => item.title === 'Gestão Municipal'), 'Gestão Municipal precisa aparecer como visão agregada da rede.');
assert.ok(managementLevels.every((item) => !/ranking|punitiv/i.test(item.title)), 'Níveis de gestão não podem ser apresentados como ranking.');
assert.ok(intersectoralLenses.includes('Educação') && intersectoralLenses.includes('Assistência social') && intersectoralLenses.includes('Saneamento e infraestrutura'), 'Olhar intersetorial precisa cobrir setores centrais sem virar cadastro clínico.');
assert.deepEqual(
  publicTeamResearch.map((item) => item.value),
  [4, 3, 1, 'Identificado'],
  'Pesquisa resumida deve distinguir contagens CNES verificadas de modalidade rural apenas identificada.'
);

for (const expected of [
  'Início e contexto territorial',
  'Território, rede e leitura territorial',
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

assert.match(dashboard, /listTerritoryPoints/, 'Início precisa usar achados reais permitidos pelo escopo para a leitura territorial rápida.');
for (const expected of ['Achados ativos', 'Barreiras / riscos', 'Recursos / potencialidades', 'Precisam de revisão']) {
  assert.match(dashboard, new RegExp(expected.replace('/', '\\/')), `Painel territorial precisa expor o resumo: ${expected}`);
}
assert.match(dashboard, /não para avaliar desempenho individual|sem transformar informação em ranking punitivo/i, 'Dashboard precisa declarar finalidade de planejamento e não ranking.');

assert.match(five, /name="importance"/, '5 minutos precisa perguntar por que o achado importa antes da decisão.');
assert.match(five, /Situação \/ onde/, '5 minutos precisa usar linguagem territorial não pessoal.');
assert.match(five, /Não registre nomes de pacientes ou famílias/, '5 minutos precisa alertar explicitamente contra identificadores pessoais.');
assert.doesNotMatch(five, /placeholder="Pessoa, família ou ponto do território"/, '5 minutos não pode convidar a registrar pessoa ou família identificável.');
assert.doesNotMatch(five, /Quem precisa de atenção\?/, 'Roteiro dos 5 minutos deve se concentrar na situação territorial, não em identificação de pessoa.');

assert.match(migration31, /if new\.role = 'admin' then[\s\S]*new\.municipality_code := null;[\s\S]*new\.unit_cnes := null;/, 'Banco precisa manter administração de rede sem vínculo territorial fixo.');
assert.match(profile, /networkAdmin \? \{\} : \{/, 'Perfil de Gestor/Master não pode enviar vínculo territorial fictício.');
assert.match(profile, /Toda a rede cadastrada/, 'Perfil de Gestor/Master precisa explicar o escopo real de rede.');
assert.doesNotMatch(profile, /contexto padrão de materiais não altera esse escopo/i, 'Perfil não deve prometer contexto territorial persistente que o banco remove.');

assert.match(publicPage, /Administrador da própria UBS e Gestor Municipal/, 'Página pública precisa diferenciar Administrador da UBS e Gestor Municipal.');
assert.match(publicPage, /Master \/ Desenvolvimento permanece separada/, 'Página pública precisa separar a conta técnica Master.');
assert.match(publicPage, /territorializationCycle/, 'Página pública precisa apresentar o ciclo territorial de forma resumida.');
assert.match(publicPage, /territory-vivo-symbol/, 'Página pública precisa usar o mesmo símbolo próprio do Território Vivo usado na aplicação.');
assert.match(publicPage, /Território Vivo — ferramenta de apoio à Atenção Primária à Saúde\. Não constitui sistema oficial do Ministério da Saúde\./, 'Página pública precisa usar o disclaimer institucional aprovado.');

assert.match(index, /territory-refinement\.css/, 'Aplicação precisa carregar a camada de refinamento territorial.');
assert.ok(index.indexOf('territory-refinement.css') > index.indexOf('sus-identity.css'), 'Refinamento territorial deve complementar a identidade já homologada, não substituí-la.');
assert.match(territoryCss, /--territory:\s*#2f6f52/, 'Paleta precisa ter cor secundária territorial funcional.');
assert.match(territoryCss, /--planning:\s*#9a5b21/, 'Paleta precisa distinguir planejamento sem depender apenas do azul institucional.');
assert.doesNotMatch(territoryCss, /linear-gradient|radial-gradient/, 'Refinamento não deve introduzir gradientes decorativos.');
assert.match(territoryCss, /@media screen/, 'Refinamento visual não pode alterar estilos de impressão/PDF homologados.');
assert.match(territoryCss, /@media \(max-width: 900px\)[\s\S]*#app\[data-route="\/app\/inicio"\] \.kpi-grid[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/, 'KPIs internos precisam reduzir para duas colunas antes do breakpoint mobile em tablets estreitos.');
assert.match(territoryCss, /#app\[data-route="\/app\/5-minutos"\] \.two-column/, '5 minutos precisa abandonar duas colunas quando a área útil do tablet fica estreita.');
assert.match(territoryCss, /#app\[data-route="\/app\/tutorial"\] \.intersectoral-panel/, 'Painel intersetorial precisa colapsar antes que suas larguras mínimas causem overflow no tablet.');
assert.match(territoryCss, /@media \(max-width: 760px\)[\s\S]*#app\[data-route="\/app\/inicio"\] \.kpi-grid[\s\S]*grid-template-columns: 1fr/, 'KPIs internos precisam continuar em uma coluna no mobile.');

console.log('Contrato de apresentação OK: territorialização, gestão pública, intersetorialidade, privacidade, escopos, responsividade e identidade visual protegidos.');
