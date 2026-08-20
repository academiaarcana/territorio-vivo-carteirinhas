# Território Vivo — Arquitetura V2

## Objetivo

Transformar o protótipo acumulativo em uma aplicação web modular, auditável e segura, mantendo hospedagem estática no GitHub Pages e Supabase como backend.

## Princípios

1. **Sem prontuário paralelo**: dados de pacientes/famílias usados em carteirinhas permanecem temporários no navegador.
2. **Separação de responsabilidades**: interface, autenticação, acesso a dados, regras, impressão e conteúdo ficam em módulos distintos.
3. **Multiunidade**: Município → Unidade de saúde → Equipe → Microárea → Profissional.
4. **Permissão no banco**: a interface nunca é a única barreira de autorização; RLS e triggers continuam sendo a fonte de verdade.
5. **Progressive enhancement**: funcionalidades essenciais funcionam sem framework e sem processo de build.
6. **Impressão como recurso de primeira classe**: A4, preto e branco, economia de toner e leitura fácil.
7. **Conteúdo clínico versionável**: educação em saúde fica isolada de regras da aplicação e registra fontes.

## Estrutura

```text
index.html
config.js
src/
  main.js
  core/
    store.js
    router.js
    layout.js
  lib/
    dom.js
  services/
    supabase.js
    auth.js
    repository.js
  data/
    cards.js
    education.js
  pages/
    public.js
    auth.js
    dashboard.js
    cards.js
    five.js
    indicators.js
    education.js
    profile.js
    admin.js
  utils/
    print.js
  styles/
    foundation.css
```

## Fluxo de inicialização

1. `index.html` carrega apenas dependências externas, `config.js` e `src/main.js`.
2. `main.js` inicia o cliente Supabase e o estado global.
3. A sessão é recuperada antes da primeira rota protegida.
4. Se autenticado, o perfil e o contexto territorial são carregados.
5. O router aplica guardas de autenticação/admin e renderiza a página.
6. Mudanças de sessão atualizam o store e redirecionam de forma previsível.

## Estado

O store contém somente estado de aplicação:

- sessão e usuário;
- perfil profissional;
- município, unidade e equipe derivados do perfil;
- cache de municípios/unidades/equipes;
- estado de carregamento/erro.

Dados temporários de carteirinhas, indicadores e notas dos 5 minutos ficam no DOM/memória do módulo e são descartados ao sair/recarregar, salvo decisão futura explícita.

## Backend atual

Tabelas públicas:

- `profiles`: perfil profissional e vínculo territorial;
- `municipalities`: municípios habilitados;
- `health_units`: UBS/postos/pontos de atendimento;
- `teams`: equipes por unidade.

A conta master é definida no banco. O frontend apenas lê `profile.role`; não atribui permissão administrativa.

## Rotas

Públicas:

- `#/` — apresentação;
- `#/entrar` — login;
- `#/criar-conta` — autocadastro;
- `#/recuperar-senha` — recuperação.

Protegidas:

- `#/app/inicio`;
- `#/app/carteirinhas`;
- `#/app/5-minutos`;
- `#/app/indicadores`;
- `#/app/educacao`;
- `#/app/perfil`;
- `#/app/gestao` — somente master/admin.

## Camada de dados

`services/repository.js` é o único módulo que executa consultas de domínio. Páginas não montam queries Supabase diretamente. Isso reduz duplicação, melhora teste e facilita futuras mudanças de backend.

## Erros e segurança

- Mensagens de autenticação não revelam desnecessariamente se uma conta existe.
- HTML vindo de banco ou formulário é escapado antes de interpolação.
- `service_role` nunca vai para o navegador/repositório.
- O cliente usa somente publishable key.
- Toda atualização administrativa depende de RLS.

## Fases

### Fase 1 — Fundação estrutural

Reescrever shell, router, store, serviços, páginas e impressão. Manter CSS apenas funcional.

### Fase 2 — Homologação funcional

Testar master, ACS, outras UBS, equipe não cadastrada, recuperação de senha, perfil, impressão e PDF.

### Fase 3 — Design system

Criar identidade visual, tokens, componentes, responsividade, acessibilidade, estados vazios, loading, mensagens, navegação mobile e acabamento de impressão.

### Fase 4 — Expansão

Novas carteirinhas, educação em saúde, indicadores por equipe, novos municípios e, se necessário, nível de administrador por UBS.
