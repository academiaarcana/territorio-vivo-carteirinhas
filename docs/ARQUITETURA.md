# Arquitetura — Território Vivo

## Objetivo
Plataforma web de apoio à territorialização e à rotina da Atenção Primária, com foco em simplicidade, impressão A4, leitura fácil, educação em saúde e proteção de dados.

O sistema nasceu na UBS Madre Tereza de Calcutá / Equipe 02, mas a arquitetura atual permite uso por várias unidades e equipes.

## Estrutura territorial
A referência institucional segue a hierarquia:

**Município → Unidade/Ponto de atendimento → Equipe → Microárea → Profissional**

Tabelas principais:
- `municipalities`: municípios habilitados no sistema;
- `health_units`: unidades/pontos de atenção identificados por CNES;
- `teams`: equipes vinculadas a uma unidade, com estado `pending` ou `confirmed`;
- `microareas`: microáreas vinculadas a uma equipe, com total populacional agregado opcional;
- `profiles`: perfil profissional do usuário e seu vínculo territorial.

O primeiro município cadastrado é Pimenta Bueno/RO (`110018`). Novos municípios podem ser incluídos sem mudar o modelo de dados.

## Fontes e confirmação
Dados institucionais públicos podem preencher o catálogo de unidades: nome, CNES, endereço, telefone, tipo e fonte consultada.

A existência de uma unidade em fonte pública não significa que telefone, horário, equipe ou lotação profissional estejam necessariamente atuais. Por isso:
- unidades podem ter estado `public_source`, `needs_review` ou `team_confirmed`;
- equipes só entram como `confirmed` após validação local/administrativa;
- nomes de profissionais não são importados automaticamente da internet;
- a fonte e a data de consulta permanecem registradas.

## Contas e permissões
Supabase Auth usa login individual por e-mail e senha.

- Usuário ACS: lê e atualiza o próprio perfil.
- Conta master: administra perfis, catálogo institucional e equipes.
- A função master é determinada no banco e não pode ser escolhida no frontend.

RLS está ativo em `profiles`, `municipalities`, `health_units`, `teams` e `microareas`.

## Privacidade
- O banco armazena apenas dados profissionais e institucionais necessários ao funcionamento da plataforma.
- Dados de usuários/famílias digitados nos geradores de carteirinhas são temporários por padrão.
- A plataforma não é prontuário e não substitui e-SUS APS, PEC ou sistemas oficiais.
- Não deve ser criada uma base paralela de pacientes.

## Áreas do sistema
1. **Início** — atalhos e visão da rotina.
2. **Carteirinhas** — formulários temporários, pré-visualização, PDF e impressão A4.
3. **5 minutos do território** — guia e nota rápida para reunião.
4. **Indicadores** — microárea, lacunas de informação e planejamento.
5. **Educação em saúde** — materiais de apoio separados por tema.
6. **Meu perfil** — município, UBS, equipe, microárea e dados profissionais reutilizáveis.
7. **Gestão da equipe** — exclusivo da conta master; perfis, unidades e equipes confirmáveis.

## Impressão
- Papel A4.
- Opções de 2, 4 ou 8 unidades por folha, conforme o modelo.
- Modo econômico para reduzir toner.
- Leitura fácil com tipografia maior e estrutura previsível.

## Educação em saúde
Conteúdos devem ter fonte e revisão periódica. A versão atual inclui:
- mapa da pressão arterial;
- orientação geral sobre uso de insulina.

São materiais educativos e não substituem avaliação, prescrição ou orientação individual.

## Hospedagem
- Frontend: GitHub Pages.
- Backend e autenticação: Supabase.
- O projeto Território Vivo é independente do projeto Academia Arcana hospedado na Vercel.

## Próximas evoluções
- permitir administradores por unidade sem ampliar acesso indevido;
- incluir mais municípios quando houver adesão;
- registrar histórico de confirmação institucional sem guardar dados de pacientes;
- revisar impressão em equipamentos reais da rede;
- ampliar materiais educativos com revisão clínica.
