# Controle de acesso — Território Vivo V2

## Regra central

O nível de uma conta é determinado pela combinação de quatro elementos:

1. **Identidade autenticada** — sessão válida do Supabase Auth.
2. **Estado de acesso** — `profiles.access_status`: `pending`, `active` ou `suspended`.
3. **Papel administrativo** — `profiles.role`: `acs`, `unit_admin` ou `admin`.
4. **Escopo territorial** — município, UBS, equipe e microárea vinculados ao perfil.

O navegador não escolhe nem concede papel. Ele consulta o perfil e usa `src/core/access-control.js` para liberar rotas e ações visíveis. A autorização real permanece no PostgreSQL por RLS, triggers, constraints e funções do schema `private`.

Qualquer combinação não reconhecida é **negada por padrão**.

## Níveis resolvidos

| Nível resolvido | Condição | Escopo efetivo |
|---|---|---|
| Visitante | Sem perfil autenticado | Conteúdo e catálogo públicos |
| ACS pendente | `role=acs` + `access_status=pending` | Apenas o próprio pedido de vínculo |
| ACS ativo | `role=acs` + `access_status=active` | Própria UBS/equipe/microárea |
| Administrador da UBS | `role=unit_admin` + `access_status=active` | Própria UBS |
| Conta Master | `role=admin` + `access_status=active` | Toda a rede cadastrada |
| Suspenso | Qualquer papel + `access_status=suspended` | Nenhum conteúdo territorial interno |
| Negado | Combinação inválida ou desconhecida | Nenhum acesso protegido |

## Matriz funcional

| Capacidade | Visitante | ACS pendente | ACS ativo | Admin. UBS | Master | Suspenso |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Ver apresentação e catálogo público | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Criar conta profissional | ✓ | — | — | — | — | — |
| Ler o próprio perfil | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Corrigir vínculo solicitado | — | ✓ | — | — | — | — |
| Abrir módulos internos | — | — | ✓ | ✓ | ✓ | — |
| Usar carteirinhas, 5 Minutos, indicadores e educação | — | — | ✓ | ✓ | ✓ | — |
| Ler território não pessoal | — | — | Própria UBS | Própria UBS | Toda a rede | — |
| Criar/editar/excluir ponto territorial | — | — | Apenas ponto próprio no escopo | Pontos da própria UBS | Todos os escopos | — |
| Aprovar ou suspender ACS | — | — | — | Própria UBS | Toda a rede | — |
| Administrar equipes | — | — | — | Própria UBS | Toda a rede | — |
| Atualizar dados operacionais da UBS | — | — | — | Própria UBS | Toda a rede | — |
| Alterar identidade oficial da UBS | — | — | — | — | ✓ | — |
| Promover/revogar `unit_admin` | — | — | — | — | ✓ | — |
| Administrar municípios e unidades | — | — | — | — | ✓ | — |
| Criar ou promover outro master pela interface | — | — | — | — | — | — |

## O que determina cada liberação

### Estado

- `pending`: permite somente espera, leitura do próprio perfil e correção do vínculo solicitado.
- `active`: habilita as capacidades correspondentes ao papel.
- `suspended`: remove capacidades internas mesmo que o papel continue cadastrado.

### Papel

- `acs`: trabalho profissional e territorial no próprio escopo.
- `unit_admin`: gestão local de ACS, equipes, operação e território da própria UBS.
- `admin`: Conta Master, com administração superior da rede completa.

### Escopo

- ACS: `municipality_code`, `unit_cnes`, `team_id` e `microarea` aprovados.
- Administrador da UBS: `unit_cnes` da unidade administrada.
- Master: escopo `network`; vínculos históricos no perfil podem preencher materiais, mas não limitam a conta.

## Fonte de verdade no PostgreSQL

- `private.is_active_member()` exige perfil ativo para acesso territorial.
- `private.is_admin()` reconhece somente `role=admin` ativo.
- `private.is_unit_admin()` reconhece somente `role=unit_admin` ativo.
- `private.is_unit_admin_for(unit_cnes)` restringe a administração local à própria UBS.
- Policies RLS filtram perfis, municípios, UBS, equipes e pontos territoriais.
- `enforce_profile_role()` impede que cadastro comum escolha papel administrativo ou nasça ativo.
- `enforce_profile_scope_security()` impede autoaprovação e protege o vínculo aprovado.
- Triggers de identidade da UBS reservam campos estruturais ao master.

O frontend pode esconder uma ação por usabilidade, mas nunca substitui essas regras.

## Regras imutáveis

- Todo autocadastro comum nasce `role=acs` e `access_status=pending`.
- O formulário público não conhece nem compara o e-mail master.
- O usuário não altera o próprio papel ou status.
- ACS ativo não troca sozinho o vínculo institucional aprovado.
- Administrador local não administra outro administrador nem o master.
- Somente o master ativo pode promover ou revogar `unit_admin`.
- Nenhum fluxo comum cria outro master.
- Dados pessoais ou clínicos identificáveis não entram em `territory_points`.

## Correspondência no código

- Matriz de capacidades: `src/core/access-control.js`.
- Regras de objetos e ações: `src/core/permissions.js`.
- Proteção de rotas: `src/core/router.js` e `src/main.js`.
- Autoridade por linha: migrations e policies do Supabase.
- Testes: `scripts/test-access-control-contract.mjs`, `scripts/test-permissions.mjs` e validadores de segurança.
