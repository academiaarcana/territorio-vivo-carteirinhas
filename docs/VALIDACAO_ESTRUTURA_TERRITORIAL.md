# Validação isolada — estrutura territorial

## Escopo

Validação técnica da migration `20260827161226_add_microareas_and_population_counts.sql` antes de qualquer aplicação no Supabase ou publicação no GitHub Pages.

Data do ensaio: 27/08/2026.

## Ambiente

- PostgreSQL isolado em memória com PGlite;
- 35 migrations versionadas aplicadas em sequência;
- nenhum acesso ao Supabase de produção;
- nenhum usuário, perfil ou dado real utilizado;
- migration operacional `20260826145213_bootstrap_initial_master_account.sql` excluída somente do ensaio porque depende do agregado `min(uuid)` disponível no ambiente em que o bootstrap já foi executado.

## Resultados

| Verificação | Resultado |
|---|---|
| Criação da tabela `microareas` | Aprovada |
| RLS habilitada | Aprovada |
| Total populacional negativo | Bloqueado |
| Total informado sem data de referência | Bloqueado |
| Microárea vinculada a equipe diferente do ACS | Bloqueada |
| Dois ACS vinculados à mesma microárea | Bloqueado |
| Médico/Enfermeiro mantendo microárea | Vínculo removido pelo trigger |
| ACS lendo outra equipe | Bloqueado |
| ACS cadastrando microárea | Bloqueado |
| Administrador da UBS lendo a própria unidade | Aprovado |
| Administrador da UBS lendo outra unidade | Bloqueado |
| Gestor Municipal lendo toda a rede | Aprovado |
| Papel `anon` lendo microáreas | Bloqueado |
| Campo vazio tratado como zero | Não ocorre; permanece `null` |

## Compatibilidade com mudanças atuais do Supabase

O Supabase passou a exigir opt-in explícito para expor novas tabelas à Data API em novos projetos. A migration concede acesso somente a `authenticated`, revoga `anon` e habilita RLS antes do uso pelo frontend.

## Validação no Supabase de produção

Em 27/08/2026, a migration foi aplicada como `20260827180933 — add_microareas_and_population_counts`.

| Verificação | Resultado |
|---|---|
| Tabela `microareas` criada | Aprovada |
| RLS habilitada | Aprovada |
| Quatro policies territoriais | Aprovadas |
| Leitura por `anon` | Bloqueada |
| Perfil ACS existente vinculado à microárea | Aprovado |
| Total populacional ausente | Preservado como `null` |
| Security Advisor | Sem erro da migration; aviso geral de proteção de senhas vazadas desativada |
| Performance Advisor | Somente índices ainda sem uso, informação esperada em estrutura recém-criada |

## Pendências antes do merge

1. confirmar a Data API em sessão autenticada já aprovada, sem criar conta fictícia;
2. realizar QA visual da aba Microáreas em desktop e celular;
3. manter a integração fora da `main` até essas evidências existirem.

O conector administrativo não possui permissão para assumir o papel PostgreSQL `authenticated`; por isso ele não substitui uma sessão real da aplicação na validação da Data API. O ensaio isolado e os Advisors validam schema, constraints, triggers, grants e RLS, mas essa limitação permanece registrada.
