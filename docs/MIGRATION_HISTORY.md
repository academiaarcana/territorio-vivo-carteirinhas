# Histórico de migrations — Território Vivo

## Objetivo

Registrar a relação entre o histórico executado no projeto Supabase e os arquivos SQL mantidos na branch V2.

O estado de schema está reconciliado. O histórico de execução do Supabase possui duas entradas históricas adicionais em relação à numeração V2 porque duas correções de segurança foram executadas como hotfixes antes da consolidação da arquitetura atual.

## Hotfixes históricos sem arquivo numerado próprio

1. `harden_profile_functions`
   - aplicado logo após `auth_profiles`;
   - fixou `search_path` de funções e revogou execução direta de funções de trigger para `public`, `anon` e `authenticated`;
   - o estado final dessas funções é novamente definido/protegido por migrations posteriores.

2. `restrict_master_role_trigger_search_path`
   - aplicado logo após `enforce_master_role`;
   - restringiu o `search_path` da função responsável por proteger o papel master;
   - a função foi redefinida posteriormente pelas migrations de papéis/escopo, preservando a proteção no estado final.

Esses dois registros permanecem no histórico interno do Supabase e **não devem ser apagados, renomeados ou reaplicados artificialmente** apenas para igualar a quantidade de arquivos.

## Mapeamento principal

| Arquivo V2 | Execução registrada no Supabase |
|---|---|
| `001_auth_profiles.sql` | `auth_profiles` |
| — hotfix histórico | `harden_profile_functions` |
| `002_master_account_and_admin_policies.sql` | `master_account_and_admin_policies` |
| `003_signup_profile_metadata.sql` | `signup_profile_metadata` |
| `004_consolidate_profile_policies.sql` | `consolidate_profile_policies` |
| `005_enforce_master_role.sql` | `enforce_master_role` |
| — hotfix histórico | `restrict_master_role_trigger_search_path` |
| `006_multi_unit_pimenta_bueno.sql` | `multi_unit_pimenta_bueno` |
| `007_index_profiles_by_unit.sql` | `index_profiles_by_unit` |
| `008_municipalities_and_teams.sql` | `municipalities_and_teams` |
| `009_validate_profile_network_membership.sql` | `validate_profile_team_consistency` |
| `010_territory_points.sql` | `territory_points` |
| `011_index_territory_points_created_by.sql` | `index_territory_points_created_by` |
| `012_unit_admin_roles_and_policies.sql` | `unit_admin_roles_and_policies` |
| `013_harden_unit_admin_and_territory_scope.sql` | `harden_unit_admin_and_territory_scope` |
| `014_restrict_territory_point_reads_by_unit.sql` | `restrict_territory_point_reads_by_unit` |
| `015_protect_unit_admin_institutional_scope.sql` | `protect_unit_admin_institutional_scope` |
| `016_profile_access_approval_and_membership.sql` | `profile_access_approval_and_membership` |
| `017_restrict_unit_admin_access_status_management.sql` | `restrict_unit_admin_access_status_management` |
| `018_canonicalize_profile_network_labels.sql` | `canonicalize_profile_network_labels` |
| `019_restrict_unit_admin_profile_updates_to_acs.sql` | `restrict_unit_admin_profile_updates_to_acs` |
| `020_protect_approved_profile_microarea_scope.sql` | `protect_approved_profile_microarea_scope` |
| `021_least_privilege_unit_admin_visibility.sql` | `least_privilege_unit_admin_visibility` |
| `022_enforce_profile_access_on_insert.sql` | `enforce_profile_access_on_insert` |
| `023_database_input_bounds.sql` | `database_input_bounds` |
| `024_least_privilege_table_grants.sql` | `least_privilege_table_grants` |
| `025_canonicalize_health_unit_municipality.sql` | `canonicalize_health_unit_municipality` |
| `026_protect_health_unit_identity.sql` | `protect_health_unit_identity` |
| `027_restrict_territory_point_kinds.sql` | `restrict_territory_point_kinds` |
| `028_sync_profile_network_labels_on_catalog_update.sql` | `sync_profile_network_labels_on_catalog_update` |
| `029_separate_gestor_and_master_account.sql` | `separate_gestor_and_master_account` |
| `030_optimize_gestor_profile_policy.sql` | `optimize_gestor_profile_policy` |
| `031_enforce_management_scope_shape.sql` | `enforce_management_scope_shape` |
| `032_noop_verify_management_scope_shape.sql` | `noop_verify_management_scope_shape` |
| — correção operacional | `remove_legacy_territory_point_policies` |
| — correção operacional | `revoke_anon_profiles_select` |
| — correção operacional | `revoke_set_updated_at_client_execute` |
| `20260826135329_repair_reapplied_auth_objects.sql` | `036_repair_reapplied_auth_objects` |
| `20260826145213_bootstrap_initial_master_account.sql` | `bootstrap_initial_master_account` |

### Nota sobre Gestor × Master

A migration 029 mantém os três papéis de autorização (`acs`, `unit_admin`, `admin`) e passa a distinguir a conta técnica Master/Desenvolvimento por `profiles.is_master_account`. Assim, um perfil `admin/active` comum representa **Gestor Municipal**, enquanto a conta técnica existente permanece `admin/active` com `is_master_account=true`. Somente a conta Master pode promover outro perfil a Gestor Municipal ou administrar outra conta `admin`.

A migration 030 preserva esse mesmo escopo e apenas otimiza a policy `profiles_update_by_scope`, avaliando `auth.uid()` uma única vez por consulta conforme recomendação do Performance Advisor.

### Nota sobre a forma do escopo de gestão

A migration 031 reforça no PostgreSQL a forma canônica do vínculo por papel:

- `admin` não mantém município, UBS, equipe ou microárea no próprio perfil;
- `unit_admin` mantém município/UBS, mas não equipe nem microárea;
- ACS mantém o vínculo territorial profissional completo conforme aprovação.

A migration também limpa vínculos herdados incompatíveis já existentes, sem depender de IDs específicos.

A migration 032 é deliberadamente um **no-op** versionado. Ela espelha no Git uma verificação operacional registrada no histórico remoto durante a homologação da 031, evitando falso diagnóstico de drift sem alterar schema ou dados.

### Nota sobre a reparação operacional 036

Após as três correções operacionais posteriores à 032, as migrations históricas 002, 003, 004 e 005 foram registradas novamente por engano. A reaplicação restaurou versões antigas de `private.is_admin`, `public.handle_new_user`, `public.enforce_profile_role`, do trigger `profiles_enforce_role` e de duas policies permissivas de `profiles`.

A migration `20260826135329_repair_reapplied_auth_objects.sql`, criada pelo Supabase CLI, restaura somente as definições finais já versionadas nas migrations 016 e 029, remove as policies antigas reintroduzidas e não altera dados. As entradas duplicadas permanecem no histórico remoto para preservar a rastreabilidade e não devem ser apagadas ou reaplicadas.

### Nota sobre o bootstrap da conta Master

A migration `20260826145213_bootstrap_initial_master_account.sql` registra a promoção operacional da primeira conta confirmada do projeto definitivo para `admin/active` com `is_master_account=true`. O arquivo não contém e-mail ou UUID, exige que não exista Master anterior, recusa seleção ambígua e remove do perfil o escopo territorial incompatível com a administração global. Em banco vazio ou com Master já configurado, a migration é deliberadamente um no-op.

## Regra para novas alterações

A partir da V2, toda mudança DDL deve seguir o mesmo fluxo:

1. criar um novo arquivo SQL com o Supabase CLI na branch;
2. aplicar a mesma alteração ao projeto Supabase;
3. verificar Security Advisor e Performance Advisor;
4. atualizar testes de contrato quando a alteração afetar segurança ou autorização;
5. não editar migrations históricas já aplicadas para representar uma mudança nova.

O CI também executa `scripts/test-migration-history-contract.mjs`, que exige sequência local contínua para as migrations numeradas e documentação de migrations com timestamp geradas pelo Supabase CLI.

## Critério de drift

Consideramos drift quando o **estado efetivo** do schema, funções, triggers, constraints ou RLS do Supabase difere do que a sequência versionada pretende produzir. Diferença de quantidade no histórico causada pelos dois hotfixes acima, já documentados e substituídos por definições posteriores, não é tratada como drift de schema.
