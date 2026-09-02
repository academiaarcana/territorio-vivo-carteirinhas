# Homologação pós-merge — Território Vivo V2

Data de abertura desta etapa: 24/08/2026.

## Motivo

O PR #1 da V2 foi mesclado antes da conclusão da matriz de homologação humana. Para retomar o trabalho sem alterar diretamente a `main`, esta etapa passa a usar uma branch exclusiva de homologação e um novo PR em Draft.

## Baseline confirmado

- repositório: `academiaarcana/territorio-vivo-carteirinhas`;
- base de referência: `main` no commit `e0f96361c56d571d152d0e9d81cdc8049be2232d`;
- branch de continuação: `homologacao/engenharia-v2-pos-merge`;
- PR de continuação: `#4`, aberto em Draft contra `main`;
- Supabase: `wguurbmtoofkubdawzzr` (`territorio-vivo-carteirinhas`), região `sa-east-1`;
- migrations versionadas e aplicadas até `032_noop_verify_management_scope_shape.sql`;
- Security Advisor: apenas `Leaked Password Protection Disabled`, limitação conhecida do plano Free;
- Performance Advisor: somente informações de índices ainda sem uso observado.

## Regras desta etapa

- não alterar diretamente a `main`;
- manter o PR #4 em Draft até a homologação humana;
- não enfraquecer RLS, triggers, constraints ou políticas de acesso para facilitar testes;
- não criar contas fictícias permanentes;
- toda nova alteração DDL deve receber migration numerada posterior à 032;
- não iniciar redesign visual pesado antes da conclusão da auditoria funcional e de autorização.

## Auditoria estrutural executada nesta etapa

### CONFIRMADO — CI

- workflow `Validar Território Vivo` executado no PR #4;
- run `#793` concluído com `success` para o commit `f07dfe9fae06a1ffbe58b9f7c6e1c1f2e82b6d9a`;
- o workflow executa `npm run check`, valida sintaxe JS, ausência de `service_role` no frontend e testa a fronteira pública/privada do Supabase com a chave publicável;
- catálogo público (`municipalities`, `health_units`, `teams`) respondeu conforme esperado e `profiles`/`territory_points` permaneceram bloqueados anonimamente.

### CONFIRMADO — loading e concorrência administrativa

`src/pages/admin.js` já utiliza lock compartilhado de mutação e serialização de refresh, com `disabled`, `aria-busy`, rótulo temporário e restauração em `finally` para operações administrativas. O contrato `scripts/test-admin-concurrency-contract.mjs` integra o `npm run check` e passou no CI.

### CONFIRMADO — autorização frontend

- matriz central em `src/core/access-control.js` resolve visitante, pending, ACS active, unit_admin active, admin active, suspended e combinações inválidas com negação por padrão;
- router revalida sessão/perfil antes de aplicar guards de capacidade;
- `pending` não recebe `ACCESS_INTERNAL`;
- `suspended` não recebe capacidades internas ou administrativas;
- unit_admin fica limitado à gestão da própria UBS na camada de experiência;
- Gestor Municipal e Master têm escopo de rede, com distinção da conta técnica pelo campo `is_master_account`.

### CONFIRMADO — RLS, triggers e constraints no Supabase real

RLS está habilitado nas cinco tabelas públicas existentes:

- `municipalities`;
- `health_units`;
- `teams`;
- `profiles`;
- `territory_points`.

Também foi confirmado diretamente no PostgreSQL:

- `anon` não possui SELECT de tabela em `profiles` nem `territory_points`;
- `anon` possui apenas leitura do catálogo público necessário ao cadastro;
- todas as funções públicas de trigger de segurança verificadas estão sem privilégio EXECUTE para `anon` e `authenticated`;
- `profiles.role` permanece limitado a `acs`, `unit_admin`, `admin`;
- `profiles.access_status` permanece limitado a `pending`, `active`, `suspended`;
- `territory_points.kind` permanece limitado a `resource`, `partner`, `potentiality`, `access_barrier`, `risk`, `critical_point`;
- `territory_points.status` permanece limitado a `active`, `needs_review`, `resolved`;
- latitude e longitude são exigidas em par e possuem limites geográficos no banco;
- `created_by` é definido pelo banco no INSERT e preservado no UPDATE;
- triggers de perfil protegem papel, status e vínculo territorial;
- trigger da UBS protege identidade/estrutura contra alteração indevida por unit_admin;
- triggers de catálogo sincronizam nomes canônicos de UBS/equipe em perfis vinculados;
- validação de rede impede equipe de outra UBS e UBS de outro município.

### CONFIRMADO — forma dos perfis reais

A consulta de consistência não encontrou perfis com forma de escopo incompatível com o papel (`invalid_shape_count = 0`). No estado consultado existem perfis legítimos ativos para ACS, unit_admin, Gestor Municipal e Master. Não havia perfil `pending` nem `suspended` no momento da consulta.

### CONFIRMADO — conta Master

A conta técnica Master permanece `admin`, `active`, `is_master_account=true` e sem município/UBS/equipe/microárea fixos no próprio perfil, conforme o desenho da migration 031.

### CONFIRMADO — privacidade e dados temporários

- o schema público contém somente as cinco tabelas institucionais/territoriais acima; não existe tabela paralela de pacientes/famílias;
- busca no repositório não encontrou `localStorage`, `sessionStorage` ou `IndexedDB` no runtime;
- `src/core/volatile-drafts.js` mantém rascunhos apenas em memória e `clearSession()` limpa todos os rascunhos voláteis;
- o workflow também rejeita referência a `service_role` no frontend.

### CONFIRMADO — acessibilidade estrutural

- tabs tratam ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Home e End;
- foco de dialogs é movido para controle útil ao abrir e restaurado ao elemento de origem ao fechar;
- fechamento nativo por Escape permanece disponível;
- contratos de arquitetura exigem `aria-labelledby` válido nos dialogs de carteirinhas, território, gestão e educação;
- foco visível e `prefers-reduced-motion` permanecem protegidos por contrato.

### CONFIRMADO — impressão/PDF

O `npm run check` do CI inclui os contratos de acessibilidade de carteirinhas, impressão acessível, captura PDF, grade PDF, apoio visual e volatilidade de rascunhos. A execução #793 passou integralmente. Os formatos A4 2/4/8/12 continuam protegidos pelos contratos atuais.

## Advisors

### Security Advisor

Permanece somente o aviso `Leaked Password Protection Disabled`. O recurso depende de capacidade paga e não será contratado nesta etapa.

### Performance Advisor

Somente INFO de índices ainda sem uso observado. Nenhum índice será removido automaticamente sem evidência de carga/uso real.

## Matriz obrigatória de homologação humana

### AINDA NÃO TESTADO NESTA ETAPA COM INTERAÇÃO HUMANA REAL

- visitante: página pública, login, cadastro e recuperação;
- pending: autenticar, permanecer fora das áreas internas, revisar solicitação, verificar aprovação e sair;
- ACS active: módulos permitidos, vínculo protegido, ausência de gestão e CRUD territorial por autoria/escopo;
- unit_admin: gestão da própria UBS, aprovação/suspensão apenas de ACS da própria UBS, proteção de administradores e identidade oficial da UBS;
- Gestor Municipal: gestão municipal/global conforme regras atuais sem alterar outra conta admin;
- Master / Desenvolvimento: administração superior e proteção da própria conta;
- suspended: bloqueio das áreas internas e impossibilidade de recuperar privilégio pelo frontend.

Não existem atualmente perfis `pending` ou `suspended` no banco consultado. Criar contas fictícias permanentes somente para completar essa matriz continua proibido. Os testes desses estados devem ser feitos com conta legítima/temporária controlada e posterior limpeza, ou durante o fluxo real de cadastro/aprovação, sem enfraquecer RLS.

## Estado desta etapa

A engenharia estrutural verificada nesta auditoria não revelou nova falha crítica que justifique alteração de runtime ou nova migration. O bloqueio restante é a homologação humana da matriz de estados e papéis acima.

O PR #4 deve permanecer Draft enquanto essa homologação não for concluída.
