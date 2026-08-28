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

## Complementos de leitura fácil

Seis cartões complementares mantêm uma ação principal por quadro e evitam sobrecarregar os guias principais:

- hipoclorito: reconhecer o frasco da UBS, conferir concentração e rejeitar perfume, corante ou outros aditivos;
- insulina: armazenamento, transporte sem contato direto com gelo e entrega de perfurocortantes à UBS;
- corticoide inalatório: enxaguar, gargarejar e cuspir após o último jato;
- spray nasal: mãos limpas, direção externa, limpeza do bico e uso individual;
- pomada ocular: higiene das mãos, uso de espelho, ponta afastada e não compartilhamento;
- sinais de urgência: dificuldade respiratória grave, hipoglicemia grave, perda súbita da visão e acionamento do SAMU 192.

Quatro alertas também aparecem em cartões individuais e grandes: falta de ar grave, desmaio ou convulsão, problema grave no olho e ligação para o SAMU 192. O catálogo passa a ter 21 guias: 11 principais, 6 complementares e 4 alertas individuais.

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
- NPH, Regular e glargina usam sequências próprias: aparência e mistura da NPH, relação da Regular com a refeição conforme prescrição e preparo da caneta de glargina.
- O hipoclorito é ilustrado como o frasco pequeno âmbar com tampa branca frequentemente entregue pela UBS, sem reproduzir logotipo institucional. A embalagem pode variar; o rótulo precisa informar `Hipoclorito de sódio 2,5%` e uso para tratamento da água.
- A alternativa com água sanitária só aparece quando o rótulo informa de 2,0% a 2,5% de cloro ativo e ausência de perfume, essência, desinfetante ou outro aditivo, conforme o Ministério da Saúde.
- Insulina em transporte não encosta diretamente no gelo; agulhas e seringas vão para recipiente rígido resistente à perfuração e depois para a UBS.
- Pessoa inconsciente ou convulsionando não recebe comida, bebida ou medicamento pela boca.
- Bombinha com espaçador usa um jato por vez. Quando o protocolo local e a prescrição adotarem essa técnica, a pessoa mantém a máscara vedada e respira 10 vezes depois de cada jato; isso não significa aplicar dez jatos.
- O intervalo de 20 minutos aparece somente como parte do plano de crise escrito e validado pelo serviço, nunca como regra automática para todos.
- A imagem de urgência local identifica o **Hospital e Maternidade Ana Neta**; em risco imediato, o guia também preserva a orientação para o SAMU 192 e para o fluxo municipal.

## Fontes de referência

- Ministério da Saúde — [Cuidados com a água](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/e/enchentes/cuidados-com-a-agua).
- Ministério da Saúde — [PCDT de Doença Pulmonar Obstrutiva Crônica](https://www.gov.br/saude/pt-br/assuntos/pcdt/d/doenca-pulmonar-obstrutiva-cronica).
- Ministério da Saúde — [Técnica inalatória](https://linhasdecuidado.saude.gov.br/portal/asma/tecnica-inalatoria/).
- Ministério da Saúde — [Cuidados com a insulinoterapia](https://linhasdecuidado.saude.gov.br/portal/diabetes-mellitus-tipo-2-%28DM2%29-no-adulto/cuidados-com-insulinoterapia).
- Sociedade Brasileira de Diabetes — [Práticas seguras para preparo e aplicação de insulina](https://diretriz.diabetes.org.br/praticas-seguras-para-preparo-e-aplicacao-de-insulina/).
- Sociedade Brasileira de Diabetes — [Técnicas de aplicação de insulina](https://diretriz.diabetes.org.br/tecnicas-de-aplicacao-de-insulina/).
- NHS — [Como usar pomada oftálmica](https://www.buckshealthcare.nhs.uk/pifs/how-to-use-your-eye-ointment/).
- NHS — [Higiene e uso de pomada oftálmica](https://www.nhs.uk/medicines/chloramphenicol/how-and-when-to-use-chloramphenicol/).
- NHS — [Higiene e uso de spray nasal](https://www.nhs.uk/medicines/fluticasone-nasal-spray-and-drops/how-and-when-to-use-fluticasone-nasal-spray-and-drops/).
- Kent Community Health NHS — [Técnica do inalador dosimetrado](https://www.kentcht.nhs.uk/leaflet/good-inhaler-technique/).
- East Kent Hospitals NHS — [Técnica de spray nasal](https://leaflets.ekhuft.nhs.uk/how-to-use-a-nasal-spray/html/).
- NHS — [Uso de creme vaginal com aplicador](https://www.nhs.uk/medicines/hormone-replacement-therapy-hrt/vaginal-oestrogen/how-and-when-to-use-vaginal-oestrogen/).

Os guias de spray nasal e creme vaginal exigem conferência da bula do produto específico e do protocolo local antes do uso.

## Imagens

As ilustrações específicas de espaçador, bombinha sem espaçador, spray nasal, creme vaginal, NPH, Regular, glargina, pomada oftálmica, tratamento da água, complementos e alertas são originais e ficam em `src/assets/treatment-guides/`, otimizadas em WebP para carregamento no computador e no celular. O uso contínuo e o plano de crise possuem imagens distintas. As duas explicitam `1 JATO` e `RESPIRAR 10 VEZES`; a versão de crise separa ainda `REPETIR SÓ SE RECEITADO`, `20 min` e a procura do Hospital e Maternidade Ana Neta. Cada sequência usa uma ação principal por quadro e reduz dependência de texto. As capturas enviadas foram usadas apenas como referência de temas, nome oficial do serviço e problemas de comunicação. Nenhum desenho, logotipo, código ou ativo do site externo foi incorporado.

### Prompt-base dos seis complementos autorais

As seis imagens foram geradas em modo de criação, sem editar nem copiar ativos externos. O conjunto usou o mesmo prompt-base: `painel educativo quadrado 2 × 2 para Atenção Primária, pessoas adultas brasileiras diversas, fundo branco, contorno azul-escuro, poucos elementos, uma ação por quadro, setas grandes, símbolos verde de correto e vermelho de proibido, sem logotipos, sem marca comercial e sem prescrever dose`. A cena específica de cada painel foi:

1. conferir frasco de hipoclorito 2,5% ou água sanitária 2,0–2,5% sem perfume, corante ou aditivo;
2. guardar insulina na prateleira interna, transportar sem contato direto com gelo e devolver perfurocortantes à UBS;
3. após corticoide inalatório, enxaguar, gargarejar, cuspir e não engolir;
4. usar spray nasal com mãos limpas, apontar para fora, limpar o bico e não compartilhar;
5. usar pomada oftálmica com mãos limpas, espelho e ponta afastada do olho, sem compartilhar;
6. reconhecer dificuldade respiratória grave, hipoglicemia grave, perda súbita da visão e acionar o SAMU 192.

### Prompts das correções de espaçador e alertas

Modo usado: ferramenta de geração de imagens integrada. Os prompts preservaram a grade e o estilo educativo, trocaram `10×` por `1 JATO — RESPIRAR 10 VEZES`, mantiveram a repetição condicionada à receita e separaram o intervalo de 20 minutos. A fotografia do Hospital e Maternidade Ana Neta foi usada apenas para confirmar o nome; fachada, logotipo, bandeiras e demais elementos da foto não foram copiados.

Os quatro alertas individuais foram recortados de uma prancha autoral 2 × 2: falta de ar grave, pessoa inconsciente ou convulsionando sem nada pela boca, urgência ocular e ligação para o SAMU 192.
