# Design QA — Painel de Campo

## Evidências

- Fonte visual: `/workspace/scratch/47bc8ece9b5f/generated_images/exec-86adee3b-15ca-4c3c-ac9f-6a057afe5359.png`
- Implementação: `src/core/layout.js`, `src/pages/dashboard.js` e `src/styles/field-dashboard.css`
- Captura da implementação: indisponível; a prévia local foi recusada pela ponte do navegador (`ERR_CONNECTION_REFUSED`).
- Viewport-alvo: 1440 × 1024 CSS px, densidade 1×.
- Fonte visual: 1488 × 1058 px.
- Estado-alvo: tela inicial de ACS ativo, UBS Madre Tereza de Calcutá, Equipe 02, Microárea 08.
- Navegador: Chrome em ambiente isolado.
- Interações primárias no navegador: não executadas porque a página local não ficou acessível ao navegador.
- Console do navegador: não verificado pelo mesmo bloqueio.

## Comparação de tela inteira

Bloqueada. A referência foi aberta e inspecionada, mas não foi possível obter uma captura renderizada da implementação no mesmo navegador e estado. Testes automatizados e inspeção de código não substituem essa evidência visual.

## Comparação de regiões focadas

Bloqueada pelo mesmo motivo. Não foi possível comparar navegação lateral, faixa territorial, jornada em três etapas e leitura territorial em uma composição conjunta de referência e implementação.

## Superfícies de fidelidade

- Tipografia: Montserrat e a escala escolhida foram preservadas no código, mas wrapping, peso óptico e rasterização não foram confirmados em navegador.
- Espaçamento e ritmo: a grade, as larguras e os breakpoints foram implementados, mas não há captura válida para confirmar proporções.
- Cores e tokens: azul profundo, azul SUS, verde territorial e neutros foram mapeados em tokens CSS; contraste visual final ainda requer captura.
- Imagens e ícones: o símbolo existente e os ícones Flaticon já atribuídos foram reutilizados; nenhum ativo substituto foi criado. Qualidade de renderização ainda requer captura.
- Texto: títulos, escopos, ações e mensagens do produto foram preservados e os testes contratuais passaram.

## Histórico de comparação

Não houve iteração visual válida, pois a primeira captura da implementação foi bloqueada antes de renderizar. Nenhum P0/P1/P2 visual pode ser encerrado sem essa evidência.

## Verificações concluídas

- `npm run check` executado em modo offline: aprovado integralmente.
- Novo contrato do Painel de Campo: aprovado.
- Arquitetura, segurança, migrations, papéis, autenticação, impressão e PDF: aprovados.

## Pendência

- Abrir a implementação em uma prévia acessível ao navegador.
- Capturar desktop 1440 × 1024 e um breakpoint móvel.
- Testar as ações principais e verificar o console.
- Comparar referência e implementação na mesma composição e corrigir diferenças P0/P1/P2.

final result: blocked
