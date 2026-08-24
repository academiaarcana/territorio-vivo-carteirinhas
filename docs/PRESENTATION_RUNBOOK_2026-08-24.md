# Roteiro de apresentação — Território Vivo

Data prevista: 24/08/2026.

## Mensagem central

**Reconhecer, compreender e planejar a partir do território.**

Fluxo narrativo:

**TERRITÓRIO → CONHECIMENTO → DECISÃO → AÇÃO → REAVALIAÇÃO**

O Território Vivo é uma ferramenta de apoio à Atenção Primária à Saúde. Não é prontuário, não substitui e-SUS APS/PEC e não constitui sistema oficial do Ministério da Saúde.

## Roteiro de 5–7 minutos

1. **Início — 30 s**
   - Mostrar o contexto/escopo da conta.
   - Frase: “O sistema começa pelo território de atuação e pelas tarefas que a equipe realmente precisa organizar.”

2. **Objetivo e tutorial — 2 min**
   - Mostrar: problema → objetivo → tutorial → ferramentas.
   - Frase: “A proposta é aproximar observação de campo, dados, conversa de equipe e próximo passo sem criar um prontuário paralelo.”

3. **Território e rede — 1 min**
   - Mostrar unidades/equipes e achados territoriais não pessoais.
   - Destacar recursos, potencialidades, parceiros, riscos, pontos críticos e barreiras.
   - Mostrar o atalho gratuito para Google Maps apenas se houver conexão.

4. **Carteirinhas — 1–2 min**
   - Abrir um modelo já conhecido.
   - Mostrar preenchimento temporário, contexto, leitura fácil/apoio visual e impressão/PDF.
   - Evitar depender de uma geração PDF inédita durante a fala principal; deixar um PDF previamente gerado disponível como segurança.

5. **5 minutos do território — 45 s**
   - Frase: “O que mudou, por que importa, o que vamos fazer, quem fica responsável e quando revisar.”

6. **Indicadores — 45 s**
   - Frase: “O número entra como pergunta para o território, não como ranking de trabalhador.”

7. **Educação em saúde — 30 s**
   - Mostrar que os materiais têm fonte técnica e podem ser impressos/gerados em PDF.

8. **Fechamento — 20 s**
   - Repetir: “Território, conhecimento, decisão, ação e reavaliação.”
   - Reforçar privacidade e limite: registros clínicos identificáveis permanecem nos sistemas oficiais.

## Pré-voo no computador

Antes da apresentação:

- conectar à internet;
- atualizar a branch local;
- iniciar `http://localhost:3000`;
- fazer login;
- abrir uma vez: Início, Objetivo e tutorial, Território, Carteirinhas, 5 minutos, Indicadores e Educação em saúde;
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
- não cadastrar dados territoriais inventados.
