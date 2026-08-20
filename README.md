# Território Vivo — Atenção Primária de Pimenta Bueno/RO

Plataforma web para apoiar territorialização, geração de carteirinhas, rotina dos **5 minutos do território**, indicadores e educação em saúde na Atenção Primária.

O projeto nasceu a partir de uma experiência na UBS Madre Tereza de Calcutá / Equipe 02 e foi ampliado para permitir uso por **outras UBS, equipes e microáreas de Pimenta Bueno**.

## Publicação

O Território Vivo é mantido separado do projeto Academia Arcana.

- **Frontend:** GitHub Pages
- **Backend:** Supabase Free, projeto `territorio-vivo-carteirinhas`
- **Vercel:** não é necessária para este repositório
- **Endereço previsto:** `https://academiaarcana.github.io/territorio-vivo-carteirinhas/`

O workflow `.github/workflows/pages.yml` publica automaticamente a branch `main` no GitHub Pages.

## Contas e acesso

Cada profissional pode criar a própria conta com nome, e-mail, unidade de saúde, equipe (quando conhecida), microárea e senha.

A conta `macedotaynara@outlook.com` é reconhecida pelo banco como **master/admin**. Todas as demais contas recebem o papel **ACS**. Essa regra é aplicada no banco por trigger e não depende apenas da interface.

A conta master possui um painel para visualizar e atualizar os dados profissionais dos perfis cadastrados, inclusive UBS, equipe e microárea.

## Rede de Pimenta Bueno

O Supabase contém um catálogo institucional baseado em dados públicos do CNES, com as principais unidades da Atenção Primária e pontos de atendimento do município. O catálogo inicial inclui:

- UBS Madre Tereza de Calcutá;
- UBS Maura Ferreira;
- UBS Pastor Ismaelino Salviano de Matos;
- UBS Frei Silvestre;
- UBS Pastor Jonas;
- Posto de Saúde Canaã;
- Ponto de Atendimento Itaporanga;
- Posto de Saúde Urucumacuã.

As fontes e a data de consulta estão documentadas em `docs/FONTES_PUBLICAS_PIMENTA_BUENO.md`.

Nomes de profissionais e composição das equipes não são importados automaticamente da internet, porque podem mudar. Esses dados são confirmados pelo próprio profissional ou pela gestão.

## Privacidade

O sistema não foi desenhado como prontuário e não mantém uma base paralela de pacientes.

- O Supabase guarda apenas dados profissionais/de equipe necessários ao funcionamento da plataforma.
- Dados preenchidos nos geradores de carteirinhas são temporários por padrão.
- Informações clínicas ou sociais sensíveis não devem ser colocadas em carteirinhas familiares sem necessidade assistencial clara.
- Row Level Security (RLS) limita o acesso dos ACS ao próprio perfil; a conta master possui a permissão administrativa necessária para gestão dos perfis.

## Funcionalidades atuais

- Login com e-mail e senha.
- Autocadastro por UBS, equipe e microárea.
- Recuperação de senha.
- Catálogo de unidades de saúde com CNES e referências públicas.
- Perfil profissional reutilizado nas carteirinhas.
- Painel master de gestão dos perfis de diferentes unidades.
- Biblioteca de carteirinhas para família, território e gestão.
- Impressão A4 com 2, 4 ou 8 unidades.
- Modos leitura fácil e econômico.
- Rotina dos 5 minutos do território.
- Indicadores da microárea.
- Educação em saúde: mapa da pressão e orientação geral sobre uso de insulina.
- Impressão e PDF dos materiais educativos.

## Segurança do Supabase

As migrações estão em `supabase/migrations/`.

O projeto utiliza RLS e funções administrativas protegidas. O campo `role` também é validado pelo banco para impedir que um usuário comum transforme a própria conta em administradora.

## Configuração de autenticação

Para confirmação de e-mail e recuperação de senha em produção, o Supabase deve aceitar o endereço do GitHub Pages como URL de redirecionamento:

`https://academiaarcana.github.io/territorio-vivo-carteirinhas/`

No painel do Supabase, isso fica em **Authentication → URL Configuration**. O frontend já envia esse endereço como `emailRedirectTo`/`redirectTo` quando está publicado nessa URL.

## Diretrizes do projeto

- funcionar bem em papel A4 e impressão preto e branco;
- economizar papel e toner;
- não depender de cor para transmitir informação;
- oferecer leitura fácil;
- registrar apenas o necessário;
- evitar uma segunda burocracia para o ACS;
- transformar achados do território em decisão, ação e reavaliação;
- avaliar a ferramenta, não o trabalhador.
