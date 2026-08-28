# Biblioteca visual de prescrições

Os arquivos em `src/assets/prescription-support/` são ilustrações originais geradas para o Território Vivo. As capturas e o HTML renderizado do Cuidado Para Todos foram usados somente para compreender categorias e fluxo. Nenhum desenho, logotipo, código, SVG, recorte ou endereço do bucket externo foi incorporado.

## Categorias cobertas

- Combinados.
- Combinados Povos Indígenas.
- Via de uso.
- Motivo do uso.
- Horários.
- Personagens.
- Associações.
- Retirada de corticoide(s).
- Outros.
- Utilitários.

## Navegação unificada

A etapa separada **Escolha a via de uso** foi incorporada à **Biblioteca visual**. A interface usa uma única faixa horizontal de abas — Combinados, Povos Indígenas, Via de uso, Motivo do uso, Horários e demais categorias — com estado ativo azul, rolagem horizontal no celular e navegação por setas, Home e End no teclado.

A via continua sendo um campo obrigatório do rascunho temporário. Ao abrir a categoria **Via de uso**, a opção atual aparece selecionada e pode ser trocada sem criar um segundo seletor visual.

O conjunto autoral local inclui manhã, almoço, noite, antes de dormir, via oral, injeção, pele, gotas, inalação, gotas nos olhos, gotas no ouvido, uso nasal, dor, febre, tosse, desconforto abdominal, evitar álcool, redução gradual e duas cenas de contexto cotidiano para povos indígenas. Personagens e utilitários complementares reutilizam a biblioteca Flaticon já atribuída no produto.

## Direção de geração

Modo usado: ferramenta de geração de imagens integrada, um ativo por chamada.

Prompt-base: pictograma científico-educacional para um construtor acessível de orientações de medicamentos; ilustração acolhedora em saúde, contorno azul-marinho espesso, preenchimentos planos turquesa, verde-azulado, amarelo e laranja, formas arredondadas, alto contraste, um assunto central, tela quadrada, margem ampla, leitura em 64 px, fundo realmente transparente, sem texto, letras, números, logotipo, marca-d'água ou moldura.

Variações finais: inalação; gotas no ouvido; gotas nos olhos; spray nasal; dor; febre; tosse; desconforto abdominal; evitar álcool; redução gradual; pessoa indígena contemporânea tomando medicamento com refeição pela manhã; pessoa indígena contemporânea descansando em rede à noite. Nas duas últimas foi vedado o uso de traje cerimonial, penas, pintura corporal, caricatura ou padrão tribal genérico.

Os PNGs foram normalizados em 512 × 512 px, fundo transparente e paleta otimizada para carregamento no site.

## Limites clínicos e culturais

Dose, quantidade, horário, intervalo, duração e etapas de retirada permanecem como texto editável ao lado dos pictogramas. O sistema não interpreta o texto do PEC, não sugere dose e não cria prescrição.

Os pictogramas são apoio de comunicação e não substituem receita, orientação profissional ou conferência clínica. Em retirada de corticoide, todas as doses, datas e etapas devem estar escritas.

As cenas da categoria Povos Indígenas não representam todos os povos. Linguagem, situações e significados devem ser validados com a comunidade atendida antes do uso.

## Google Cloud do Território Vivo

O destino previsto é o projeto `territoriovivo`, em bucket próprio e caminho versionado, por exemplo `gs://<bucket-do-territorio-vivo>/prescription-support/v1/`. O site mantém os arquivos locais como origem segura até o bucket, IAM, cache e CORS serem configurados e verificados.

Não foi criada nem solicitada chave de serviço. O ambiente de desenvolvimento atual não possui o `gcloud` conectado; portanto, nenhum upload foi alegado ou executado. A futura publicação deve usar uma identidade autorizada do projeto, sem reutilizar o bucket do site de referência.
