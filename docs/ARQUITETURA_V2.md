# Território Vivo — Arquitetura V2

## Objetivo

Transformar o protótipo acumulativo em uma aplicação web modular, auditável, multi-UBS e segura, mantendo hospedagem estática exclusivamente no GitHub Pages e Supabase como backend.

A V2 deve ser funcionalmente completa antes da etapa de design visual definitivo.

## Princípios

1. **Sem prontuário paralelo**: dados de pacientes/famílias usados em carteirinhas, indicadores e notas de reunião permanecem temporários no navegador por padrão.
2. **Separação de responsabilidades**: interface, autenticação, autorização, acesso a dados, impressão e conteúdo ficam em módulos distintos.
3. **Multiunidade e multimunicípio**: Município → Unidade de saúde → Equipe → Microárea → Profissional.
4. **Permissão no banco**: a interface nunca é a única barreira. RLS, constraints, funções e triggers são a fonte de verdade.
5. **Autocadastro com aprovação**: qualquer profissional pode solicitar conta, mas o conteúdo interno só é liberado depois da validação do vínculo pela gestão.
6. **Menor privilégio**: ACS atua no próprio contexto; administrador de UBS somente na própria unidade; Gestor Municipal atua na rede; a conta técnica Master tem apenas os privilégios superiores necessários para governar contas `admin`.
7. **Impressão como recurso de primeira classe**: A4, preto e branco, 2/4/8/12 por folha, economia de toner, leitura fácil e apoio visual quando aplicável.
8. **Conteúdo técnico versionável**: educação em saúde registra fonte, data de revisão e aviso de segurança.
9. **Sem segredo no navegador**: frontend usa somente URL e publishable key; nenhuma secret/service role é aceita.
10. **Plataforma única de deploy**: produção é GitHub Pages; a branch de desenvolvimento não depende de configuração Vercel.

## Estrutura

```text
index.html
config.js
src/
  main.js
  core/
    access-control.js
    store.js
    router.js
    layout.js
    session.js
    permissions.js
    a11y.js
  lib/
    dom.js
    forms.js
    print-accessibility.js
    visual-support.js
  services/
    supabase.js
    auth.js
    repository.js
    access.js
  data/
    cards.js
    education.js
    indicators.js
  pages/
    public.js
    auth.js
    access-pending.js
    access-management.js
    dashboard.js
    territory.js
    cards.js
    five.js
    indicators.js
    education.js
    profile.js
    admin.js
  utils/
    print.js
  styles/
    foundation.css
    structural.css
    print-structural.css
scripts/
  validate-architecture.mjs
  validate-security-contract.mjs
  validate-production-contracts.mjs
  test-migration-history-contract.mjs
  test-management-migrations-contract.mjs
  ...demais contratos de concorrência, acesso, impressão e apoio visual
supabase/migrations/
```

## Fluxo de autenticação e aprovação

1. Visitante lê somente o catálogo institucional público permitido por RLS.
2. Profissional cria conta com nome, e-mail, município, UBS, equipe/microárea e senha.
3. Supabase Auth confirma a identidade por e-mail conforme a configuração do projeto.
4. O trigger `handle_new_user()` cria todo perfil profissional comum como `role=acs`, `access_status=pending`, `is_master_account=false`. A conta técnica Master já provisionada é protegida exclusivamente pelo banco e não pelo formulário público.
5. Perfil pendente entra somente na rota de espera/onboarding e pode revisar o vínculo solicitado.
6. Administrador da UBS pode aprovar/suspender apenas perfis `acs` da própria unidade.
7. Gestor Municipal pode administrar perfis não-admin da rede e definir/revogar `unit_admin`.
8. Somente a conta Master/Desenvolvimento pode promover outro perfil a `role=admin` ou administrar outra conta `admin`.
9. Depois de aprovado (`access_status=active`), o vínculo institucional do ACS deixa de ser autoeditável e passa a ser gerido administrativamente.
10. Conta suspensa continua autenticável, mas as rotas internas e dados territoriais permanecem bloqueados.

## Papéis e conta técnica

Os papéis persistidos continuam exatamente três: `acs`, `unit_admin` e `admin`.

### `acs`

- usa ferramentas assistenciais/territoriais não clínicas;
- lê achados territoriais não pessoais somente da própria UBS;
- cria/edita/exclui apenas seus próprios pontos dentro do próprio escopo;
- não altera papel ou status de acesso;
- após aprovação, não troca sozinho município/UBS/equipe/microárea.

### `unit_admin`

- exige `access_status=active`;
- administra perfis profissionais (`acs`) da própria UBS;
- aprova/suspende ACS da própria UBS;
- administra equipes da própria UBS;
- atualiza campos institucionais operacionais permitidos da própria unidade;
- não muda a própria UBS de gestão;
- não administra papel/status de outro administrador;
- não altera identidade/estrutura oficial da UBS;
- não promove Gestor Municipal.

### `admin` — Gestor Municipal

Quando `role=admin`, `access_status=active` e `is_master_account=false`:

- administra municípios, unidades, equipes e perfis não-admin da rede;
- pode definir/revogar `unit_admin`;
- possui visão global dos achados territoriais não pessoais;
- pode alterar identidade/estrutura institucional conforme RLS;
- não administra lateralmente outra conta `admin`;
- não promove outro perfil a `admin`.

### `admin` + `is_master_account=true` — Master / Desenvolvimento

- mantém o mesmo escopo global de rede;
- é a única conta que pode promover outro perfil a Gestor Municipal (`role=admin`) ou administrar outra conta `admin`;
- sua própria flag Master, papel e estado ativo são reforçados por triggers do PostgreSQL;
- a identificação técnica não depende de comparação de e-mail no frontend.

A matriz completa está em `docs/CONTROLE_DE_ACESSO.md`.

## Forma canônica do escopo por papel

A migration `031_enforce_management_scope_shape.sql` define:

- ACS: vínculo territorial profissional completo conforme aprovação;
- `unit_admin`: município/UBS, sem equipe e microárea no perfil administrativo;
- `admin` (Gestor ou Master): escopo global `network`, sem município/UBS/equipe/microárea no próprio perfil.

Essa forma também foi aplicada aos perfis existentes durante a migration, evitando herança de campos de um papel anterior.

## Estado de acesso

`profiles.access_status` aceita somente:

- `pending` — identidade criada, vínculo aguardando validação;
- `active` — acesso profissional liberado;
- `suspended` — acesso interno temporariamente bloqueado.

O próprio usuário não pode se autoaprovar ou alterar livremente esse status. A conta técnica Master é mantida `admin/active` pelo banco.

## Vínculo territorial canônico

Os campos relacionais são a referência primária:

- `municipality_code` → `municipalities.code`;
- `unit_cnes` → `health_units.cnes`;
- `team_id` → `teams.id`.

`unit_name` e `team_name` não podem divergir silenciosamente dos IDs. Triggers do banco recalculam os nomes canônicos quando há vínculo por identificador e sincronizam perfis quando nomes institucionais vinculados são alterados.

Perfil ACS ativo precisa estar associado a uma unidade válida. Equipe pode permanecer sem `team_id` enquanto aguarda confirmação local, preservando o nome informado como pendência.

## Backend

Tabelas públicas:

- `profiles`: perfil profissional, papel, status de acesso e vínculo territorial;
- `municipalities`: municípios habilitados;
- `health_units`: UBS/postos/pontos de atendimento;
- `teams`: equipes por unidade;
- `territory_points`: recursos, parceiros, potencialidades, riscos ambientais/estruturais, barreiras e pontos críticos **não pessoais**.

Todas possuem RLS habilitado.

## Território / Mapa Inteligente

`territory_points` não deve receber paciente, família identificável, diagnóstico ou condição clínica individual.

O domínio de `kind` é fechado para:

- `resource` — recurso;
- `partner` — parceiro;
- `potentiality` — potencialidade;
- `access_barrier` — barreira de acesso;
- `risk` — risco ambiental/estrutural;
- `critical_point` — ponto crítico.

A tabela aceita endereço e coordenadas opcionais. A modelagem, validação, autoria e CRUD pertencem à engenharia estrutural; a visualização cartográfica final pode evoluir sem mudar as fronteiras de privacidade/autorização.

## Rotas

Públicas:

- `#/` — apresentação;
- `#/entrar` — login;
- `#/criar-conta` — autocadastro.

Autenticadas sem aprovação:

- `#/app/aguardando` — status, revisão do vínculo pendente e nova consulta de aprovação;
- `#/recuperar-senha` — definição de nova senha somente com sessão autenticada/recuperação válida.

Protegidas e ativas:

- `#/app/inicio`;
- `#/app/territorio`;
- `#/app/carteirinhas`;
- `#/app/5-minutos`;
- `#/app/indicadores`;
- `#/app/educacao`;
- `#/app/perfil`.

Gestão ativa:

- `#/app/aprovacoes` — conforme capacidade e escopo;
- `#/app/gestao` — `unit_admin` ou `admin`, sempre respeitando RLS e a distinção Gestor × Master.

## Dados temporários

Não são persistidos automaticamente:

- conteúdo digitado nas carteirinhas;
- nomes/referências usados em lembretes de atendimento;
- notas dos 5 Minutos;
- números preenchidos manualmente em indicadores;
- reflexões Sistema × Território.

Ao recarregar/sair, esses dados são descartados, salvo futura decisão explícita e aprovada de produto/privacidade.

## Impressão e PDF

- A4 como formato base;
- 2, 4, 8 ou 12 cartões por folha;
- leitura fácil;
- modo econômico;
- apoio visual padronizado quando habilitado;
- CSS de impressão separado do futuro design visual;
- o comando **Baixar PDF** precisa produzir PDF real; falhas do gerador são informadas ao usuário e não são mascaradas como fallback de impressão;
- **Imprimir** permanece uma ação separada e explícita do navegador.

## Acessibilidade estrutural

- skip links e foco visível;
- navegação SPA move o foco para o título da página;
- tabs ARIA usam roving `tabindex` e teclado (`Arrow*`, `Home`, `End`);
- dialogs usam helper centralizado, foco inicial e retorno ao disparador quando válido;
- busy states compartilham `disabled`, `aria-disabled`, `aria-busy` e restauração de rótulo;
- selects assíncronos expõem estados loading/ready/error e não permitem submissão obrigatória enquanto inválidos.

## Segurança

- RLS habilitado nas tabelas públicas de domínio.
- Funções auxiliares de autorização ficam no schema `private`.
- schema `private` não possui `USAGE` para `anon`.
- papel, flag Master e status são protegidos por trigger/policy, não apenas por campos escondidos.
- vínculo de ACS ativo e vínculo do administrador da UBS são protegidos contra mudança de escopo.
- forma de escopo de Gestor/Master é canonicalizada pelo banco.
- nomes de unidade/equipe são canonicalizados e sincronizados pelo banco.
- administrador local não pode alterar estrutura administrativa da UBS nem editar perfis administrativos como se fossem ACS.
- Gestor Municipal não administra outra conta `admin`.
- `profiles` e `territory_points` não possuem leitura anônima.
- funções públicas de trigger sensíveis não são executáveis por `anon`/`authenticated`.
- CI impede referências frontend a `service_role`.

## Supabase Free — limitação conhecida

O advisor do Supabase aponta `Leaked Password Protection Disabled`. O recurso de consulta a senhas vazadas não está habilitado no plano atual e não bloqueia a homologação Free.

Compensações adotadas:

- senha mínima mais forte na UX;
- confirmação de e-mail;
- mensagens que não favorecem enumeração de conta;
- tratamento de rate limit;
- RLS e menor privilégio;
- aprovação manual de vínculo profissional antes do acesso interno.

Passkeys/WebAuthn não fazem parte do escopo atual.

## Hospedagem e CI

Produção utiliza somente GitHub Pages:

- `.github/workflows/pages.yml` publica somente a `main`;
- a branch `refactor/arquitetura-v2` executa validação, não deploy;
- `vercel.json` não faz parte da arquitetura e o contrato de produção falha se esse arquivo for reintroduzido.

`npm run check` executa, entre outros:

- validação da arquitetura/módulos;
- contrato de segurança;
- contrato dinâmico do histórico de migrations;
- regressões Gestor × Master e forma de escopos 029–032;
- contratos de produção/layout;
- matriz de permissões do frontend;
- concorrência/duplo envio;
- impressão/PDF e apoio visual;
- consistência dos modelos de carteirinha, indicadores e educação;
- ausência de scripts legados e `service_role` no frontend.

O workflow também testa com a publishable key que o catálogo público é acessível e que `profiles` e `territory_points` rejeitam acesso anônimo com status de autorização esperado.

## Migrations e drift

`docs/MIGRATION_HISTORY.md` mapeia a sequência local para o histórico aplicado do Supabase, incluindo os dois hotfixes históricos sem arquivo numerado próprio. `scripts/test-migration-history-contract.mjs` impede lacunas numéricas ou documentação que fique para trás.

Mudança DDL nova deve ser sempre uma nova migration numerada, aplicada ao mesmo projeto Supabase e seguida de Security/Performance Advisor.

## Critério antes do redesign

A V2 só avança para design system quando:

1. migrations Git e Supabase estiverem sincronizadas;
2. Security/Performance Advisors revisados;
3. CI estiver verde no HEAD do PR ativo;
4. fluxos de visitante, ACS pendente/ativo, administrador da UBS, Gestor Municipal e Master técnico estiverem homologados;
5. confirmação/recuperação de e-mail funcionarem no domínio do GitHub Pages;
6. impressão/PDF forem validados em navegador real;
7. não houver dependência do código legado nem de plataforma de deploy paralela;
8. as fronteiras de privacidade e autorização permanecerem comprovadas.

O PR de homologação permanece Draft e não deve ser mesclado na `main` antes desses critérios.
