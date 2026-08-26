# Design QA — Território em Campo

## Evidências

- Fonte visual: `/workspace/scratch/47bc8ece9b5f/generated_images/exec-86adee3b-15ca-4c3c-ac9f-6a057afe5359.png`
- Fonte visual aberta: sim; referência “Painel de Campo”, 1488 × 1058 px.
- Implementação: `src/pages/territory.js` e `src/styles/field-territory.css`.
- Captura da implementação: indisponível.
- Viewport-alvo: desktop 1440 × 1024 CSS px, densidade 1×; reflow previsto em 760 px.
- Estado-alvo: rota `#/app/territorio` com um perfil autenticado e vínculo territorial válido.
- Interações prioritárias: filtrar achados, filtrar rede, abrir o cadastro, registrar, editar, resolver e excluir conforme permissão.
- Console do navegador: não verificado porque o navegador em nuvem não está disponível nesta sessão e a ponte local já havia recusado a prévia com `ERR_CONNECTION_REFUSED`.

## Comparação de tela inteira

Bloqueada. A referência aprovada define shell, cores, tipografia, densidade e hierarquia, mas representa a rota Início. A nova rota territorial estende esse sistema sem uma tela-fonte específica gerada pelo 12UI, cuja autenticação foi cancelada após bloqueio de segurança do Fortinet. Sem captura real da implementação, não é possível encerrar diferenças visuais P0/P1/P2.

## Comparação de regiões focadas

Bloqueada. Não foi possível produzir uma composição conjunta contendo a referência e uma captura renderizada dos seguintes trechos:

- introdução do território e ação principal;
- filtros e métricas de achados;
- cartões de achados e estados;
- formulário de registro;
- rede de unidades e breakpoint móvel.

## Superfícies de fidelidade

- Tipografia: a família Inter e a escala do Painel de Campo foram preservadas no código; wrapping e peso óptico não foram confirmados em navegador.
- Espaçamento e ritmo: a página usa faixa introdutória, área de trabalho assimétrica, métricas leves e grade de duas colunas; proporções finais dependem de captura.
- Cores e tokens: azul profundo, azul de ação, verde territorial e neutros reutilizam os tokens de `field-dashboard.css`; contraste renderizado ainda requer evidência visual.
- Imagens e ícones: somente a biblioteca Flaticon já atribuída no projeto foi reutilizada. Não foram criados placeholders, ícones artesanais ou novos ativos.
- Texto e conteúdo: a redação permanece não clínica, não pessoal e orientada à equipe; os dados e as permissões existentes não foram alterados.

## Histórico de comparação

Não houve iteração visual válida porque não foi possível abrir a implementação em navegador. A inspeção da referência e os testes automatizados não substituem a comparação visual exigida.

## Verificações concluídas

- `npm run check`: aprovado integralmente em modo offline.
- Contrato “Território em Campo”: aprovado.
- Sintaxe JavaScript: aprovada.
- Arquitetura, segurança, migrations, Auth, papéis, concorrência, coordenadas, impressão e PDF: aprovados.
- Alterações de banco, RLS, migrations e contas: nenhuma.

## Bloqueador

Obter uma captura real da rota autenticada em desktop e celular, verificar as interações e o console e comparar a implementação com a referência em uma composição conjunta.

final result: blocked
