# Auditoria final de produto — Território Vivo V2

Data: 24/08/2026.

## Escopo

Esta auditoria revisa o Território Vivo como produto de apoio à territorialização e à Atenção Primária à Saúde, contemplando conceito, narrativa, gestão pública, privacidade, governança, experiência, identidade visual e prontidão para apresentação.

A auditoria **não autoriza merge, publicação ou alteração de produção**. O PR permanece em Draft até homologação humana.

## Estado inicial verificado

- Repositório: `academiaarcana/territorio-vivo-carteirinhas`.
- Branch: `refactor/arquitetura-v2`.
- PR: #3, aberto, Draft e não mesclado.
- Base: `main`.
- `main` verificada no início da auditoria: `2992555d22b7e6de55995cbeff607fcfb7fdd262`.
- HEAD verificado no início da auditoria: `4f1aed4e946552c2a1d1d754afc68abfe106f877`.
- Branch divergida de `main`: 89 commits à frente e 2 atrás no início da auditoria.
- CI inicial: `Validar Território Vivo #763`, sucesso.
- Supabase `wguurbmtoofkubdawzzr`: `ACTIVE_HEALTHY`, região `sa-east-1`, PostgreSQL 17.6.
- Organização Supabase: plano `free`.

Nenhum merge/rebase automático foi executado para resolver a divergência.

## Base conceitual oficial revisada

### Política Nacional de Atenção Básica

A PNAB associa territorialização e adscrição ao planejamento e à programação descentralizada de ações setoriais e intersetoriais em território específico, considerando condicionantes e determinantes da saúde e uma visão social, econômica, epidemiológica, assistencial, cultural e identitária do território.

Fonte: Ministério da Saúde — Portaria nº 2.436/2017:
https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prt2436_22_09_2017.html

### Estratégia Saúde da Família

A página atual do Ministério da Saúde reforça que a ESF considera especificidades territoriais, culturais e sociais e desenvolve ações a partir do conhecimento da realidade local e das necessidades da população.

Fonte:
https://www.gov.br/saude/pt-br/composicao/saps/esf/esf/

### Equipes multiprofissionais — eMulti

O Ministério da Saúde informa que as eMulti operam de forma complementar e integrada às demais equipes da APS, compartilhando população e território e fortalecendo articulações com saúde e outros setores, como educação, serviço social, cultura, lazer e esporte.

Fontes:
https://www.gov.br/saude/pt-br/composicao/saps/acoes-interprofissionais/emulti

https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2026/nota-tecnica-conjunta-no-99-2026-cocip-copid-dgci-saps-ms.pdf/view

### Território como processo

A revisão conceitual adotou como princípio que território não é apenas localização geográfica. Para o produto, isso significa representar mudanças, relações, recursos, barreiras e determinantes como elementos que subsidiam planejamento e reavaliação, sem tentar converter toda a complexidade territorial em campos de formulário.

## Síntese da auditoria

### CRÍTICO — corrigido

**5 Minutos incentivava registro potencialmente pessoal.**

O formulário usava “Quem / onde”, a frase “Quem precisa de atenção?” e exemplo com “Pessoa, família ou ponto do território”. Mesmo sendo um rascunho volátil, a microcopy incentivava inserir identificadores pessoais em uma ferramenta cujo propósito é territorial e não clínico.

Correção:
- “Situação / onde”;
- exemplos territoriais não pessoais;
- aviso explícito contra nomes de pacientes/famílias;
- inclusão de “Por que isso importa agora?”;
- responsável descrito por função/equipe/serviço/parceiro, evitando nome pessoal.

### ALTO — corrigido

**O fluxo territorial existia nos módulos, mas não estava explicitado como ciclo único.**

O produto já possuía território, indicadores, 5 Minutos, materiais e reavaliação, porém a narrativa exigia que o usuário deduzisse a conexão entre eles.

Correção:

`Conhecer → Interpretar → Priorizar → Planejar → Agir → Reavaliar`

Esse ciclo agora aparece no tutorial e na comunicação pública como lógica de produto.

### ALTO — corrigido

**Gestão pública estava descrita principalmente como administração de cadastros e permissões.**

A segurança e os escopos estavam corretos, mas faltava explicar o valor territorial de cada escala.

Correção conceitual:

`ACS/profissionais → Equipe → UBS → Gestão Municipal`

Cada nível ganha uma responsabilidade de planejamento sem transformar gestão em vigilância punitiva ou acesso irrestrito.

### MÉDIO — corrigido

**Página inicial não mostrava uma leitura territorial imediata.**

Foi acrescentado um resumo baseado somente nos achados não pessoais visíveis no escopo autorizado:
- achados ativos;
- barreiras/riscos;
- recursos/potencialidades;
- itens que precisam de revisão.

Esses números são instrumentos de orientação e não indicadores de desempenho de profissionais ou unidades.

### MÉDIO — corrigido

**A identidade visual estava excessivamente concentrada no azul institucional.**

A cor azul principal homologada foi preservada. Uma camada complementar de tela adiciona:
- verde territorial para recursos, território e ciclo;
- tom quente de planejamento para gestão/revisão;
- azul-petróleo para informação.

Não foram introduzidos gradientes, excesso de cores nem mudanças nos estilos de impressão/PDF.

### BAIXO — parcialmente tratado

**Uso do termo “mapa inteligente”.**

O termo foi removido das novas narrativas de tutorial e página pública, preferindo “leitura territorial”. A tela operacional histórica ainda pode manter referências a “mapa inteligente”; isso não foi tratado por refactor amplo na véspera da apresentação para evitar risco funcional desnecessário.

## O que foi fortalecido

### Territorialização

O produto agora torna explícitos:
- território como processo e não somente mapa;
- população/escopo territorial como referência do trabalho;
- recursos e potencialidades, não apenas riscos;
- barreiras de acesso;
- rede e parceiros;
- interpretação do significado do achado;
- prioridade;
- ação;
- responsável/articulação;
- reavaliação;
- olhar intersetorial.

### Gestão pública

A narrativa diferencia:
- conhecimento situado do ACS/profissional;
- decisão compartilhada da equipe;
- organização local da UBS;
- visão agregada da Gestão Municipal;
- administração técnica do Master.

A autorização continua sendo definida no PostgreSQL/Supabase e não no texto da interface.

### Intersetorialidade

Foram incorporadas como **lentes de discussão**, não como nova taxonomia de banco:
- saúde;
- educação;
- assistência social;
- mobilidade/transporte;
- saneamento/infraestrutura;
- segurança alimentar;
- esporte/lazer/cultura;
- associações/espaços comunitários.

## Decisões de NÃO adicionar nesta etapa

### Não criar cadastro de pacientes/famílias

Incompatível com o escopo e a privacidade do produto.

### Não criar uma nova tabela de “planejamento”

O ciclo pode ser demonstrado com `territory_points`, 5 Minutos e Indicadores sem introduzir persistência adicional na véspera da apresentação. Uma futura entidade de plano territorial exigiria desenho de governança, prazo, autoria, RLS e retenção próprios.

### Não criar taxonomia extensa de determinantes/intersetorialidade no banco

Criaria burocracia e falsa completude. Os setores permanecem lentes conceituais; os tipos operacionais simples de achado continuam suficientes nesta fase.

### Não criar ranking de ACS, equipes ou UBS

Incompatível com a proposta de planejamento territorial e sujeito a interpretações punitivas indevidas.

### Não criar mapa interativo com API externa

O atalho gratuito de localização existente atende ao escopo atual sem API key, billing ou coleta de geolocalização do usuário.

### Não fazer grande refactor da Gestão

A área já possui escopos, capabilities e contratos de segurança robustos. Nesta etapa, o ganho prioritário é tornar a dimensão de planejamento público mais clara na narrativa e no painel, sem reescrever uma área administrativa sensível antes da apresentação.

### Não alterar banco/migrations

As melhorias desta auditoria podem ser entregues sem nova DDL, RLS ou dados persistentes.

## Segurança e desempenho — Supabase

### Security Advisor

Foi observado um aviso de `Leaked Password Protection Disabled`.

Não foi ativado nesta auditoria porque:
- a tarefa não autoriza mudança de configuração de Auth;
- a regra financeira exige comprovação prévia de ausência de custo;
- não é correto alterar autenticação na véspera da apresentação sem homologação específica.

Referência de remediação do Supabase:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

### Performance Advisor

Foram observados avisos informativos de índices ainda não utilizados. Nenhum índice foi removido. Em um projeto jovem, ausência de uso acumulado não demonstra que o índice seja desnecessário.

## Paleta e identidade

A marca azul permanece como identidade primária e como `theme-color`.

Camada complementar:
- **Primary:** azul institucional já homologado `#005BAA`;
- **Território/Secondary:** `#2F6F52`;
- **Planejamento/Accent:** `#9A5B21`;
- **Informação:** `#0B5E75`;
- superfícies claras derivadas para não competir com conteúdo.

A nova camada é aplicada somente em `@media screen`, preservando impressão e PDF.

## Critério editorial aplicado

Preferir:
- apoia;
- organiza;
- favorece a discussão;
- ajuda a visualizar;
- contribui para o planejamento;
- facilita a comunicação.

Evitar promessas clínicas ou de desempenho não demonstradas.

## Pendências exclusivamente humanas

Antes de qualquer merge/publicação ainda é necessário validar em navegador real:
- clareza visual do novo tutorial;
- legibilidade da nova paleta em projetor;
- responsividade das novas seções;
- leitura do dashboard territorial por cada papel;
- fluxo do 5 Minutos atualizado;
- PDFs já pendentes de homologação visual;
- contas reais conforme os papéis definidos no PR.

## Critério para apresentação

A demonstração deve conseguir contar esta história em 5–7 minutos:

`PROBLEMA → TERRITÓRIO → SIGNIFICADO → PRIORIDADE → AÇÃO → REAVALIAÇÃO`

com a gestão pública apresentada como mudança de escala de planejamento, e não como mecanismo de ranking ou vigilância de profissionais.
