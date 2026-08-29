# Histórico de migrations — Território Vivo

## Estado atual

O projeto Supabase original foi excluído acidentalmente em 29/08/2026. O backend foi reconstruído no projeto `vcgqzdaamwvcwxcuxsmo` a partir das migrations versionadas, mantendo RLS, papéis, catálogos institucionais e regras de autorização.

O critério atual de consistência é o **estado efetivo do schema + migrations versionadas + Advisors**, e não a reprodução artificial de entradas históricas que pertenciam somente ao projeto excluído.

## Hotfixes históricos do projeto original

Dois hotfixes existiram no projeto anterior e permanecem documentados para rastreabilidade:

- `harden_profile_functions` — fixava `search_path` e restringia execução direta de funções de trigger;
- `restrict_master_role_trigger_search_path` — restringia o `search_path` da proteção da conta Master.

Esses registros não foram reaplicados artificialmente no projeto restaurado porque definições posteriores já preservam as mesmas proteções ou proteções superiores.

## Migrations numeradas da arquitetura V2

| Arquivo | Finalidade |
|---|---|
| `001_auth_profiles.sql` | Perfis vinculados ao Supabase Auth e RLS inicial. |
| `002_master_account_and_admin_policies.sql` | Administração superior e policies iniciais. |
| `003_signup_profile_metadata.sql` | Metadados seguros do cadastro inicial. |
| `004_consolidate_profile_policies.sql` | Consolidação das policies de perfis. |
| `005_enforce_master_role.sql` | Proteção do papel administrativo. |
| `006_multi_unit_pimenta_bueno.sql` | Catálogo multi-UBS de Pimenta Bueno. |
| `007_index_profiles_by_unit.sql` | Índice de perfis por unidade. |
| `008_municipalities_and_teams.sql` | Municípios e equipes. |
| `009_validate_profile_network_membership.sql` | Validação de vínculo com a rede. |
| `010_territory_points.sql` | Pontos territoriais não pessoais. |
| `011_index_territory_points_created_by.sql` | Índice de autoria dos pontos. |
| `012_unit_admin_roles_and_policies.sql` | Papel Administrador da UBS e policies. |
| `013_harden_unit_admin_and_territory_scope.sql` | Endurecimento do escopo local. |
| `014_restrict_territory_point_reads_by_unit.sql` | Leitura territorial por escopo. |
| `015_protect_unit_admin_institutional_scope.sql` | Proteção do vínculo do Admin UBS. |
| `016_profile_access_approval_and_membership.sql` | Ciclo pending/active/suspended. |
| `017_restrict_unit_admin_access_status_management.sql` | Limites de alteração de acesso. |
| `018_canonicalize_profile_network_labels.sql` | Canonicalização dos rótulos institucionais. |
| `019_restrict_unit_admin_profile_updates_to_acs.sql` | Limites históricos de atualização local. |
| `020_protect_approved_profile_microarea_scope.sql` | Proteção do vínculo territorial aprovado. |
| `021_least_privilege_unit_admin_visibility.sql` | Menor privilégio na visibilidade da UBS. |
| `022_enforce_profile_access_on_insert.sql` | Novos perfis entram sem autoaprovação. |
| `023_database_input_bounds.sql` | Limites e validações de entrada. |
| `024_least_privilege_table_grants.sql` | Grants mínimos das tabelas expostas. |
| `025_canonicalize_health_unit_municipality.sql` | Município canônico das unidades. |
| `026_protect_health_unit_identity.sql` | Proteção da identidade institucional da UBS. |
| `027_restrict_territory_point_kinds.sql` | Domínio fechado dos tipos territoriais. |
| `028_sync_profile_network_labels_on_catalog_update.sql` | Sincronização de rótulos após alterações do catálogo. |
| `029_separate_gestor_and_master_account.sql` | Separa Gestor Municipal da conta técnica Master. |
| `030_optimize_gestor_profile_policy.sql` | Otimiza policy do Gestor sem ampliar privilégios. |
| `031_enforce_management_scope_shape.sql` | Forma canônica do escopo por papel. |
| `032_noop_verify_management_scope_shape.sql` | Verificação versionada sem alteração de dados. |

## Migrations com timestamp

| Arquivo | Situação no projeto restaurado |
|---|---|
| `20260826135329_repair_reapplied_auth_objects.sql` | Aplicada como `036_repair_reapplied_auth_objects`; restaura definições finais após reaplicações históricas. |
| `20260826145213_bootstrap_initial_master_account.sql` | Aplicada como `bootstrap_initial_master_account`; no banco vazio foi no-op. Foi ajustada para PostgreSQL 17 usando `min(id::text)::uuid`, sem mudança da regra de negócio. |
| `20260826234754_add_clinical_professional_roles.sql` | Aplicada como `add_clinical_professional_roles`; adiciona Médico e Enfermeiro sem poderes administrativos. |
| `20260827161226_add_microareas_and_population_counts.sql` | Reaplicada no restore como `add_microareas_and_population_counts`; cria microáreas normalizadas e totais agregados opcionais, sem dados pessoais. |
| `20260829172457_harden_restored_project_security.sql` | Aplicada; remove policies territoriais permissivas herdadas e impede execução cliente de `rls_auto_enable()`. |
| `20260829175027_prepare_safe_initial_master_promotion.sql` | Aplicada; cria operação privada, serializada e não exposta à API para promover a primeira conta real confirmada quando não houver Master. |
| `20260829183355_align_initial_master_promotion_microareas.sql` | Aplicada; passa a limpar explicitamente também `microarea_id` durante a promoção da Master. |

## Microáreas e população acompanhada

A estrutura territorial normalizada é:

**Município → UBS → equipe → microárea → ACS**.

A tabela `microareas` armazena somente código territorial e totais agregados opcionais. Quando a quantidade de pessoas não está confirmada, permanece `null`; o sistema não converte ausência de informação em zero. A leitura por `anon` é bloqueada e o acesso autenticado é limitado por RLS.

No projeto restaurado a tabela foi criada com zero linhas porque não existem perfis Auth ainda. Nenhuma microárea ou total populacional foi inventado durante a reconstrução.

## Gestor Municipal × Master

`role='admin'` representa administração de rede. A distinção é feita por `is_master_account`:

- `admin + is_master_account=false` → Gestor Municipal;
- `admin + is_master_account=true` → Master / Desenvolvimento.

A Master não mantém município, UBS, equipe ou microárea no próprio perfil. A função privada de recuperação exige exatamente uma conta confirmada quando ainda não existe Master, usa lock transacional e não pode ser executada por `PUBLIC`, `anon`, `authenticated` nem `service_role` via API.

## Médico e Enfermeiro

`physician` e `nurse` são papéis profissionais de menor privilégio. Permanecem vinculados à UBS/equipe, podem receber acesso às ferramentas profissionais autorizadas pelo frontend e não recebem poderes administrativos. Prescrições continuam fora do banco do Território Vivo.

## Endurecimento do restore

Após a reconstrução, a auditoria encontrou policies antigas de `territory_points` que poderiam ser combinadas por `OR` com as policies finais de escopo. A migration de endurecimento removeu essas policies e revogou execução direta de `public.rls_auto_enable()` para papéis de cliente, preservando o event trigger interno que ativa RLS em novas tabelas públicas.

O Security Advisor foi executado após as alterações e permaneceu sem lints de segurança. O Performance Advisor pode informar índices ainda sem uso enquanto a base está vazia; isso não é tratado como falha de segurança.

## Regra para novas alterações

Toda nova alteração DDL deve:

1. possuir migration versionada;
2. ser aplicada ao projeto Supabase correspondente;
3. preservar RLS e menor privilégio;
4. executar Security e Performance Advisors após mudanças de schema/autorização;
5. atualizar testes de contrato quando necessário;
6. ser documentada neste histórico quando usar nome com timestamp;
7. nunca criar usuário Auth fictício nem inserir diretamente em `auth.users`.

## Critério de drift

Existe drift quando o estado efetivo de tabelas, constraints, funções, triggers, grants ou RLS difere do que a sequência versionada pretende produzir. Entradas exclusivas do projeto Supabase original excluído permanecem apenas como histórico e não são recriadas artificialmente.
