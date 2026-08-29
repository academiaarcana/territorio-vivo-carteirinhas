# Histórico de migrations — Território Vivo

## Objetivo

Registrar a relação entre o histórico executado no projeto Supabase e os arquivos SQL mantidos na branch V2.

O projeto Supabase original foi excluído acidentalmente em 29/08/2026. O backend foi reconstruído no projeto `vcgqzdaamwvcwxcuxsmo`, usando a sequência versionada desta branch como fonte de verdade. O estado efetivo do schema deve ser validado pelos Advisors e por consultas de contrato; diferenças históricas do projeto excluído são preservadas nesta documentação apenas para rastreabilidade.

## Hotfixes históricos do projeto original

1. `harden_profile_functions`
   - havia sido aplicado logo após `auth_profiles` no projeto original;
   - fixava `search_path` de funções e revogava execução direta de funções de trigger para `public`, `anon` e `authenticated`;
   - o estado final dessas funções é novamente definido/protegido por migrations posteriores.

2. `restrict_master_role_trigger_search_path`
   - havia sido aplicado logo após `enforce_master_role` no projeto original;
   - restringia o `search_path` da função responsável por proteger o papel master;
   - a função foi redefinida posteriormente pelas migrations de papéis/escopo, preservando a proteção no estado final.

Esses hotfixes pertencem ao histórico do projeto excluído e **não foram reaplicados artificialmente** no projeto reconstruído apenas para reproduzir a quantidade antiga de entradas. A segurança equivalente ou superior é garantida pelo estado final versionado e pelos Advisors.

## Mapeamento principal

| Arquivo V2 | Execução registrada no Supabase |
|---|---|
| `001_auth_profiles.sql` | `auth_profiles` |
| — hotfix histórico original | `harden_profile_functions` |
| `002_master_account_and_admin_policies.sql` | `master_account_and_admin_policies` |
| `003_signup_profile_metadata.sql` | `signup_profile_metadata` |
| `004_consolidate_profile_policies.sql` | `consolidate_profile_policies` |
| `005_enforce_master_role.sql` | `enforce_master_role` |
| — hotfix histórico original | `restrict_master_role_trigger_search_path` |
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
| — correção operacional do projeto original | `remove_legacy_territory_point_policies` |
| — correção operacional do projeto original | `revoke_anon_profiles_select` |
| — correção operacional do projeto original | `revoke_set_updated_at_client_execute` |
| `20260826135329_repair_reapplied_auth_objects.sql` | `036_repair_reapplied_auth_objects` |
| `20260826145213_bootstrap_initial_master_account.sql` | `bootstrap_initial_master_account` |
| `20260826234754_add_clinical_professional_roles.sql` | `add_clinical_professional_roles` |
| `20260829172457_harden_restored_project_security.sql` | `harden_restored_project_security` |

### Nota sobre Gestor × Master

A migration 029 mantém os três papéis administrativos/territoriais centrais (`acs`, `unit_admin`, `admin`) e passa a distinguir a conta técnica Master/Desenvolvimento por `profiles.is_master_account`. Assim, um perfil `admin/active` comum representa **Gestor Municipal**, enquanto a conta técnica Master permanece `admin/active` com `is_master_account=true`. Somente a conta Master pode promover outro perfil a Gestor Municipal ou administrar outra conta `admin`.

A migration 030 preserva esse mesmo escopo e apenas otimiza a policy `profiles_update_by_scope`, avaliando `auth.uid()` uma única vez por consulta conforme recomendação do Performance Advisor.

### Nota sobre a forma do escopo de gestão

A migration 031 reforça no PostgreSQL a forma canônica do vínculo por papel:

- `admin` não mantém município, UBS, equipe ou microárea no próprio perfil;
- `unit_admin` mantém município/UBS, mas não equipe nem microárea;
- profissionais territoriais mantêm o vínculo institucional correspondente ao papel e à aprovação.

A migration também limpa vínculos herdados incompatíveis já existentes, sem depender de IDs específicos.

A migration 032 é deliberadamente um **no-op** versionado. Ela espelha uma verificação operacional registrada durante a homologação da 031, evitando falso diagnóstico de drift sem alterar schema ou dados.

### Nota sobre a reparação operacional 036

No projeto original, após correções operacionais posteriores à 032, migrations históricas 002, 003, 004 e 005 foram registradas novamente por engano. A reaplicação restaurou versões antigas de `private.is_admin`, `public.handle_new_user`, `public.enforce_profile_role`, do trigger `profiles_enforce_role` e de duas policies permissivas de `profiles`.

A migration `20260826135329_repair_reapplied_auth_objects.sql` restaura somente as definições finais já versionadas nas migrations 016 e 029, remove as policies antigas reintroduzidas e não altera dados. Ela foi reaplicada também no projeto reconstruído para garantir o estado final endurecido.

### Nota sobre o bootstrap da conta Master

A migration `20260826145213_bootstrap_initial_master_account.sql` registra a promoção operacional da primeira conta confirmada para `admin/active` com `is_master_account=true`. O arquivo não contém e-mail ou UUID, exige que não exista Master anterior, recusa seleção ambígua e remove do perfil o escopo territorial incompatível com a administração global. Em banco vazio ou com Master já configurado, a migration é deliberadamente um no-op.

Durante a reconstrução em PostgreSQL 17, a seleção técnica do UUID foi ajustada de `min(uuid)` para `min(id::text)::uuid`, porque a agregação direta `min(uuid)` não existe nesse ambiente. A regra de negócio do bootstrap não foi alterada.

### Nota sobre Médico e Enfermeiro

A migration `20260826234754_add_clinical_professional_roles.sql` acrescenta `physician` e `nurse` ao domínio fechado de papéis. Ambos permanecem perfis profissionais de menor privilégio, vinculados a UBS/equipe, sem poderes administrativos. A gestão da própria UBS pode visualizar, aprovar, suspender e manter esses perfis dentro do escopo local. O acesso a prescrições é uma capacidade do frontend e abre um serviço externo; o banco do Território Vivo não recebe receitas nem dados clínicos.

A migration foi aplicada com sucesso no projeto reconstruído em 29/08/2026.

### Nota sobre o endurecimento do projeto reconstruído

A migration `20260829172457_harden_restored_project_security.sql` foi criada após a auditoria do restore. Ela remove `territory_points_authenticated_select` e `territory_points_insert_own`, policies históricas permissivas que seriam combinadas por `OR` com as policies finais de escopo. Também revoga a execução direta de `public.rls_auto_enable()` para `PUBLIC`, `anon` e `authenticated`, preservando o event trigger interno `ensure_rls` que ativa RLS automaticamente em novas tabelas `public`.

Após a aplicação, `territory_points` mantém uma única policy por ação para o papel `authenticated`, e a função de auto-RLS deixa de ser exposta como RPC de cliente.

## Regra para novas alterações

A partir da V2, toda mudança DDL deve seguir o mesmo fluxo:

1. criar um novo arquivo SQL versionado na branch;
2. aplicar a mesma alteração ao projeto Supabase;
3. verificar Security Advisor e Performance Advisor;
4. atualizar testes de contrato quando a alteração afetar segurança ou autorização;
5. não alterar migrations históricas já aplicadas, salvo correção estritamente necessária para restaurabilidade documentada e sem mudança de regra de negócio.

O CI também executa `scripts/test-migration-history-contract.mjs`, que exige sequência local contínua para as migrations numeradas e documentação de migrations com timestamp.

## Critério de drift

Consideramos drift quando o **estado efetivo** do schema, funções, triggers, constraints ou RLS do Supabase difere do que a sequência versionada pretende produzir. Diferenças de histórico exclusivas do projeto original excluído não são reproduzidas artificialmente; o critério de homologação do projeto reconstruído é o estado efetivo seguro, versionado e validado.
