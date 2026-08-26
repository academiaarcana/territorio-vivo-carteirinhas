# Homologação do Território Vivo — V2

## Estado técnico

- V2 desenvolvida em `refactor/arquitetura-v2` e PR #1 Draft.
- `main` não recebe a V2 antes da homologação final.
- Supabase dedicado ao Território Vivo (`wknmlbiqbiissedzrato`).
- Estrutura: município → unidade/ponto → equipe → microárea → profissional.
- RLS ativo em `profiles`, `municipalities`, `health_units`, `teams` e `territory_points`.
- Três papéis: `acs`, `unit_admin`, `admin`.
- Ciclo de acesso: `pending`, `active`, `suspended`.
- Novos profissionais não-master entram pendentes e só acessam áreas internas depois de aprovação da gestão.
- Município, UBS, equipe e microárea formam o vínculo territorial protegido depois da aprovação.
- Dados das carteirinhas, 5 Minutos e indicadores manuais continuam temporários por padrão.
- GitHub Pages é o destino de publicação. O job de deploy exige `refs/heads/main`, inclusive em disparo manual.
- `vercel.json` apenas desativa publicação Vercel para este repositório; o projeto Academia Arcana permanece separado.

## 1. Configuração manual obrigatória

No Supabase:

**Authentication → URL Configuration**

Site URL:

`https://territoriovivo.github.io/territorio-vivo-carteirinhas/`

Adicionar também o mesmo endereço em **Redirect URLs**.

Para homologação local, adicionar ainda:

- `http://localhost:3000/**`
- `http://127.0.0.1:3000/**`

Essa etapa é necessária para confirmação de e-mail e recuperação de senha retornarem corretamente ao site.

### Limitação conhecida do plano Free

O advisor informa **Leaked Password Protection Disabled**. O recurso é pago no Supabase e não será contratado apenas para esta função.

Não é bloqueador de homologação no plano Free. O sistema compensa com aprovação de vínculo, RLS, menor privilégio, confirmação de e-mail, tratamento de rate limit e orientação de senha forte.

Passkeys/WebAuthn permanecem desativadas nesta fase.

## 2. Fluxo de novo profissional

1. Criar conta profissional.
2. Informar município, UBS, equipe e microárea.
3. Confirmar e-mail quando solicitado.
4. Entrar novamente.
5. Confirmar que o sistema mostra **Aguardando aprovação** e não libera as áreas internas.
6. Enquanto pendente, revisar/corrigir o vínculo solicitado se necessário.
7. Administrador da UBS ou master aprova o perfil.
8. Profissional usa **Verificar aprovação**.
9. Confirmar entrada no ambiente interno.
10. Confirmar que, depois da aprovação, município, UBS, equipe e microárea não podem mais ser trocados pelo próprio profissional.

## 3. Matriz de segurança

### Visitante

Deve:

- ver página pública;
- ver municípios/unidades/equipes ativas permitidas publicamente;
- criar conta e entrar nas telas de autenticação.

Não deve:

- ler `territory_points`;
- ler perfis profissionais;
- acessar rotas internas sem sessão;
- acessar diretamente a tela funcional de definição de nova senha sem uma sessão de recuperação/autenticada.

### Profissional / ACS pendente

Deve:

- ler o próprio perfil;
- revisar o vínculo solicitado antes da aprovação;
- verificar novamente o status;
- sair da conta.

Não deve:

- entrar em dashboard, território, carteirinhas, indicadores, educação ou gestão;
- ler/criar/alterar `territory_points`;
- autoaprovar o próprio perfil;
- alterar o próprio papel.

### Profissional / ACS ativo

Deve:

- acessar módulos internos;
- editar dados profissionais reutilizáveis permitidos;
- usar carteirinhas, 5 Minutos, indicadores e educação;
- ler pontos territoriais da própria UBS;
- criar pontos territoriais dentro do próprio escopo;
- editar/excluir os próprios pontos conforme policy.

Não deve:

- mudar o próprio status;
- mudar o próprio papel;
- trocar município, UBS, equipe ou microárea depois da aprovação;
- editar perfil de terceiro;
- criar ponto em outra UBS;
- ler pontos de outra UBS;
- acessar gestão.

### Administrador da UBS

Deve:

- possuir acesso ativo;
- abrir **Aprovações** e **Gestão da UBS**;
- ver o próprio perfil e perfis profissionais/ACS da própria UBS;
- aprovar/suspender somente perfis `acs` da própria UBS;
- atualizar perfis profissionais permitidos da própria UBS;
- administrar equipes da própria UBS;
- atualizar dados operacionais permitidos da própria UBS;
- ler/gerenciar pontos territoriais da própria UBS.

Não deve:

- mudar a própria UBS/equipe de gestão;
- administrar perfis de outra UBS;
- aprovar/suspender outro administrador;
- promover alguém a master;
- editar o perfil master como se fosse ACS;
- mudar CNES, município/UF, nome oficial, nome curto, tipo, ativação ou ordem administrativa da UBS;
- acessar achados territoriais de outra UBS.

### Master

Deve:

- manter `role=admin` e `access_status=active`;
- ter visão global;
- administrar municípios, UBS, equipes e perfis;
- ajustar vínculo institucional de profissionais;
- promover/revogar `unit_admin` em perfis não-master;
- aprovar/suspender perfis não-master;
- ler/gerenciar pontos territoriais em todos os escopos.

Nunca deve existir na interface um fluxo comum para transformar outro e-mail em master.

## 4. Equipe não cadastrada

1. No autocadastro, escolher **Minha equipe não aparece**.
2. Informar o nome da equipe.
3. Confirmar que o perfil fica pendente e o texto da equipe aparece como a confirmar.
4. Gestão cria/confirma a equipe na UBS correta.
5. Vincular `team_id` ao perfil.
6. Confirmar que `team_name` passa a ser o nome canônico da tabela `teams`.
7. Renomear uma equipe com o master e confirmar que perfis vinculados recebem o novo rótulo canônico sem liberar alteração de vínculo pelo ACS.

## 5. Território / Mapa Inteligente

Tipos permitidos, sem categoria genérica `other`:

- `resource` — recurso;
- `partner` — parceiro;
- `potentiality` — potencialidade;
- `access_barrier` — barreira de acesso;
- `risk` — risco ambiental/estrutural;
- `critical_point` — ponto crítico.

Testar:

- criar cada tipo permitido;
- editar;
- resolver;
- excluir;
- buscar;
- filtrar por tipo/status;
- editar município/UBS/equipe do ponto somente como master;
- coordenadas dentro de latitude -90..90 e longitude -180..180;
- vírgula decimal no frontend;
- rejeição de apenas uma das duas coordenadas;
- rejeição de tipo/status não permitido por chamada direta.

Autoria:

- `created_by` é definido pelo trigger com `auth.uid()` no INSERT;
- `created_by` é preservado no UPDATE;
- o frontend não envia `created_by`.

Nunca cadastrar nome de paciente, família identificável, CPF, CNS, diagnóstico, condição clínica individual ou outra informação sensível identificável.

## 6. Carteirinhas e impressão

Validar pelo menos um modelo em cada grupo:

- Família;
- Território;
- 5 Minutos;
- Indicadores;
- Gestão.

Para cada teste relevante:

- preencher;
- visualizar;
- limpar;
- imprimir;
- baixar PDF;
- validar fallback de impressão quando o gerador de PDF não estiver disponível;
- validar 2/A4;
- validar 4/A4;
- validar 8/A4;
- validar 12/A4;
- validar modo leitura fácil;
- validar modo econômico;
- confirmar que o dado temporário não aparece no Supabase, `localStorage`, `sessionStorage` ou IndexedDB.

## 7. Autenticação

Testar:

- login correto;
- senha incorreta;
- e-mail não confirmado;
- recuperação de senha;
- visitante tentando abrir `#/recuperar-senha` sem sessão e sendo redirecionado;
- link de recuperação retornando ao GitHub Pages;
- nova senha e logout após redefinição;
- várias tentativas/rate limit quando aplicável;
- duplo clique em Entrar/Criar conta não gerando requisições duplicadas;
- sessão expirada redirecionando área interna para login.

## 8. Acessibilidade e dispositivos

Testar sem mouse:

- Tab/Shift+Tab;
- `:focus-visible`;
- skip link público e autenticado;
- foco no `h1` após navegação SPA;
- fechamento de dialogs com Escape;
- foco inicial ao abrir dialog;
- retorno de foco ao disparador quando ele ainda estiver conectado e visível;
- ausência de retorno de foco para elemento removido, oculto ou inerte;
- tabs com ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Home/End;
- roving `tabindex` e `aria-selected` coerentes;
- formulários, `aria-live`, `aria-busy` e estados disabled.

Larguras mínimas de homologação:

- celular estreito;
- celular comum;
- tablet;
- notebook/desktop.

Respeitar `prefers-reduced-motion`.

## 9. CI e banco antes de liberar

Antes de retirar o PR de Draft:

- `npm run check` verde;
- sintaxe de todos os módulos verde;
- teste público Supabase verde;
- `territory_points` bloqueado para anon;
- migrations Git e Supabase sincronizadas;
- Security Advisor revisado;
- Performance Advisor revisado;
- nenhum segredo/service role no frontend;
- nenhum script legado referenciado;
- job do GitHub Pages bloqueado fora de `main`;
- PR ainda apontando para `main` sem merge antecipado.

Avisos de índice **unused** em tabelas novas não justificam remoção automática.

## 10. Situação da homologação com contas legítimas

Em 21/08/2026, a base real possui somente a conta master ativa. Não foram criadas contas fictícias para completar a matriz.

Assim que profissionais reais se cadastrarem, executar em sequência:

1. validar uma conta `pending` sem liberar `/app`;
2. aprovar a conta e validar um ACS `active`;
3. testar isolamento territorial do ACS;
4. promover um profissional legítimo a `unit_admin` pelo master;
5. validar gestão limitada à própria UBS;
6. validar que o `unit_admin` não controla outro administrador/master nem a identidade oficial da UBS;
7. repetir a visão global com a conta master;
8. testar suspensão e reativação da conta profissional;
9. registrar os resultados sem alterar RLS para facilitar o teste.

## 11. Critério de liberação para design

A programação estrutural só é considerada totalmente homologada quando:

1. fluxo visitante funciona em navegador real;
2. fluxo ACS pendente e aprovação funciona com conta legítima;
3. fluxo ACS ativo funciona com conta legítima;
4. fluxo administrador da UBS funciona com conta legítima;
5. fluxo master funciona;
6. recuperação de senha funciona no domínio publicado;
7. impressão/PDF foi verificada em navegador real;
8. matriz de segurança não apresenta quebra de escopo;
9. CI e advisors estão revisados no HEAD final.

Depois disso começa a fase de design system, identidade visual, mapa cartográfico visual, componentes e imagens.

O objetivo da homologação é avaliar a ferramenta e suas regras, não o trabalhador.
