# Design QA — Território, Carteirinhas, 5 Minutos e Indicadores em Campo

## Evidências

- Fonte visual: `/workspace/scratch/47bc8ece9b5f/generated_images/exec-86adee3b-15ca-4c3c-ac9f-6a057afe5359.png`
- Fonte visual aberta: sim; referência “Painel de Campo”, 1488 × 1058 px.
- Implementação: `src/pages/territory.js`, `src/styles/field-territory.css`, `src/pages/cards.js`, `src/styles/field-cards.css`, `src/pages/five.js`, `src/styles/field-five.css`, `src/pages/indicators.js` e `src/styles/field-indicators.css`.
- Captura da implementação: indisponível.
- Tentativa atual de captura: a prévia local respondeu na porta `4173`, mas o navegador em nuvem bloqueou o endereço antes da renderização com `ERR_BLOCKED_BY_CLIENT`.
- Viewport-alvo: desktop 1440 × 1024 CSS px, densidade 1×; reflow previsto em 760 px.
- Estados-alvo: rotas `#/app/territorio`, `#/app/carteirinhas`, `#/app/5-minutos` e `#/app/indicadores` com um perfil autenticado e vínculo territorial válido.
- Interações prioritárias: filtrar achados e rede, cadastrar e gerenciar achados conforme permissão; buscar e filtrar modelos, abrir o editor, preencher lote, ajustar acessibilidade e iniciar PDF/impressão; preencher a nota dos 5 minutos; selecionar escopo, informar indicadores, registrar a leitura contextual; preservar os rascunhos durante a navegação, limpar, imprimir e gerar PDF.
- Console do navegador: não verificado porque o navegador em nuvem bloqueou o endereço local nesta sessão com `ERR_BLOCKED_BY_CLIENT`; a ponte local anterior também havia recusado a prévia com `ERR_CONNECTION_REFUSED`.

## Comparação de tela inteira

Bloqueada. A referência aprovada define shell, cores, tipografia, densidade e hierarquia, mas representa a rota Início. As rotas Território, Carteirinhas, 5 Minutos e Indicadores estendem esse sistema sem telas-fonte específicas geradas pelo 12UI, cuja autenticação foi cancelada após bloqueio de segurança do Fortinet. Sem capturas reais da implementação, não é possível encerrar diferenças visuais P0/P1/P2.

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

## Superfícies de fidelidade

- Tipografia: a família Inter e a escala do Painel de Campo foram preservadas no código; wrapping e peso óptico não foram confirmados em navegador.
- Espaçamento e ritmo: Território usa faixa introdutória, área de trabalho assimétrica e métricas leves; Carteirinhas usa biblioteca em três colunas e editor com formulário e prévia; 5 Minutos usa roteiro lateral e formulário sequencial; Indicadores usa faixa introdutória, ciclo em quatro movimentos e área assimétrica entre números e interpretação. As superfícies passam a uma coluna em telas menores. As proporções finais dependem de captura.
- Cores e tokens: azul profundo, azul de ação, verde territorial e neutros reutilizam os tokens de `field-dashboard.css`; contraste renderizado ainda requer evidência visual.
- Imagens e ícones: somente a biblioteca Flaticon já atribuída no projeto foi reutilizada. Não foram criados placeholders, ícones artesanais ou novos ativos.
- Texto e conteúdo: a redação permanece não clínica, não pessoal e orientada à equipe; Carteirinhas, 5 Minutos e Indicadores mantêm declarações explícitas de dados temporários e não persistentes. Indicadores também explicita que campo vazio não equivale a zero. Dados, cálculos e permissões não foram alterados.

## Histórico de comparação

Não houve iteração visual válida porque não foi possível abrir a implementação em navegador. A inspeção da referência e os testes automatizados não substituem a comparação visual exigida.

## Verificações concluídas

- `npm run check`: aprovado integralmente em modo offline.
- Contrato “Território em Campo”: aprovado.
- Contrato “Carteirinhas em Campo”: aprovado.
- Contrato “5 Minutos em Campo”: aprovado.
- Contrato “Indicadores em Campo”: aprovado.
- Sintaxe JavaScript: aprovada.
- Arquitetura, segurança, migrations, Auth, papéis, concorrência, coordenadas, impressão e PDF: aprovados.
- Alterações de banco, RLS, migrations e contas: nenhuma.

## Bloqueador

Obter capturas reais das rotas autenticadas Território, Carteirinhas, 5 Minutos e Indicadores em desktop e celular, verificar as interações e o console e comparar as implementações com a referência em uma composição conjunta.

final result: blocked
