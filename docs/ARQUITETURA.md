# Arquitetura — Território Vivo

## Objetivo
Transformar a biblioteca de carteirinhas em uma plataforma de apoio ao ACS e à equipe, com foco em simplicidade, impressão A4, leitura fácil, territorialização e proteção de dados.

## Áreas do sistema
1. **Início** — atalhos e visão da rotina.
2. **Carteirinhas** — formulários temporários, pré-visualização, PDF e impressão A4.
3. **5 minutos do território** — guia de bolso e nota rápida para reunião.
4. **Indicadores** — microárea, leitura de lacunas e planejamento.
5. **Educação em saúde** — materiais de apoio separados por tema.
6. **Meu perfil** — dados do ACS/equipe preenchidos uma única vez.

## Privacidade
- O banco armazena o perfil do ACS e os dados institucionais reutilizáveis.
- Campos de usuário/família digitados para gerar carteirinhas ficam no navegador durante o uso e não são gravados no banco por padrão.
- A plataforma não é prontuário e não substitui e-SUS APS, PEC ou sistemas oficiais.
- Informações sensíveis não devem ser impressas sem necessidade assistencial clara.

## Autenticação
Supabase Auth com login individual por e-mail e senha. A tabela `profiles` usa RLS para que cada usuário autenticado leia e altere apenas o próprio perfil.

## Impressão
- Papel: sempre A4.
- Opções: 2, 4 ou 8 unidades por folha, conforme o modelo.
- Modo econômico: sem grandes áreas preenchidas e com menor consumo de toner.
- Leitura fácil: tipografia maior, menos conteúdo por bloco e estrutura visual previsível.

## Educação em saúde
Conteúdos clínicos devem ter fonte oficial e data/revisão periódica. A primeira versão inclui:
- Mapa da pressão arterial — Ministério da Saúde / Linha de Cuidado da HAS; referência complementar Diretriz Brasileira de Hipertensão 2025.
- Como usar insulina — Ministério da Saúde / Linha de Cuidado do DM2, cuidados com insulinoterapia.

Esses materiais são educativos e não devem substituir orientação individual, prescrição ou avaliação clínica.

## Próximas etapas
- Conectar um projeto Supabase dedicado.
- Criar as contas dos ACS e definir uma conta administradora.
- Publicar em hospedagem HTTPS.
- Inserir identidade visual institucional validada.
- Testar impressão real em toner preto e branco.
- Revisar os materiais educativos com a equipe antes de uso público.
