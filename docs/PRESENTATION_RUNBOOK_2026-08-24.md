# Roteiro de apresentação — Território Vivo

Data prevista: 24/08/2026.

## Mensagem central

**Reconhecer, compreender e planejar a partir do território.**

Fluxo narrativo:

**TERRITÓRIO → SIGNIFICADO → PRIORIDADE → DECISÃO → AÇÃO → REAVALIAÇÃO**

O Território Vivo é uma ferramenta de apoio à Atenção Primária à Saúde. Não é prontuário, não substitui e-SUS APS/PEC e não constitui sistema oficial do Ministério da Saúde.

## Ideia que deve ficar clara

O território não é apenas um mapa ou um endereço. É o espaço vivo onde população, serviços, relações, recursos, barreiras, condições sociais e ambientais se encontram e mudam ao longo do tempo.

O sistema ajuda a organizar esse conhecimento para que a equipe consiga discutir o que importa, definir um próximo passo e voltar depois para reavaliar.

## Cenário fictício recomendado

Use um cenário territorial simples, sem pessoas identificáveis:

> Após chuvas fortes, um trecho de acesso entre parte da microárea e a UBS fica frequentemente alagado. A equipe registra uma **barreira de acesso**, discute por que aquilo importa, identifica parceiros possíveis, combina uma ação/articulação, define quem ficará responsável pelo retorno e marca uma data para reavaliar.

Esse exemplo permite demonstrar:
- território e rede;
- barreira de acesso;
- intersetorialidade;
- 5 Minutos;
- decisão e responsável;
- reavaliação;
- gestão pública sem dado clínico pessoal.

## Roteiro de 5–7 minutos

1. **Início — 40 s**
   - Mostrar contexto/escopo da conta.
   - Mostrar “O território agora”.
   - Frase: “O sistema começa pelo território e mostra o que pode orientar a próxima conversa da equipe.”

2. **Objetivo e tutorial — 1 min 30 s**
   - Mostrar problema → ciclo territorial → como o sistema responde.
   - Passar rapidamente pelo fluxo: conhecer, interpretar, priorizar, planejar, agir e reavaliar.
   - Frase: “A proposta é organizar conhecimento territorial sem criar prontuário paralelo.”

3. **Do território à gestão — 40 s**
   - Mostrar ACS/profissionais → equipe → UBS → Gestão Municipal.
   - Explicar que cada nível muda a escala do planejamento, mas as permissões continuam respeitando o escopo.
   - Reforçar: não há ranking de ACS ou UBS.

4. **Território e rede — 1 min**
   - Mostrar unidades/equipes e achados territoriais não pessoais.
   - No cenário fictício, localizar a barreira de acesso.
   - Destacar também recursos, potencialidades e parceiros para evitar uma leitura do território apenas por problemas.
   - Mostrar o atalho gratuito para Google Maps apenas se houver conexão.

5. **5 minutos do território — 1 min**
   - Usar o mesmo cenário fictício.
   - Preencher: situação/onde → o que mudou → por que importa → decisão → responsável/articulação → revisão.
   - Frase: “O achado só ganha utilidade quando vira decisão e volta para reavaliação.”

6. **Indicadores — 35 s**
   - Frase: “O número entra como pergunta para o território, não como ranking de trabalhador.”
   - Mostrar rapidamente sistema mostra → território observa → não sabemos → próxima ação.

7. **Carteirinhas e Educação em saúde — 45 s**
   - Mostrar que comunicação pode sair da tela por material simples, leitura fácil, apoio visual, impressão/PDF.
   - Evitar gerar um PDF inédito durante a fala principal; manter um PDF previamente aberto como segurança.

8. **Fechamento — 20 s**
   - Repetir: “Território, significado, prioridade, ação e reavaliação.”
   - Reforçar privacidade e limite: registros clínicos identificáveis permanecem nos sistemas oficiais.

## Como explicar a gestão pública

- **ACS/profissionais:** conhecem a realidade vivida e reconhecem mudanças na microárea/território.
- **Equipe:** interpreta e prioriza de forma compartilhada.
- **UBS:** organiza fluxos locais, articula serviços e parceiros.
- **Gestão Municipal:** observa necessidades agregadas da rede para apoiar planejamento e organização dos serviços.
- **Master / Desenvolvimento:** administração técnica protegida do sistema, separada da função de gestão municipal.

Não apresentar gestão como vigilância individual de produtividade.

## Pré-voo no computador

Antes da apresentação:

- conectar à internet;
- atualizar a branch local;
- iniciar `http://localhost:3000`;
- fazer login;
- abrir uma vez: Início, Objetivo e tutorial, Território, Carteirinhas, 5 minutos, Indicadores e Educação em saúde;
- conferir a página em zoom 100% e, se possível, no projetor;
- deixar um PDF já homologado aberto em outra aba como material de segurança;
- não fazer logout durante a demonstração;
- evitar recarregar a página se a conexão do local estiver instável.

## Dependências de internet

O projeto **não é uma aplicação offline**.

Precisam de internet para funcionamento confiável:

- carregamento inicial da biblioteca Supabase pelo CDN;
- carregamento inicial do html2pdf pelo CDN;
- autenticação e renovação de sessão no Supabase;
- catálogo de municípios, unidades e equipes;
- achados territoriais e ações de gestão;
- pictogramas remotos do Flaticon;
- Google Maps e links de fontes externas.

Se os arquivos já estiverem em cache, o navegador pode exibir partes já carregadas, mas isso não deve ser apresentado como suporte offline garantido.

## Plano de contingência

Se a internet falhar:

1. não recarregar as telas que já estão abertas;
2. continuar a explicação pela página já renderizada;
3. usar screenshots/PDFs previamente abertos para demonstrar saídas;
4. explicar que autenticação e catálogo vivo são conectados ao Supabase e exigem rede;
5. não improvisar mudanças de configuração ou deploy durante a apresentação.

## O que não fazer na véspera

- não fazer merge em `main`;
- não publicar uma versão não homologada;
- não trocar bibliotecas de PDF;
- não alterar autenticação/RLS apenas para facilitar a demonstração;
- não adicionar API paga ou serviço que exija billing;
- não cadastrar dados territoriais inventados;
- não criar nova tabela de planejamento apenas para enriquecer a demonstração.
