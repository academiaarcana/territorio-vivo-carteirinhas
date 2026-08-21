# Território Vivo — Arquitetura V2

## Objetivo

Transformar o protótipo acumulativo em uma aplicação web modular, auditável, multi-UBS e segura, mantendo hospedagem estática no GitHub Pages e Supabase como backend.

A V2 deve ser funcionalmente completa antes da etapa de design visual definitivo.

## Princípios

1. **Sem prontuário paralelo**: dados de pacientes/famílias usados em carteirinhas, indicadores e notas de reunião permanecem temporários no navegador por padrão.
2. **Separação de responsabilidades**: interface, autenticação, autorização, acesso a dados, impressão e conteúdo ficam em módulos distintos.
3. **Multiunidade e multimunicípio**: Município → Unidade de saúde → Equipe → Microárea → Profissional.
4. **Permissão no banco**: a interface nunca é a única barreira. RLS, constraints, funções e triggers são a fonte de verdade.
5. **Autocadastro com aprovação**: qualquer profissional pode solicitar conta, mas o conteúdo interno só é liberado depois da validação do vínculo pela gestão.
6. **Menor privilégio**: ACS atua no próprio contexto; administrador de UBS somente na própria unidade; master possui visão global.
7. **Impressão como recurso de primeira classe**: A4, preto e branco, 2/4/8/12 por folha, economia de toner e leitura fácil.
8. **Conteúdo técnico versionável**: educação em saúde registra fonte, data de revisão e aviso de segurança.
9. **Sem segredo no navegador**: frontend usa somente URL e publishable key; nenhuma secret/service role é aceita.

## Estrutura

```text
index.html
config.js
src/
  main.js
  core/
    store.js
    router.js
    layout.js
    session.js
    permissions.js
    a11y.js
  lib/
    dom.js
    forms.js
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
  test-layout-contract.mjs
  test-permissions.mjs
supabase/migrations/
```

## Fluxo de autenticação e aprovação

1. Visitante lê somente o catálogo institucional público permitido por RLS.
2. Profissional cria conta com nome, e-mail, município, UBS, equipe/microárea e senha.
3. Supabase Auth confirma a identidade por e-mail conforme a configuração do projeto.
4. O trigger `handle_new_user()` cria o perfil:
   - master conhecido → `role=admin`, `access_status=active`;
   - demais contas → `role=acs`, `access_status=pending`.
5. Perfil pendente entra somente na rota de espera/onboarding e pode revisar o vínculo solicitado.
6. Administrador da UBS pode aprovar/suspender apenas perfis `acs` da própria unidade.
7. Master pode administrar o ciclo de acesso dos perfis não-master e definir/revogar `unit_admin`.
8. Depois de aprovado (`access_status=active`), o vínculo institucional do ACS deixa de ser autoeditável e passa a ser gerido administrativamente.
9. Conta suspensa continua autenticável, mas as rotas internas e dados territoriais permanecem bloqueados.

## Papéis

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
- não cria master.

### `admin`

- master municipal/global;
- exige `access_status=active`;
- administra municípios, unidades, equipes, perfis e papéis permitidos;
- possui visão global dos achados territoriais não pessoais;
- o e-mail master é reforçado pelo banco e não depende de valor enviado pelo frontend.

## Estado de acesso

`profiles.access_status` aceita somente:

- `pending` — identidade criada, vínculo aguardando validação;
- `active` — acesso profissional liberado;
- `suspended` — acesso interno temporariamente bloqueado.

O próprio usuário não pode alterar esse status.

## Vínculo territorial canônico

Os campos relacionais são a referência primária:

- `municipality_code` → `municipalities.code`;
- `unit_cnes` → `health_units.cnes`;
- `team_id` → `teams.id`.

`unit_name` e `team_name` não podem divergir silenciosamente dos IDs. Triggers do banco recalculam os nomes canônicos quando há vínculo por identificador.

Perfil profissional ativo precisa estar associado a uma unidade válida. Equipe pode permanecer sem `team_id` enquanto aguarda confirmação local, preservando o nome informado como pendência.

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

Tipos suportados:

- recurso;
- potencialidade;
- parceiro;
- risco ambiental/estrutural;
- ponto crítico;
- barreira de acesso.

A tabela aceita endereço e coordenadas opcionais para futura camada cartográfica. A visualização em mapa pertence à fase de design; a modelagem e o CRUD pertencem à fase estrutural.

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

- `#/app/aprovacoes` — `unit_admin` ou `admin`;
- `#/app/gestao` — `unit_admin` ou `admin`, sempre respeitando RLS.

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
- modo leitura fácil;
- modo econômico;
- CSS de impressão separado do futuro design visual;
- PDF usa `html2pdf` quando disponível e impressão do navegador como fallback.

## Segurança

- RLS habilitado nas tabelas públicas de domínio.
- Funções auxiliares de autorização ficam no schema `private`.
- schema `private` não possui `USAGE` para `anon`.
- papel e status são protegidos por trigger/policy, não apenas por campos escondidos.
- vínculo de ACS ativo e vínculo do administrador são protegidos contra mudança de escopo.
- nomes de unidade/equipe são canonicalizados pelo banco.
- administrador local não pode alterar estrutura administrativa da UBS nem editar perfis administrativos como se fossem ACS.
- `profiles` e `territory_points` não possuem leitura anônima.
- CI impede referências frontend a `service_role`.

## Supabase Free — limitação conhecida

O advisor do Supabase aponta `Leaked Password Protection Disabled`. O recurso de consulta a senhas vazadas é disponibilizado pelo Supabase em planos pagos e não é requisito para a implantação Free atual.

Compensações adotadas:

- senha mínima mais forte na UX;
- confirmação de e-mail;
- mensagens que não favorecem enumeração de conta;
- tratamento de rate limit;
- RLS e menor privilégio;
- aprovação manual de vínculo profissional antes do acesso interno.

Passkeys/WebAuthn não fazem parte do escopo atual.

## CI

`npm run check` executa:

- validação da arquitetura/módulos;
- validação do contrato de segurança;
- validação dos contratos de produção/layout;
- matriz de permissões do frontend;
- consistência dos modelos de carteirinha, indicadores e educação;
- presença das migrations críticas;
- ausência de scripts legados;
- ausência de service role no frontend;
- requisitos estruturais de acessibilidade e impressão.

O workflow também testa com a publishable key que o catálogo público é acessível e que `profiles` e `territory_points` rejeitam acesso anônimo com status de autorização esperado.

## Critério antes do redesign

A V2 só avança para design system quando:

1. migrations Git e Supabase estiverem sincronizadas;
2. Security/Performance Advisors revisados;
3. CI estiver verde no HEAD do PR;
4. fluxos de visitante, ACS, administrador da UBS e master estiverem homologados;
5. confirmação/recuperação de e-mail funcionarem no domínio do GitHub Pages;
6. impressão/PDF forem validados em navegador real;
7. não houver dependência do código legado.

O PR permanece Draft e não deve ser mesclado na `main` antes desses critérios.
