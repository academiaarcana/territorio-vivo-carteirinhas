# Estrutura territorial — UBS, equipes, microáreas e ACS

## Relação adotada

O Território Vivo representa o vínculo institucional nesta ordem:

**Município → UBS → equipe eSF → microárea → ACS**

- cada UBS pode possuir várias equipes;
- cada equipe pode possuir várias microáreas;
- cada ACS pode ser vinculado a uma microárea ativa;
- a quantidade de pessoas acompanhadas pertence à microárea e é exibida junto ao ACS responsável;
- quantidade desconhecida fica como **Não informado**, nunca como zero presumido.

## O que é armazenado

Somente dados institucionais e totais agregados:

- CNES da UBS e INE da equipe, quando confirmados;
- código da microárea;
- quantidade agregada de pessoas;
- data de referência;
- origem do total: relatório e-SUS APS ou confirmação local;
- observação administrativa sem dados pessoais.

Não são armazenados nomes de cidadãos, CPF, CNS, endereço familiar, diagnóstico, receita ou prontuário. O Território Vivo não substitui PEC/e-SUS APS.

## Fontes oficiais e limites

- A [consulta pública do CNES](https://cnes.datasus.gov.br/pages/consultas.jsp) ajuda a conferir estabelecimentos e equipes, mas não deve ser usada para inferir sozinho a divisão interna atual das microáreas nem o total acompanhado por cada ACS.
- O [Guia de Preenchimento dos Cadastros da APS](https://sisaps.saude.gov.br/sistemas/esusaps/docs/guias-preenchimento/cadastros/) orienta os cadastros oficiais que alimentam o território.
- No [e-SUS Território](https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/TERRITORIO/territorio_02/), a microárea do profissional determina quais imóveis, cidadãos e famílias são sincronizados; por isso o vínculo deve ser confirmado localmente.
- O Ministério da Saúde publica [parâmetros populacionais para equipes eSF](https://www.gov.br/saude/pt-br/composicao/saps/esf/equipe-saude-da-familia/faq/qual-e-o-parametro-populacional-das-esf). Esses parâmetros são da equipe, não um limite automático por ACS. O site registra o total observado no relatório local, sem dividir ou estimar pessoas artificialmente.

## Dados a solicitar à tutora ou gestão

Para cada linha:

| Campo | Como preencher |
|---|---|
| Município | Nome e código IBGE |
| UBS | Nome oficial e CNES |
| Equipe | Nome e INE |
| Microárea | Código usado pela equipe/e-SUS |
| ACS responsável | Perfil profissional já aprovado no Território Vivo |
| Pessoas acompanhadas | Total agregado do relatório; vazio se desconhecido |
| Data de referência | Data ou competência do relatório |
| Fonte | Relatório e-SUS APS ou confirmação da gestão/equipe |

## Fluxo administrativo

1. confirmar a UBS e a equipe;
2. cadastrar a microárea na equipe correta;
3. informar o total somente quando houver fonte e data;
4. vincular o perfil ACS à microárea;
5. revisar os totais quando um novo relatório for emitido.
