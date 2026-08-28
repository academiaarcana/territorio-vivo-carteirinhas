const assetUrl = (filename) => new URL(`../assets/${filename}`, import.meta.url).href;

const sharedInsulinSafety = [
  { title: 'Confira antes de aplicar', detail: 'Leia o nome da insulina, a apresentação e a dose escrita na receita.' },
  { title: 'Use material novo', detail: 'Use agulha ou seringa nova. Não compartilhe e não reutilize.' },
  { title: 'Escolha outro ponto', detail: 'Faça rodízio dentro das áreas orientadas pela equipe. Evite caroços, feridas e pele machucada.' },
  { title: 'Aplique como foi ensinado', detail: 'Use o ângulo, a prega e o tempo de espera demonstrados pela equipe para o material recebido.' },
  { title: 'Descarte com segurança', detail: 'Coloque agulhas e seringas no recipiente indicado pela unidade de saúde.' }
];

export const treatmentGuideCategories = Object.freeze([
  { id: 'all', label: 'Todos' },
  { id: 'respiratory', label: 'Respiração' },
  { id: 'diabetes', label: 'Insulinas' },
  { id: 'eyes-skin', label: 'Olhos e aplicação local' },
  { id: 'home-care', label: 'Cuidados em casa' },
  { id: 'safety', label: 'Quando pedir ajuda' }
]);

export const treatmentGuides = Object.freeze([
  {
    id: 'bronchodilator-spacer-crisis',
    category: 'respiratory',
    title: 'Bombinha com espaçador — plano para crise',
    shortTitle: 'Espaçador na crise',
    summary: 'A equipe escreve quantos jatos usar, quantas vezes repetir e quando procurar atendimento.',
    image: assetUrl('treatment-guides/inhaler-spacer-steps.webp'),
    steps: [
      { title: 'Confira a bombinha', detail: 'Veja o nome, o laboratório e a dose escrita pela equipe.' },
      { title: 'Agite bem', detail: 'Agite a bombinha antes do primeiro jato e novamente antes de cada jato seguinte.' },
      { title: 'Monte o espaçador', detail: 'Conecte a bombinha ao espaçador. Encoste a máscara cobrindo nariz e boca, sem deixar frestas.' },
      { title: 'Aperte uma vez', detail: 'Dê somente um jato por vez.' },
      { title: 'Respire devagar', detail: 'Mantenha a máscara no rosto e faça a quantidade de respirações indicada pela equipe.' },
      { title: 'Repita somente como prescrito', detail: 'Espere o intervalo escrito. Agite de novo antes do próximo jato.' },
      { title: 'Observe a pessoa', detail: 'Se houver piora, dificuldade para falar, sonolência, lábios arroxeados ou falta de ar intensa, procure atendimento sem demora.' }
    ],
    alerts: [
      'Não coloque o frasco metálico na água para verificar se está cheio.',
      'A quantidade de jatos, repetições e intervalos deve ser escrita por médica(o) ou enfermeira(o) conforme o protocolo do serviço.'
    ],
    sourceLabel: 'PCDT de doenças respiratórias — Ministério da Saúde',
    sourceUrl: 'https://www.gov.br/saude/pt-br/assuntos/pcdt/d/doenca-pulmonar-obstrutiva-cronica'
  },
  {
    id: 'inhaled-controller',
    category: 'respiratory',
    title: 'Bombinha de controle — uso contínuo',
    shortTitle: 'Bombinha contínua',
    summary: 'Ajuda a usar corretamente o medicamento inalatório prescrito para todos os dias.',
    image: assetUrl('treatment-guides/inhaler-spacer-steps.webp'),
    steps: [
      { title: 'Use todos os dias', detail: 'Siga os horários escritos, mesmo quando estiver se sentindo bem.' },
      { title: 'Agite e conecte', detail: 'Quando o produto exigir, agite a bombinha e conecte ao espaçador.' },
      { title: 'Um jato por vez', detail: 'Aperte uma vez e respire devagar. Agite novamente antes de outro jato.' },
      { title: 'Lave a boca', detail: 'Quando houver corticoide inalatório, gargareje com água e cuspa após terminar. Não engula essa água.' },
      { title: 'Não troque sozinho', detail: 'Não aumente, diminua ou interrompa o medicamento sem orientação da equipe.' }
    ],
    alerts: ['Medicamento de alívio e medicamento de controle têm finalidades diferentes. Confira o rótulo antes de usar.'],
    sourceLabel: 'PCDT de doenças respiratórias — Ministério da Saúde',
    sourceUrl: 'https://www.gov.br/saude/pt-br/assuntos/pcdt/d/doenca-pulmonar-obstrutiva-cronica'
  },
  {
    id: 'inhaled-steroid-mouth-care',
    category: 'respiratory',
    title: 'Depois da bombinha com corticoide',
    shortTitle: 'Enxaguar a boca',
    summary: 'Quando o medicamento tiver corticoide inalatório, enxágue, gargareje e cuspa depois do último jato.',
    image: assetUrl('treatment-guides/inhaled-steroid-mouth-care.webp'),
    steps: [
      { title: 'Termine os jatos prescritos', detail: 'Use a bombinha exatamente como a equipe ensinou.' },
      { title: 'Pegue água limpa', detail: 'Coloque água limpa em um copo. Não acrescente medicamento.' },
      { title: 'Enxágue e gargareje', detail: 'Passe a água por toda a boca e gargareje.' },
      { title: 'Cuspa na pia', detail: 'Não engula a água usada para enxaguar a boca.' }
    ],
    alerts: ['Este cuidado é para medicamentos com corticoide inalatório. Confirme com a equipe se a sua bombinha contém corticoide.'],
    sourceLabel: 'Técnica inalatória — Ministério da Saúde',
    sourceUrl: 'https://linhasdecuidado.saude.gov.br/portal/asma/tecnica-inalatoria/'
  },
  {
    id: 'inhaler-without-spacer',
    category: 'respiratory',
    title: 'Bombinha sem espaçador',
    shortTitle: 'Bombinha sem espaçador',
    summary: 'Sequência geral para aerossol dosimetrado; a equipe deve demonstrar a técnica com o dispositivo real.',
    image: assetUrl('treatment-guides/inhaler-no-spacer-steps.webp'),
    steps: [
      { title: 'Retire a tampa e confira', detail: 'Veja se o bocal está limpo e se é a bombinha certa.' },
      { title: 'Agite', detail: 'Agite como orientado na bula do produto.' },
      { title: 'Solte o ar', detail: 'Esvazie os pulmões longe do bocal.' },
      { title: 'Feche os lábios', detail: 'Coloque o bocal entre os lábios, sem morder.' },
      { title: 'Aperte e puxe o ar', detail: 'Comece a inspirar devagar e, ao mesmo tempo, aperte uma vez.' },
      { title: 'Segure e solte', detail: 'Segure o ar pelo tempo que conseguir confortavelmente e solte devagar.' }
    ],
    alerts: ['Se houver dificuldade de coordenação, peça à equipe para avaliar o uso de espaçador ou outro dispositivo.', 'Não use o teste da água no frasco metálico.'],
    sourceLabel: 'Técnica do inalador dosimetrado — Kent Community Health NHS',
    sourceUrl: 'https://www.kentcht.nhs.uk/leaflet/good-inhaler-technique/'
  },
  {
    id: 'nasal-spray',
    category: 'respiratory',
    title: 'Spray ou jato nasal',
    shortTitle: 'Spray nasal',
    summary: 'Mostra a posição e os cuidados gerais. Quantidade e duração ficam na receita.',
    image: assetUrl('treatment-guides/nasal-spray-steps.webp'),
    steps: [
      { title: 'Lave as mãos', detail: 'Limpe as mãos antes de tocar no aplicador.' },
      { title: 'Prepare o frasco', detail: 'Agite ou prepare a válvula somente se a bula do produto mandar.' },
      { title: 'Cabeça um pouco para frente', detail: 'Mantenha a cabeça levemente inclinada para frente.' },
      { title: 'Aponte para o lado', detail: 'Direcione o bico para a parede externa da narina, longe do meio do nariz.' },
      { title: 'Aperte e respire suave', detail: 'Faça o jato enquanto inspira suavemente. Não puxe o ar com força.' },
      { title: 'Limpe e tampe', detail: 'Limpe o bico sem compartilhar o frasco e recoloque a tampa.' }
    ],
    alerts: ['Use somente a quantidade, o lado e o número de dias escritos na receita.'],
    sourceLabel: 'Técnica de spray nasal — East Kent Hospitals NHS',
    sourceUrl: 'https://leaflets.ekhuft.nhs.uk/how-to-use-a-nasal-spray/html/'
  },
  {
    id: 'nasal-spray-hygiene',
    category: 'respiratory',
    title: 'Spray nasal — higiene e cuidado',
    shortTitle: 'Cuidar do spray nasal',
    summary: 'Mãos limpas, direção correta, bico limpo e frasco de uso individual.',
    image: assetUrl('treatment-guides/nasal-spray-hygiene.webp'),
    steps: [
      { title: 'Lave as mãos', detail: 'Lave com água e sabão antes de tocar no frasco.' },
      { title: 'Aponte para o lado', detail: 'Mantenha a cabeça um pouco para frente e aponte o bico para a parede externa da narina, em direção à orelha.' },
      { title: 'Limpe e tampe', detail: 'Depois do uso, passe um lenço limpo no bico e recoloque a tampa.' },
      { title: 'Não compartilhe', detail: 'Cada pessoa deve usar o próprio frasco para evitar contaminação.' }
    ],
    alerts: ['Não enfie objetos no bico. Para desentupir ou lavar peças, siga a bula do produto específico.'],
    sourceLabel: 'Como usar spray nasal — NHS',
    sourceUrl: 'https://www.nhs.uk/medicines/fluticasone-nasal-spray-and-drops/how-and-when-to-use-fluticasone-nasal-spray-and-drops/'
  },
  {
    id: 'eye-ointment',
    category: 'eyes-skin',
    title: 'Pomada para os olhos',
    shortTitle: 'Pomada oftálmica',
    summary: 'A pomada entra no espaço da pálpebra inferior sem encostar a ponta do tubo.',
    image: assetUrl('treatment-guides/eye-ointment-steps.webp'),
    steps: [
      { title: 'Lave e seque as mãos', detail: 'Não aplique com as mãos sujas.' },
      { title: 'Olhe para cima', detail: 'Incline a cabeça e puxe delicadamente a pálpebra inferior, formando uma bolsinha.' },
      { title: 'Aplique direto do tubo', detail: 'Coloque a faixa de pomada prescrita dentro da bolsinha da pálpebra.' },
      { title: 'Não encoste a ponta', detail: 'A ponta do tubo não deve tocar o olho, cílios, pálpebra, pele ou dedos.' },
      { title: 'Feche o olho', detail: 'Feche suavemente pelo tempo orientado. Não aperte nem esfregue.' },
      { title: 'Tampe o tubo', detail: 'Feche logo após usar. Não compartilhe com outra pessoa.' }
    ],
    alerts: ['A quantidade, o olho, a frequência e a duração precisam estar escritos na receita.'],
    sourceLabel: 'Orientação para pomada oftálmica — NHS',
    sourceUrl: 'https://www.buckshealthcare.nhs.uk/pifs/how-to-use-your-eye-ointment/'
  },
  {
    id: 'eye-ointment-hygiene',
    category: 'eyes-skin',
    title: 'Pomada para os olhos — evitar contaminação',
    shortTitle: 'Cuidar da pomada ocular',
    summary: 'A ponta do tubo não pode tocar o olho, os cílios, a pele ou os dedos.',
    image: assetUrl('treatment-guides/eye-ointment-hygiene.webp'),
    steps: [
      { title: 'Lave e seque as mãos', detail: 'Faça isso antes e depois de usar a pomada.' },
      { title: 'Use um espelho', detail: 'Puxe delicadamente a pálpebra inferior e veja a bolsinha formada.' },
      { title: 'Mantenha a ponta afastada', detail: 'Aplique direto do tubo sem tocar o olho, os cílios, a pálpebra, a pele ou os dedos.' },
      { title: 'Tampe e não compartilhe', detail: 'Feche logo depois de usar e mantenha o tubo para uma pessoa só.' }
    ],
    alerts: ['Se a ponta encostar ou parecer contaminada, não limpe com os dedos: peça orientação à farmácia ou à equipe.'],
    sourceLabel: 'Uso seguro de pomada ocular — NHS',
    sourceUrl: 'https://www.nhs.uk/medicines/chloramphenicol/how-and-when-to-use-chloramphenicol/'
  },
  {
    id: 'vaginal-cream',
    category: 'eyes-skin',
    title: 'Creme vaginal com aplicador',
    shortTitle: 'Creme vaginal',
    summary: 'Explicação respeitosa para preparar e usar o aplicador conforme a receita e a bula.',
    image: assetUrl('treatment-guides/vaginal-cream-steps.webp'),
    steps: [
      { title: 'Confira o produto', detail: 'Veja o nome, o laboratório, a quantidade e os dias de tratamento.' },
      { title: 'Lave as mãos', detail: 'Lave antes e depois da aplicação.' },
      { title: 'Prepare o aplicador', detail: 'Encaixe e preencha somente até a medida prescrita, seguindo a bula.' },
      { title: 'Fique confortável', detail: 'Deite-se ou use a posição ensinada pela equipe.' },
      { title: 'Aplique com cuidado', detail: 'Introduza o aplicador delicadamente até onde for confortável e empurre o êmbolo.' },
      { title: 'Descarte ou higienize', detail: 'Faça exatamente o que a bula informa para aquele tipo de aplicador.' }
    ],
    alerts: ['Não presuma que será sempre um aplicador cheio ou sempre à noite: siga a receita do produto específico.'],
    sourceLabel: 'Uso de creme vaginal com aplicador — NHS e bula do produto',
    sourceUrl: 'https://www.nhs.uk/medicines/hormone-replacement-therapy-hrt/vaginal-oestrogen/how-and-when-to-use-vaginal-oestrogen/'
  },
  {
    id: 'insulin-nph',
    category: 'diabetes',
    title: 'Insulina NPH — frasco, seringa ou caneta',
    shortTitle: 'Insulina NPH',
    summary: 'A NPH é uma suspensão. O preparo, a seringa e a conservação dependem do produto fornecido.',
    image: assetUrl('treatment-guides/insulin-nph-steps.webp'),
    steps: [
      { title: 'Confira se é NPH', detail: 'Leia o rótulo. Confirme laboratório, apresentação, concentração e dose.' },
      { title: 'Misture com suavidade', detail: 'Homogeneíze como ensinado e como informa a bula. Não sacuda com força.' },
      ...sharedInsulinSafety.slice(1)
    ],
    alerts: ['Seringas de 30, 50 e 100 unidades têm escalas diferentes. Use somente a seringa indicada e aprenda a ler sua escala.', 'Conservação e prazo após abertura devem seguir a bula do laboratório informado.'],
    sourceLabel: 'Práticas seguras para aplicação — Sociedade Brasileira de Diabetes',
    sourceUrl: 'https://diretriz.diabetes.org.br/praticas-seguras-para-preparo-e-aplicacao-de-insulina/'
  },
  {
    id: 'insulin-regular',
    category: 'diabetes',
    title: 'Insulina Regular — frasco, seringa ou caneta',
    shortTitle: 'Insulina Regular',
    summary: 'A equipe deve escrever a dose e a relação com a refeição. Não use um horário genérico sem conferir a receita.',
    image: assetUrl('treatment-guides/insulin-regular-steps.webp'),
    steps: [
      { title: 'Confira se é Regular', detail: 'Leia o rótulo. Confirme laboratório, apresentação, concentração e dose.' },
      { title: 'Olhe a aparência', detail: 'A insulina Regular normalmente é transparente. Se estiver diferente da bula, não aplique antes de consultar a equipe.' },
      { title: 'Veja a relação com a refeição', detail: 'Aplique no tempo exato escrito pela equipe. Garanta acesso à refeição conforme o plano prescrito.' },
      ...sharedInsulinSafety.slice(1)
    ],
    alerts: ['Se NPH e Regular forem prescritas na mesma seringa, a mistura exige treinamento presencial e sequência correta. Não improvise.'],
    sourceLabel: 'Técnicas de aplicação — Sociedade Brasileira de Diabetes',
    sourceUrl: 'https://diretriz.diabetes.org.br/tecnicas-de-aplicacao-de-insulina/'
  },
  {
    id: 'insulin-glargine',
    category: 'diabetes',
    title: 'Insulina glargina — caneta',
    shortTitle: 'Insulina glargina',
    summary: 'A marca, a concentração e a conservação precisam ser conferidas no produto recebido.',
    image: assetUrl('treatment-guides/insulin-glargine-pen-steps.webp'),
    steps: [
      { title: 'Confira a caneta', detail: 'Leia nome, laboratório, concentração e dose. Existem apresentações diferentes.' },
      { title: 'Olhe a insulina', detail: 'Confira a aparência descrita na bula antes de aplicar.' },
      { title: 'Coloque agulha nova', detail: 'Use uma agulha nova em cada aplicação. Retire e descarte depois de usar.' },
      { title: 'Prepare a caneta', detail: 'Faça o teste de fluxo e selecione a dose conforme a demonstração do dispositivo recebido.' },
      ...sharedInsulinSafety.slice(2)
    ],
    alerts: ['Caneta em uso, refil e frasco podem ter regras diferentes de conservação e validade. O laboratório deve aparecer na orientação.', 'Conversão de NPH para glargina é decisão clínica e não será calculada automaticamente nesta página.'],
    sourceLabel: 'Cuidados com insulinoterapia — Ministério da Saúde',
    sourceUrl: 'https://linhasdecuidado.saude.gov.br/portal/diabetes-mellitus-tipo-2-%28DM2%29-no-adulto/cuidados-com-insulinoterapia'
  },
  {
    id: 'insulin-storage-disposal',
    category: 'diabetes',
    title: 'Insulina — guardar, transportar e descartar',
    shortTitle: 'Cuidar da insulina',
    summary: 'A apresentação lacrada e a que já está em uso podem ter regras diferentes. Confira sempre o fabricante.',
    image: assetUrl('treatment-guides/insulin-storage-disposal.webp'),
    steps: [
      { title: 'Veja se está lacrada ou em uso', detail: 'Leia a embalagem e a bula. Anote no rótulo a data em que abriu.' },
      { title: 'Não congele', detail: 'Quando a bula mandar refrigerar, guarde na prateleira do meio ou de baixo, longe do congelador, das paredes e da porta.' },
      { title: 'Proteja no transporte', detail: 'Leve na bagagem de mão, longe do sol e do calor. Em bolsa térmica, não deixe a insulina encostar no gelo.' },
      { title: 'Use recipiente rígido', detail: 'Coloque agulhas e seringas usadas em recipiente rígido, resistente à perfuração, com abertura larga e tampa.' },
      { title: 'Entregue na UBS', detail: 'Leve o recipiente fechado para a unidade de saúde fazer o descarte correto.' }
    ],
    alerts: ['Não use garrafa PET para perfurocortantes. Não jogue agulhas ou seringas no lixo comum.', 'Caneta, frasco e refil podem ter conservação e validade diferentes. Siga a bula e a orientação da equipe.'],
    sourceLabel: 'Cuidados com insulinoterapia — Ministério da Saúde',
    sourceUrl: 'https://linhasdecuidado.saude.gov.br/portal/diabetes-mellitus-tipo-2-%28DM2%29-no-adulto/cuidados-com-insulinoterapia'
  },
  {
    id: 'safe-water',
    category: 'home-care',
    title: 'Água segura para beber — hipoclorito',
    shortTitle: 'Água com hipoclorito',
    summary: 'Um caminho de cada vez: filtre, use somente hipoclorito a 2,5%, misture e espere.',
    image: assetUrl('treatment-guides/safe-water-drops-steps.webp'),
    steps: [
      { title: 'Coe ou filtre', detail: 'Use filtro doméstico, coador de papel ou pano limpo.' },
      { title: 'Reconheça o frasco', detail: 'O frasco entregue pela UBS costuma ser pequeno, âmbar e com tampa branca. A embalagem pode variar: leia no rótulo “Hipoclorito de sódio 2,5%” e confirme que é próprio para tratar água.' },
      { title: 'Pingue na medida certa', detail: 'Para hipoclorito a 2,5%, use 2 gotas em cada 1 litro de água filtrada.' },
      { title: 'Misture e espere', detail: 'Misture bem e espere 30 minutos antes de beber ou preparar alimentos.' },
      { title: 'Guarde tampada', detail: 'Mantenha a água tratada em recipiente limpo e tampado. Consuma em até 24 horas.' }
    ],
    alerts: ['Prefira o frasco orientado ou entregue pela UBS. Não use produto perfumado, com corante ou concentração diferente.', 'Se não houver hipoclorito a 2,5%, abra o guia separado “Água por fervura”.'],
    sourceLabel: 'Cuidados com a água — Ministério da Saúde',
    sourceUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/e/enchentes/cuidados-com-a-agua'
  },
  {
    id: 'safe-water-product-check',
    category: 'home-care',
    title: 'Hipoclorito — qual produto pode usar?',
    shortTitle: 'Conferir o hipoclorito',
    summary: 'Reconheça o frasco da UBS, confira a concentração e rejeite produtos com perfume, corante ou outros aditivos.',
    image: assetUrl('treatment-guides/safe-water-product-check.webp'),
    steps: [
      { title: 'Prefira o frasco da UBS', detail: 'O frasco distribuído costuma ser pequeno, âmbar, com tampa branca e rótulo “Hipoclorito de sódio 2,5%”. A embalagem pode variar.' },
      { title: 'Leia a concentração', detail: 'Para o guia principal, use hipoclorito de sódio a 2,5% próprio para tratar água.' },
      { title: 'Veja se há aditivos', detail: 'O Ministério admite água sanitária com 2,0% a 2,5% de cloro ativo somente quando não tem alvejante, desinfetante, essência, perfume ou outro aditivo.' },
      { title: 'Não use produto colorido ou perfumado', detail: 'Desinfetante, água sanitária perfumada e produto com concentração desconhecida não servem para tratar água de beber.' },
      { title: 'Na dúvida, leve à UBS', detail: 'Peça para a equipe conferir o rótulo antes de colocar o produto na água.' }
    ],
    alerts: ['Mantenha o produto fora do alcance de crianças e não transfira para garrafa de bebida.', 'Depois de conferir o produto, volte ao guia “Água com hipoclorito” para ver as gotas e o tempo de espera.'],
    sourceLabel: 'Cuidados com a água — Ministério da Saúde',
    sourceUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/e/enchentes/cuidados-com-a-agua'
  },
  {
    id: 'safe-water-boil',
    category: 'home-care',
    title: 'Água segura para beber — filtrar e ferver',
    shortTitle: 'Água por fervura',
    summary: 'Alternativa do Ministério da Saúde para quando não há hipoclorito a 2,5%.',
    image: assetUrl('treatment-guides/safe-water-boil-steps.webp'),
    steps: [
      { title: 'Coe ou filtre', detail: 'Use filtro doméstico, coador de papel ou pano limpo.' },
      { title: 'Espere começar a ferver', detail: 'Leve a água filtrada ao fogo e observe quando a fervura começar.' },
      { title: 'Conte 5 minutos', detail: 'Depois que começar a ferver, mantenha a fervura por 5 minutos.' },
      { title: 'Desligue e deixe esfriar', detail: 'Tampe e espere esfriar naturalmente. Não coloque gelo nem toque na água quente.' },
      { title: 'Guarde protegida', detail: 'Passe para recipiente limpo e tampado antes de beber.' }
    ],
    alerts: ['Este é o caminho para quando não há hipoclorito a 2,5%. Não misture os dois métodos na mesma água.', 'Tenha cuidado com fogo, vapor e panela quente.'],
    sourceLabel: 'Cuidados com a água — Ministério da Saúde',
    sourceUrl: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/e/enchentes/cuidados-com-a-agua'
  },
  {
    id: 'urgent-warning-signs',
    category: 'safety',
    title: 'Sinais de alerta — procure ajuda sem demora',
    shortTitle: 'Quando pedir ajuda',
    summary: 'Falta de ar grave, desmaio ou convulsão e perda súbita da visão precisam de atendimento urgente.',
    image: assetUrl('treatment-guides/urgent-warning-signs.webp'),
    steps: [
      { title: 'Respiração muito difícil', detail: 'Procure ajuda se a pessoa não consegue falar, fica muito sonolenta, desmaia ou apresenta lábios arroxeados.' },
      { title: 'Hipoglicemia grave', detail: 'Confusão intensa, convulsão ou perda de consciência precisam de atendimento imediato.' },
      { title: 'Problema grave no olho', detail: 'Perda súbita da visão, dor intensa, trauma ou produto químico no olho são sinais de urgência.' },
      { title: 'Ligue 192 ou vá à urgência', detail: 'Acione o SAMU 192 quando houver risco imediato ou siga o fluxo de urgência orientado no seu município.' }
    ],
    alerts: ['Pessoa inconsciente ou convulsionando: não dê comida, bebida ou medicamento pela boca.', 'Este guia ajuda a reconhecer perigo; ele não substitui avaliação profissional.'],
    sourceLabel: 'Protocolos públicos de urgência — SUS',
    sourceUrl: 'https://www.saude.df.gov.br/documents/37101/0/Protocolos%2Bde%2BRegula%C3%A7%C3%A3o%2BM%C3%A9dica%2Bde%2BUrg%C3%AAncia%2Bdo%2BSAMU-%2BDF%2B192%2Be%2BCrit%C3%A9rios%2BM%C3%A9dicos%2Bde%2BDespacho%2Bde%2BViaturas%2BCM.pdf/10e76074-d445-7a0a-a6d8-2a7f65d4d91f?t=1717432207776'
  }
]);

const guideById = new Map(treatmentGuides.map((guide) => [guide.id, guide]));

export function getTreatmentGuide(id) {
  return guideById.get(id) || treatmentGuides[0];
}

export function treatmentGuidesFor(category = 'all', query = '') {
  const normalized = String(query || '').trim().toLocaleLowerCase('pt-BR');
  return treatmentGuides.filter((guide) => {
    if (category !== 'all' && guide.category !== category) return false;
    if (!normalized) return true;
    const text = [guide.title, guide.summary, ...guide.steps.flatMap((step) => [step.title, step.detail])].join(' ').toLocaleLowerCase('pt-BR');
    return text.includes(normalized);
  });
}
