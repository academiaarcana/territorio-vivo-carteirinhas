# Histórico de migrations — Território Vivo

## Objetivo

Este arquivo reconcilia as migrations versionadas da arquitetura V2 com o projeto Supabase atual.

O projeto Supabase original foi excluído acidentalmente em 29/08/2026. O backend foi reconstruído no projeto `vcgqzdaamwvcwxcuxsmo`, usando esta branch como fonte de verdade. O critério de homologação é o estado efetivo do schema, RLS, funções, triggers e privilégios, validado por testes de contrato e pelos Advisors.

## Histórico do projeto original

Dois hotfixes existiram no projeto excluído sem arquivo numerado próprio:

1. `harden_profile_functions` — restringia `search_path` e execução direta de funções de trigger.
2. `restrict_master_role_trigger_search_path` — restringia o `search_path` da proteção do papel Master.

Também existiram três correções operacionais posteriores à migration 032:

- `remove_legacy_territory_point_policies`;
- `revoke_anon_profiles_select`;
- `revoke_set_updated_at_client_execute`.

Esses registros são preservados para rastreabilidade histórica, mas não são reaplicados artificialmente apenas para reproduzir a contagem do projeto excluído. O projeto reconstruído recebe o estado final equivalente ou mais restritivo por migrations versionadas.

## Mapeamento principal

| Arquivo V2 | Execução registrada no projeto reconstruído |
|---|---|
| `001_auth_profiles.sql` | `auth_profiles` |
| `002_master_account_and_admin_policies.sql` | `master_account_and_admin_policies` |
| `003_signup_profile_metadata.sql` | `signup_profile_metadata` |
| `004_consolidate_profile_policies.sql` | `consolidate_profile_policies` |
| `005_enforce_master_role.sql` | `enforce_master_role` |
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
| `20260826135329_repair_reapplied_auth_objects.sql` | `036_repair_reapplied_auth_objects` |
| `20260826145213_bootstrap_initial_master_account.sql` | `bootstrap_initial_master_account` |
| `20260826234754_add_clinical_professional_roles.sql` | `add_clinical_professional_roles` |
| `20260829172457_harden_restored_project_security.sql` | `harden_restored_project_security` |
| `20260829175027_prepare_safe_initial_master_promotion.sql` | `prepare_safe_initial_master_promotion` |

## Gestor Municipal, Master e profissionais

A migration 029 separa autorização administrativa de identidade técnica. Um perfil `admin/active` com `is_master_account=false` representa Gestor Municipal; a conta técnica Master é `admin/active` com `is_master_account=true`. Somente a Master pode promover outro perfil a Gestor Municipal ou administrar outra conta `admin`.

A migration `20260826234754_add_clinical_professional_roles.sql` acrescenta `physician` e `nurse` ao domínio fechado de papéis. ACS, médico e enfermeiro continuam perfis profissionais de menor privilégio, vinculados à UBS/equipe conforme o escopo aprovado, sem poderes administrativos.

A migration 031 reforça a forma canônica do escopo: `admin` não mantém município/UBS/equipe/microárea no próprio perfil; `unit_admin` mantém município/UBS, mas não equipe/microárea; perfis profissionais mantêm o vínculo institucional permitido para o papel.

## Reparação operacional 036

No projeto original, migrations históricas 002–005 chegaram a ser registradas novamente por engano, restaurando temporariamente definições antigas. `20260826135329_repair_reapplied_auth_objects.sql` restaura somente as definições finais já versionadas e remove policies permissivas reintroduzidas. Ela também foi aplicada no projeto reconstruído para garantir o estado final endurecido.

## Bootstrap e recuperação da Master

`20260826145213_bootstrap_initial_master_account.sql` registra a promoção operacional da primeira conta confirmada para `admin/active` com `is_master_account=true`. Não contém e-mail nem UUID, exige ausência de Master anterior, recusa seleção ambígua e remove o escopo territorial incompatível com administração global. Em banco vazio, é deliberadamente um no-op.

Durante o restore em PostgreSQL 17, a seleção técnica do UUID foi ajustada de `min(uuid)` para `min(id::text)::uuid`, porque a agregação direta `min(uuid)` não existe nesse ambiente. A regra de negócio não mudou.

Como o bootstrap foi aplicado quando o Auth ainda estava vazio, `20260829175027_prepare_safe_initial_master_promotion.sql` prepara a operação administrativa posterior `private.promote_initial_master()`. Ela:

- não cria usuários e não contém e-mail/UUID;
- é serializada com advisory lock;
- retorna a Master existente se já houver exatamente uma;
- aborta se houver mais de uma Master;
- exige exatamente uma conta confirmada quando ainda não existe Master;
- promove somente esse perfil para `admin/active` + `is_master_account=true` e limpa o escopo territorial;
- restaura os triggers de proteção mesmo em caso de erro;
- não pode ser executada por `PUBLIC`, `anon`, `authenticated` ou `service_role`.

A execução dessa função fica reservada ao canal administrativo do banco durante a recuperação da primeira conta real.

## Endurecimento do projeto reconstruído

`20260829172457_harden_restored_project_security.sql` remove as policies legadas `territory_points_authenticated_select` e `territory_points_insert_own`, que poderiam se combinar por `OR` com as policies finais de escopo. Também revoga execução direta de `public.rls_auto_enable()` para `PUBLIC`, `anon` e `authenticated`, preservando o event trigger interno `ensure_rls` que ativa RLS automaticamente em novas tabelas `public`.

Após a aplicação, `territory_points` mantém uma única policy por ação para `authenticated`, e a função de auto-RLS não fica exposta como RPC de cliente.

## Regra para novas alterações

Toda nova mudança DDL deve:

1. ganhar migration versionada na branch;
2. ser aplicada ao projeto Supabase;
3. passar pelo Security Advisor e Performance Advisor;
4. atualizar testes de contrato quando afetar segurança ou autorização;
5. preservar migrations históricas, salvo correção de restaurabilidade documentada e sem alteração de regra de negócio.

O CI executa `scripts/test-migration-history-contract.mjs`, que exige sequência contínua das migrations numeradas e documentação de todas as migrations com timestamp.

## Critério de drift

Existe drift quando o estado efetivo do schema, funções, triggers, constraints, privilégios ou RLS diverge do que a sequência versionada pretende produzir. Diferenças exclusivas do histórico do projeto original excluído não são recriadas artificialmente.
