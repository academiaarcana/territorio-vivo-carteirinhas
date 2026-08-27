# Controle de acesso — Território Vivo V2

## Regra central

O nível de uma conta é determinado pela combinação de cinco elementos:

1. **Identidade autenticada** — sessão válida do Supabase Auth.
2. **Estado de acesso** — `profiles.access_status`: `pending`, `active` ou `suspended`.
3. **Papel profissional/administrativo** — `profiles.role`: `acs`, `physician`, `nurse`, `unit_admin` ou `admin`.
4. **Conta técnica superior** — `profiles.is_master_account`, usada somente para distinguir o Master/Desenvolvimento de um Gestor Municipal comum.
5. **Escopo territorial** — município, UBS, equipe e microárea conforme o papel.

O navegador não escolhe nem concede papel. Ele consulta o perfil e usa `src/core/access-control.js` para liberar rotas e ações visíveis. A autorização real permanece no PostgreSQL por RLS, triggers, constraints e funções do schema `private`.

Qualquer combinação não reconhecida é **negada por padrão**.

## Níveis resolvidos

| Nível funcional | Condição | Escopo efetivo |
|---|---|---|
| Visitante | Sem perfil autenticado | Conteúdo e catálogo públicos |
| ACS pendente | `role=acs` + `access_status=pending` | Apenas o próprio pedido de vínculo |
| ACS ativo | `role=acs` + `access_status=active` | Própria UBS/equipe/microárea |
| Médico ativo | `role=physician` + `access_status=active` | Própria UBS/equipe |
| Enfermeiro ativo | `role=nurse` + `access_status=active` | Própria UBS/equipe |
| Administrador da UBS | `role=unit_admin` + `access_status=active` | Própria UBS |
| Gestor Municipal | `role=admin` + `access_status=active` + `is_master_account=false` | Toda a rede cadastrada |
| Master / Desenvolvimento | `role=admin` + `access_status=active` + `is_master_account=true` | Toda a rede + administração de contas `admin` |
| Suspenso | Qualquer papel não protegido + `access_status=suspended` | Nenhum conteúdo territorial interno |
| Negado | Combinação inválida ou desconhecida | Nenhum acesso protegido |

> `src/core/access-control.js` mantém internamente o nome histórico `MASTER_ACTIVE` para o nível `role=admin/active`. A distinção Gestor × Master técnico é feita por `is_master_account` em `src/core/permissions.js` e, principalmente, no PostgreSQL.

## Matriz funcional

| Capacidade | Visitante | Pendente | ACS ativo | Médico/Enfermeiro | Admin. UBS | Gestor | Master | Suspenso |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Ver apresentação e catálogo público | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Criar conta profissional | ✓ | — | — | — | — | — | — | — |
| Ler o próprio perfil | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Corrigir vínculo solicitado | — | ✓ | — | — | — | — | — | — |
| Abrir módulos internos | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Usar ferramentas temporárias | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Abrir Cuidado Para Todos | — | — | — | ✓ | — | — | — | — |
| Ler território não pessoal | — | — | Própria UBS | Própria UBS | Própria UBS | Toda a rede | Toda a rede | — |
| Criar/editar/excluir ponto territorial | — | — | Ponto próprio | Ponto próprio | Pontos da UBS | Todos | Todos | — |
| Aprovar/suspender profissionais | — | — | — | — | Própria UBS | Toda a rede | Toda a rede | — |
| Administrar equipes | — | — | — | — | Própria UBS | Toda a rede | Toda a rede | — |
| Atualizar dados operacionais da UBS | — | — | — | — | Própria UBS | Toda a rede | Toda a rede | — |
| Alterar identidade/estrutura oficial da UBS | — | — | — | — | — | ✓ | ✓ | — |
| Administrar municípios e unidades | — | — | — | — | — | ✓ | ✓ | — |
| Promover/revogar `unit_admin` | — | — | — | — | — | ✓ | ✓ | — |
| Alterar status de perfil não-admin | — | — | — | — | Própria UBS | ✓ | ✓ | — |
| Promover perfil para Gestor Municipal (`role=admin`) | — | — | — | — | — | — | ✓ | — |
| Alterar outra conta `admin` | — | — | — | — | — | — | ✓ | — |
| Alterar a conta Master | — | — | — | — | — | — | Protegida | — |

## O que determina cada liberação

### Estado

- `pending`: permite somente espera, leitura do próprio perfil e correção do vínculo solicitado.
- `active`: habilita as capacidades correspondentes ao papel.
- `suspended`: remove capacidades internas de contas comuns/administrativas conforme as proteções do banco.
- A conta marcada `is_master_account=true` é reforçada pelo PostgreSQL como `admin/active`.

### Papel e flag Master

- `acs`: trabalho profissional e territorial no próprio escopo.
- `physician`: trabalho profissional na própria UBS/equipe e acesso externo a prescrições, sem gestão.
- `nurse`: trabalho profissional na própria UBS/equipe e acesso externo a prescrições, sem gestão.
- `unit_admin`: gestão local de ACS, equipes, operação e território da própria UBS.
- `admin` + `is_master_account=false`: **Gestor Municipal**, com gestão da rede e sem poder administrativo lateral sobre outro `admin`.
- `admin` + `is_master_account=true`: **Master / Desenvolvimento**, única conta com poder para promover outro perfil a `admin` e administrar outra conta `admin`.

### Escopo

A migration `031_enforce_management_scope_shape.sql` canonicaliza a forma do perfil por papel:

- ACS ativo: `municipality_code`, `unit_cnes`, `team_id` e `microarea` conforme o vínculo aprovado;
- Médico/Enfermeiro ativo: município, UBS e equipe conforme o vínculo aprovado; microárea vazia;
- Administrador da UBS: mantém município/UBS; `team_id`, `team_name` e `microarea` ficam vazios;
- Gestor Municipal e Master técnico: operam em escopo `network`; município, UBS, equipe e microárea do próprio perfil ficam vazios.

## Fonte de verdade no PostgreSQL

- `private.is_active_member()` exige perfil ativo para acesso territorial.
- `private.is_admin()` reconhece `role=admin` ativo — Gestor Municipal ou Master técnico.
- `private.is_master_account()` reconhece somente `role=admin`, ativo e `is_master_account=true`.
- `private.is_unit_admin()` reconhece somente `role=unit_admin` ativo.
- `private.is_unit_admin_for(unit_cnes)` restringe a administração local à própria UBS.
- Policies RLS filtram perfis, municípios, UBS, equipes e pontos territoriais.
- `enforce_profile_role()` força autocadastro comum a `acs/pending`, preserva a flag Master e restringe promoção para `admin` ao Master técnico.
- `enforce_profile_scope_security()` impede autoaprovação, protege o vínculo aprovado e bloqueia um Gestor Municipal de administrar lateralmente outro `admin`.
- `validate_profile_network_membership()` canonicaliza a forma territorial conforme o papel.
- Triggers de identidade da UBS impedem `unit_admin` de alterar campos estruturais; `admin` atua conforme RLS.

O frontend pode esconder uma ação por usabilidade, mas nunca substitui essas regras.

## Regras imutáveis

- Todo autocadastro comum nasce `role=acs`, `access_status=pending` e `is_master_account=false`.
- O formulário público não conhece nem compara o e-mail da conta Master.
- Nenhum cliente comum pode marcar a si próprio como Master.
- O usuário comum não altera o próprio papel ou status.
- ACS ativo não troca sozinho o vínculo institucional aprovado.
- Administrador local administra somente ACS, médicos e enfermeiros da própria UBS; não administra outro administrador nem contas `admin`.
- O acesso a prescrições não cria SSO, não transfere credenciais e não persiste receita ou dado clínico no Território Vivo.
- Gestor Municipal pode administrar a rede e perfis não-admin, mas não outro Gestor nem a conta Master.
- Somente o Master técnico pode promover um perfil para `role=admin` ou administrar outra conta `admin`.
- A conta Master técnica permanece protegida como `admin/active` pelo banco.
- Dados pessoais ou clínicos identificáveis não entram em `territory_points`.

## Correspondência no código e banco

- Matriz de capacidades: `src/core/access-control.js`.
- Distinção Gestor × Master e regras de objetos/ações: `src/core/permissions.js`.
- Proteção de rotas: `src/core/router.js` e `src/main.js`.
- Autoridade por linha e promoção: migrations/policies/triggers do Supabase.
- Separação Gestor × Master: `029_separate_gestor_and_master_account.sql`.
- Otimização da policy: `030_optimize_gestor_profile_policy.sql`.
- Forma canônica dos escopos de gestão: `031_enforce_management_scope_shape.sql`.
- Testes: `scripts/test-access-control-contract.mjs`, `scripts/test-permissions.mjs`, `scripts/test-management-migrations-contract.mjs` e validadores de segurança.
