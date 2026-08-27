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

## Pendências antes de produção

1. aplicar a migration em ambiente Supabase controlado;
2. executar Security Advisor e Performance Advisor;
3. confirmar a Data API com perfis reais de teste já aprovados;
4. realizar QA visual da aba Microáreas;
5. manter a PR em Draft até essas evidências existirem.

O ensaio isolado valida PostgreSQL, constraints, triggers e RLS, mas não substitui os Advisors nem uma homologação no projeto Supabase real.
