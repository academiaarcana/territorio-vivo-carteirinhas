# Homologação do Território Vivo — V2

## Estado técnico

- V2 desenvolvida em `refactor/arquitetura-v2` e PR #1 Draft.
- `main` não deve receber a V2 antes da homologação final.
- Supabase dedicado ao Território Vivo.
- Estrutura: município → unidade/ponto → equipe → microárea → profissional.
- RLS ativo em `profiles`, `municipalities`, `health_units`, `teams` e `territory_points`.
- Três papéis: `acs`, `unit_admin`, `admin`.
- Ciclo de acesso: `pending`, `active`, `suspended`.
- Novos profissionais não-master entram pendentes e só acessam áreas internas depois de aprovação da gestão.
- Dados das carteirinhas, 5 Minutos e indicadores manuais continuam temporários por padrão.
- Vercel permanece fora deste repositório; isso não afeta o outro projeto Academia Arcana.

## 1. Configuração manual obrigatória

No Supabase:

**Authentication → URL Configuration**

Site URL:

`https://academiaarcana.github.io/territorio-vivo-carteirinhas/`

Adicionar também o mesmo endereço em **Redirect URLs**.

Essa etapa é necessária para confirmação de e-mail e recuperação de senha retornarem corretamente ao site.

### Limitação conhecida do plano Free

O advisor informa **Leaked Password Protection Disabled**. O recurso é pago no Supabase e não será contratado apenas para esta função.

Não é bloqueador de homologação no plano Free. O sistema compensa com aprovação de vínculo, RLS, menor privilégio, confirmação de e-mail, tratamento de rate limit e orientação de senha forte.

Passkeys/WebAuthn permanecem desativadas nesta fase.

## 2. Fluxo de novo profissional

1. Criar conta profissional.
2. Informar município, UBS, equipe/microárea.
3. Confirmar e-mail quando solicitado.
4. Entrar novamente.
5. Confirmar que o sistema mostra **Aguardando aprovação** e não libera as áreas internas.
6. Enquanto pendente, revisar/corrigir o vínculo solicitado se necessário.
7. Administrador da UBS ou master aprova o perfil.
8. Profissional usa **Verificar aprovação**.
9. Confirmar entrada no ambiente interno.
10. Confirmar que, depois da aprovação, município/UBS/equipe não podem mais ser trocados pelo próprio profissional.

## 3. Matriz de segurança

### Visitante

Deve:

- ver página pública;
- ver municípios/unidades/equipes ativas permitidas publicamente;
- criar conta e entrar nas telas de autenticação.

Não deve:

- ler `territory_points`;
- ler perfis profissionais;
- acessar rotas internas sem sessão.

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
- editar dados pessoais/profissionais reutilizáveis permitidos;
- usar carteirinhas, 5 Minutos, indicadores e educação;
- ler pontos territoriais da própria UBS;
- criar pontos territoriais dentro do próprio escopo;
- editar/excluir seus próprios pontos conforme policy.

Não deve:

- mudar o próprio status;
- mudar o próprio papel;
- trocar município/UBS/equipe depois da aprovação;
- editar perfil de terceiro;
- criar ponto em outra UBS;
- ler pontos de outra UBS;
- acessar gestão.

### Administrador da UBS

Deve:

- possuir acesso ativo;
- abrir **Aprovações** e **Gestão da UBS**;
- ver perfis do escopo da própria UBS;
- aprovar/suspender somente perfis `acs` da própria UBS;
- atualizar perfis profissionais permitidos da própria UBS;
- administrar equipes da própria UBS;
- atualizar dados institucionais operacionais permitidos da própria UBS;
- ler/gerenciar pontos territoriais da própria UBS.

Não deve:

- mudar a própria UBS/equipe de gestão;
- administrar perfis de outra UBS;
- aprovar/suspender outro administrador;
- promover alguém a master;
- editar o perfil master como se fosse ACS;
- mover UBS para outro município;
- ativar/desativar estruturalmente UBS via chamada direta;
- acessar achados territoriais de outra UBS.

### Master

Deve:

- manter `role=admin` e `access_status=active`;
- ter visão global dos perfis permitidos;
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

## 5. Território / Mapa Inteligente

Testar:

- criar recurso;
- criar parceiro;
- criar potencialidade;
- criar risco ambiental/estrutural;
- criar ponto crítico;
- criar barreira de acesso;
- editar;
- resolver;
- excluir;
- buscar;
- filtrar por tipo/status;
- coordenadas dentro de latitude -90..90 e longitude -180..180.

Nunca cadastrar nome de paciente, família identificável, diagnóstico ou condição clínica individual.

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
- validar 2/A4;
- validar 4/A4;
- validar 8/A4;
- validar 12/A4;
- validar modo leitura fácil;
- validar modo econômico;
- confirmar que o dado temporário não aparece no Supabase.

## 7. Autenticação

Testar:

- login correto;
- senha incorreta;
- e-mail não confirmado;
- recuperação de senha;
- link de recuperação retornando ao GitHub Pages;
- nova senha e logout após redefinição;
- várias tentativas/rate limit quando aplicável;
- duplo clique em Entrar/Criar conta não gerando requisições duplicadas.

## 8. Acessibilidade e dispositivos

Testar sem mouse:

- Tab/Shift+Tab;
- foco visível;
- fechamento de dialogs;
- navegação entre páginas;
- leitura do título ao trocar de rota;
- formulários e mensagens `aria-live`.

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
- migrations Git e Supabase sincronizadas;
- Security Advisor revisado;
- Performance Advisor revisado;
- nenhum segredo/service role no frontend;
- nenhum script legado referenciado;
- PR ainda apontando para `main` sem merge antecipado.

Avisos de índice **unused** em tabelas novas não justificam remoção automática.

## 10. Critério de liberação para design

A programação estrutural só é considerada homologada quando:

1. fluxo visitante funciona;
2. fluxo ACS pendente e aprovação funciona;
3. fluxo ACS ativo funciona;
4. fluxo administrador da UBS funciona;
5. fluxo master funciona;
6. recuperação de senha funciona no domínio publicado;
7. impressão/PDF foi verificada em navegador real;
8. matriz de segurança não apresenta quebra de escopo;
9. CI e advisors estão revisados no HEAD final.

Depois disso começa a fase de design system, identidade visual, mapa cartográfico visual, componentes e imagens.

O objetivo da homologação é avaliar a ferramenta e suas regras, não o trabalhador.
