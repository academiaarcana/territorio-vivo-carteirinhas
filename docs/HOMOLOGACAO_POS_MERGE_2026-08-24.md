# Homologação pós-merge — Território Vivo V2

Data de abertura desta etapa: 24/08/2026.

## Motivo

O PR #1 da V2 foi mesclado antes da conclusão da matriz de homologação humana. Para retomar o trabalho sem alterar diretamente a `main`, esta etapa passa a usar uma branch exclusiva de homologação e um novo PR em Draft.

## Baseline confirmado

- repositório: `academiaarcana/territorio-vivo-carteirinhas`;
- base de referência: `main` no commit `e0f96361c56d571d152d0e9d81cdc8049be2232d`;
- branch de continuação: `homologacao/engenharia-v2-pos-merge`;
- Supabase: `wguurbmtoofkubdawzzr` (`territorio-vivo-carteirinhas`), região `sa-east-1`;
- migrations versionadas e aplicadas até `032_noop_verify_management_scope_shape.sql`;
- Security Advisor: apenas `Leaked Password Protection Disabled`, limitação conhecida do plano Free;
- Performance Advisor: somente informações de índices ainda sem uso observado.

## Regras desta etapa

- não alterar diretamente a `main`;
- manter o novo PR em Draft até a homologação humana;
- não enfraquecer RLS, triggers, constraints ou políticas de acesso para facilitar testes;
- não criar contas fictícias permanentes;
- toda nova alteração DDL deve receber migration numerada posterior à 032;
- não iniciar redesign visual pesado antes da conclusão da auditoria funcional e de autorização.

## Matriz obrigatória de homologação

- visitante;
- pending;
- ACS active;
- unit_admin;
- Gestor Municipal / admin;
- conta Master / Desenvolvimento;
- suspended.

## Próxima sequência técnica

1. confirmar CI do novo HEAD;
2. revisar CRUD e autorização de perfis, aprovações, municípios, UBS, equipes e território;
3. revisar autenticação, sessão e router com negação por padrão;
4. conferir RLS, triggers, constraints e grants diretamente no Supabase;
5. revisar acessibilidade estrutural;
6. revisar impressão/PDF e volatilidade dos dados temporários;
7. rodar advisors;
8. registrar claramente o que está confirmado e o que ainda depende de homologação humana.

Este documento é um marcador de auditoria e não altera comportamento de runtime.