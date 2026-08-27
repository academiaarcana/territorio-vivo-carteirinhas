# Design QA — Território, Carteirinhas, 5 Minutos, Indicadores, Educação e Prescrições em Campo

## Evidências

- Fonte visual: `/workspace/scratch/47bc8ece9b5f/generated_images/exec-86adee3b-15ca-4c3c-ac9f-6a057afe5359.png`
- Fonte visual aberta: sim; referência “Painel de Campo”, 1488 × 1058 px.
- Implementação: `src/pages/territory.js`, `src/styles/field-territory.css`, `src/pages/cards.js`, `src/styles/field-cards.css`, `src/pages/five.js`, `src/styles/field-five.css`, `src/pages/indicators.js`, `src/styles/field-indicators.css`, `src/pages/education.js`, `src/styles/field-education.css`, `src/pages/prescriptions.js`, `src/data/prescription-support.js`, `src/assets/prescription-support/` e `src/styles/field-prescriptions.css`.
- Captura da implementação: indisponível.
- Tentativa atual de captura: a prévia local respondeu na porta `4173`, mas o navegador em nuvem bloqueou o endereço antes da renderização com `ERR_BLOCKED_BY_CLIENT`.
- Viewport-alvo: desktop 1440 × 1024 CSS px, densidade 1×; reflow previsto em 760 px.
- Estados-alvo: rotas `#/app/territorio`, `#/app/carteirinhas`, `#/app/5-minutos`, `#/app/indicadores`, `#/app/educacao` e `#/app/prescricoes` com um perfil autenticado e vínculo territorial válido; a última exige papel Médico ou Enfermeiro ativo.
- Interações prioritárias: filtrar achados e rede, cadastrar e gerenciar achados conforme permissão; buscar e filtrar modelos, abrir o editor, preencher lote, ajustar acessibilidade e iniciar PDF/impressão; preencher a nota dos 5 minutos; selecionar escopo, informar indicadores, registrar a leitura contextual; abrir materiais educativos, imprimir, gerar PDF e acessar ferramentas externas identificadas; preservar os rascunhos durante a navegação e limpar quando aplicável.
- Console do navegador: não verificado porque o navegador em nuvem bloqueou o endereço local nesta sessão com `ERR_BLOCKED_BY_CLIENT`; a ponte local anterior também havia recusado a prévia com `ERR_CONNECTION_REFUSED`.

## Comparação de tela inteira

Bloqueada. A referência aprovada define shell, cores, tipografia, densidade e hierarquia, mas representa a rota Início. As rotas Território, Carteirinhas, 5 Minutos, Indicadores e Educação estendem esse sistema sem telas-fonte específicas geradas pelo 12UI, cuja autenticação foi cancelada após bloqueio de segurança do Fortinet. Sem capturas reais da implementação, não é possível encerrar diferenças visuais P0/P1/P2.

## Comparação de regiões focadas

Bloqueada. Não foi possível produzir uma composição conjunta contendo a referência e uma captura renderizada dos seguintes trechos:

- introdução do território e ação principal;
- filtros e métricas de achados;
- cartões de achados e estados;
- formulário de registro;
- rede de unidades e breakpoint móvel;
- biblioteca, filtros e cartões de modelos;
- editor, opções de acessibilidade e prévia da carteirinha;
- estados desktop e móvel das Carteirinhas.
- introdução, duração e roteiro em quatro movimentos dos 5 Minutos;
- formulário sequencial, opções de impressão e estados desktop e móvel da nota.
- introdução e ciclo em quatro movimentos dos Indicadores;
- referência, grupos numéricos, reflexão territorial, opções de impressão e estados desktop e móvel dos Indicadores.
- introdução, biblioteca interna e cartões de Educação em saúde;
- ferramentas externas, detalhe do material, fontes, opções de impressão e estados desktop e móvel da Educação.
- gerador local de orientações visuais, colagem temporária do PEC, seleção de via e período, biblioteca com dez categorias, busca, seleção de apoios, avisos de retirada de corticoide e validação cultural, prévia, lista, remoção, limpeza, impressão/PDF, fronteira de privacidade, orientação específica por papel e reflow móvel.

## Superfícies de fidelidade

- Tipografia: a família Inter e a escala do Painel de Campo foram preservadas no código; wrapping e peso óptico não foram confirmados em navegador.
- Espaçamento e ritmo: Território usa faixa introdutória, área de trabalho assimétrica e métricas leves; Carteirinhas usa biblioteca em três colunas e editor com formulário e prévia; 5 Minutos usa roteiro lateral e formulário sequencial; Indicadores usa faixa introdutória, ciclo em quatro movimentos e área assimétrica entre números e interpretação; Educação separa biblioteca interna, ferramentas externas e detalhe sequencial. As superfícies passam a uma coluna em telas menores. As proporções finais dependem de captura.
- Cores e tokens: azul profundo, azul de ação, verde territorial e neutros reutilizam os tokens de `field-dashboard.css`; contraste renderizado ainda requer evidência visual.
- Imagens e ícones: a biblioteca Flaticon já atribuída foi preservada e vinte pictogramas autorais foram gerados individualmente para vias, períodos, sintomas, associações, redução gradual e dois contextos de povos indígenas. Não foram usados recortes, sprites, logotipos, código ou ativos do site externo. A origem Google Cloud própria está documentada, mas não foi ativada porque o ambiente ainda não possui acesso `gcloud`.
- Texto e conteúdo: a redação permanece não pessoal e orientada à equipe; Carteirinhas, 5 Minutos e Indicadores mantêm declarações explícitas de dados temporários e não persistentes. Indicadores também explicita que campo vazio não equivale a zero. Educação identifica ferramentas externas, remove parâmetros de rastreamento e declara que elas não integram prontuários, contas ou dados do produto. Prescrições restringe o acesso a Médico/Enfermeiro, não coleta identificação ou diagnóstico, mantém o rascunho somente em memória e explicita que os pictogramas não substituem a prescrição original.

## Histórico de comparação

Não houve iteração visual válida porque não foi possível abrir a implementação em navegador. A inspeção da referência e os testes automatizados não substituem a comparação visual exigida.

## Verificações concluídas

- Todos os scripts Node equivalentes ao `npm run check`: aprovados integralmente; o agrupador npm foi bloqueado pelo ambiente antes de iniciar.
- Contrato “Território em Campo”: aprovado.
- Contrato “Carteirinhas em Campo”: aprovado.
- Contrato “5 Minutos em Campo”: aprovado.
- Contrato “Indicadores em Campo”: aprovado.
- Contrato “Educação em Campo”: aprovado.
- Contrato clínico Médico/Enfermeiro: aprovado.
- Sintaxe JavaScript: aprovada.
- Arquitetura, segurança, migrations, Auth, papéis, concorrência, coordenadas, impressão e PDF: aprovados.
- Migration de papéis clínicos: versionada e pendente de aplicação; banco e contas de produção ainda não foram alterados.

## Bloqueador

Obter capturas reais das rotas autenticadas Território, Carteirinhas, 5 Minutos, Indicadores, Educação e Prescrições em desktop e celular, verificar as interações e o console e comparar as implementações com a referência em uma composição conjunta.

final result: blocked
