# Tratamentos Ilustrados Mais Frequentes

## Objetivo

A rota `#/app/tratamentos` oferece comunicação em saúde com frases curtas, passos numerados, imagens grandes, leitura em voz alta e confirmação por demonstração. O conteúdo foi estruturado para pessoas com baixa alfabetização sem infantilizar a orientação.

## Acesso por papel

- **ACS:** consulta, escuta, explica e imprime os guias gerais. Não define dose, intervalo, troca de marca ou duração.
- **Médica(o) e enfermeira(o):** além da consulta, podem preencher temporariamente medicamento, laboratório, apresentação, dose, horário e duração antes da impressão ou do PDF.
- **Gestão:** consulta e impressão dos guias gerais.

Os campos nunca incluem nome, CPF ou diagnóstico. O rascunho usa somente o armazenamento volátil em memória e não importa Supabase, repositório, `localStorage`, `sessionStorage` ou `indexedDB`.

## Guias incluídos

1. Bombinha com espaçador — plano para crise.
2. Bombinha de controle — uso contínuo.
3. Bombinha sem espaçador.
4. Spray ou jato nasal.
5. Pomada para os olhos.
6. Creme vaginal com aplicador.
7. Insulina NPH.
8. Insulina Regular.
9. Insulina glargina.
10. Água segura para beber com hipoclorito a 2,5%.
11. Água segura por filtração e fervura.

## Correções de segurança aplicadas

- O teste de flutuação do frasco metálico da bombinha foi excluído.
- Pomada oftálmica é aplicada diretamente no saco conjuntival inferior, sem usar o dedo e sem encostar a ponta do tubo.
- Agulha e seringa de insulina são de uso único; a página não orienta reutilização.
- Seringas de 30, 50 e 100 unidades não são tratadas como equivalentes.
- Mistura de NPH e Regular não é ensinada por uma imagem isolada; exige treinamento presencial.
- Conversão de NPH para glargina não é calculada automaticamente.
- Conservação da glargina, NPH e Regular depende da apresentação, do fabricante e da bula.
- Dose, intervalo, duração e relação com refeições permanecem campos profissionais.
- Os caminhos de tratamento da água com hipoclorito e com fervura aparecem em guias separados para evitar mistura das técnicas.

## Fontes de referência

- Ministério da Saúde — [Cuidados com a água](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/e/enchentes/cuidados-com-a-agua).
- Ministério da Saúde — [PCDT de Doença Pulmonar Obstrutiva Crônica](https://www.gov.br/saude/pt-br/assuntos/pcdt/d/doenca-pulmonar-obstrutiva-cronica).
- Ministério da Saúde — [Cuidados com a insulinoterapia](https://linhasdecuidado.saude.gov.br/portal/diabetes-mellitus-tipo-2-%28DM2%29-no-adulto/cuidados-com-insulinoterapia).
- Sociedade Brasileira de Diabetes — [Práticas seguras para preparo e aplicação de insulina](https://diretriz.diabetes.org.br/praticas-seguras-para-preparo-e-aplicacao-de-insulina/).
- Sociedade Brasileira de Diabetes — [Técnicas de aplicação de insulina](https://diretriz.diabetes.org.br/tecnicas-de-aplicacao-de-insulina/).
- NHS — [Como usar pomada oftálmica](https://www.buckshealthcare.nhs.uk/pifs/how-to-use-your-eye-ointment/).
- Kent Community Health NHS — [Técnica do inalador dosimetrado](https://www.kentcht.nhs.uk/leaflet/good-inhaler-technique/).
- East Kent Hospitals NHS — [Técnica de spray nasal](https://leaflets.ekhuft.nhs.uk/how-to-use-a-nasal-spray/html/).
- NHS — [Uso de creme vaginal com aplicador](https://www.nhs.uk/medicines/hormone-replacement-therapy-hrt/vaginal-oestrogen/how-and-when-to-use-vaginal-oestrogen/).

Os guias de spray nasal e creme vaginal exigem conferência da bula do produto específico e do protocolo local antes do uso.

## Imagens

As ilustrações específicas de espaçador, bombinha sem espaçador, spray nasal, creme vaginal, insulina, pomada oftálmica e tratamento da água são originais e ficam em `src/assets/treatment-guides/`, otimizadas em WebP para carregamento no computador e no celular. Cada sequência usa uma ação principal por quadro e reduz dependência de texto. As capturas enviadas foram usadas apenas como referência de temas e problemas de comunicação. Nenhum desenho, logotipo, código ou ativo do site externo foi incorporado.
