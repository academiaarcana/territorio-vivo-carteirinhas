export const registrationGuide = {
  reviewedOn: '2026-08-27',
  title: 'Como preencher o cadastro',
  summary: 'Guia de apoio para compreender as sete etapas regulares do cadastro do cidadão, a oitava etapa condicional e conduzir perguntas com respeito, clareza e sem suposições.',
  sources: [
    {
      label: 'Ministério da Saúde — Manual e-SUS Território: Cadastro da Atenção Primária à Saúde',
      url: 'https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/TERRITORIO/territorio_03/'
    },
    {
      label: 'Ministério da Saúde — Manual e-SUS APS 2026: Cadastro Individual e conceitos dos campos',
      url: 'https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/PEC/PEC_07_cds/'
    },
    {
      label: 'Ministério da Saúde — Nota Técnica nº 21/2024: orientação sexual e identidade de gênero',
      url: 'https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/notas-tecnicas/2024/nota-tecnica-no-21-2024-caeq-cgesco-desco-saps-ms.pdf'
    },
    {
      label: 'Ministério da Saúde — Nota Técnica nº 10/2026: cuidado integral à população LGBTIA+ na APS',
      url: 'https://www.gov.br/saude/pt-br/composicao/saps/notas-tecnicas-e-informativas/nota-tecnica-no-10-2026-cgaeq-desf-saps-ms'
    }
  ],
  dimensions: [
    {
      title: 'Imóvel',
      purpose: 'Registra o endereço, o tipo de imóvel e as condições de moradia apresentadas pelo aplicativo.',
      guidance: 'Confirme as respostas com a pessoa responsável. Não complete por aparência ou por informação antiga da equipe.'
    },
    {
      title: 'Território',
      purpose: 'Relaciona o imóvel ao espaço acompanhado pela equipe e permite indicar sua posição aproximada no mapa.',
      guidance: 'Use a localização somente conforme o fluxo do aplicativo e com a autorização necessária no dispositivo.'
    },
    {
      title: 'Família',
      purpose: 'Organiza o núcleo familiar e sua vinculação ao imóvel.',
      guidance: 'Confirme responsável familiar, renda, número de membros e desde quando a família reside no local, conforme os campos exibidos na versão instalada.'
    },
    {
      title: 'Cidadão',
      purpose: 'Registra identificação, informações sociodemográficas, condições de saúde e situação socioeconômica.',
      guidance: 'Explique por que as perguntas são feitas, pergunte diretamente e registre a resposta declarada pela própria pessoa.'
    }
  ],
  citizenSteps: [
    {
      number: 1,
      title: 'Identificação — parte 1',
      what: 'Identificação principal e vínculo com a família.',
      how: 'Confirme CPF ou CNS e se a pessoa é responsável familiar. O manual informa que CPF ou CNS é obrigatório nesta etapa.'
    },
    {
      number: 2,
      title: 'Identificação — parte 2',
      what: 'Demais dados pessoais e de contato exibidos pelo aplicativo.',
      how: 'Pergunte e confira cada informação. Use o nome social quando informado pela pessoa e não substitua pela sua própria interpretação.'
    },
    {
      number: 3,
      title: 'Informações sociodemográficas — parte 1',
      what: 'Características sociais e demográficas previstas no cadastro.',
      how: 'Leia as opções como aparecem na versão instalada e registre somente o que a pessoa informar.'
    },
    {
      number: 4,
      title: 'Informações sociodemográficas — parte 2',
      what: 'Inclui os campos de orientação sexual e identidade de gênero.',
      how: 'Solicite as duas informações de forma respeitosa e separada. O preenchimento deve respeitar a autodeclaração.'
    },
    {
      number: 5,
      title: 'Condições de saúde — parte 1',
      what: 'Perguntas sobre condições ou situações de saúde.',
      how: 'Faça a pergunta indicada no aplicativo e marque “sim” ou “não” conforme a resposta. Não transforme suspeita em diagnóstico.'
    },
    {
      number: 6,
      title: 'Condições de saúde — parte 2',
      what: 'Continuação das condições de saúde e deficiência.',
      how: 'Registre apenas informações confirmadas. A opção de TEA deve ser usada quando houver diagnóstico confirmado por avaliação profissional.'
    },
    {
      number: 7,
      title: 'Informações socioeconômicas',
      what: 'Situações sociais, econômicas e perguntas de insegurança alimentar previstas no cadastro.',
      how: 'Faça as perguntas exatamente como apresentadas, sem julgamento, e registre a resposta da pessoa.'
    },
    {
      number: 8,
      title: 'Situação de rua — quando aplicável',
      what: 'Etapa adicional exibida quando a situação de moradia for “situação de rua”.',
      how: 'Preencha somente quando o aplicativo apresentar esta etapa e siga as perguntas específicas mostradas na tela.'
    }
  ],
  concepts: [
    {
      term: 'Orientação sexual',
      definition: 'Diz respeito à atração afetiva e/ou sexual que a pessoa reconhece em si. É diferente de identidade de gênero.',
      options: 'Heterossexual, gay, lésbica, bissexual, assexual, pansexual ou outro, conforme autodeclaração.'
    },
    {
      term: 'Identidade de gênero',
      definition: 'É como a pessoa se reconhece em relação ao gênero. Não deve ser deduzida pela aparência, pelo nome ou pelo documento.',
      options: 'Homem cisgênero, mulher cisgênero, homem transgênero, mulher transgênero, travesti, não binário ou outro, conforme autodeclaração.'
    },
    {
      term: 'Pessoa cisgênero',
      definition: 'Pessoa cuja identidade de gênero corresponde ao sexo que lhe foi atribuído ao nascer.',
      options: 'Exemplo: uma pessoa registrada como do sexo feminino ao nascer que se reconhece como mulher.'
    },
    {
      term: 'Pessoa transgênero',
      definition: 'Pessoa cuja identidade de gênero não corresponde ao sexo que lhe foi atribuído ao nascer.',
      options: 'Homem trans e mulher trans são identidades de gênero; não são orientações sexuais.'
    },
    {
      term: 'Travesti',
      definition: 'Identidade de gênero autodeclarada. O termo deve ser usado com respeito quando a própria pessoa assim se identificar.',
      options: 'Não substitua por outra categoria e não trate a identidade como diagnóstico.'
    },
    {
      term: 'Pessoa não binária',
      definition: 'Pessoa que não se reconhece exclusivamente como homem ou exclusivamente como mulher.',
      options: 'Registre a opção apresentada pelo sistema conforme a autodeclaração.'
    },
    {
      term: 'Nome social',
      definition: 'Nome pelo qual a pessoa deseja ser chamada e reconhecida socialmente.',
      options: 'Pergunte como a pessoa deseja ser chamada e use esse nome no atendimento, conforme o fluxo do serviço.'
    },
    {
      term: 'Direito de não informar',
      definition: 'O sistema exige que a pergunta seja apresentada, mas a pessoa pode escolher não declarar orientação sexual ou identidade de gênero.',
      options: 'Quando a resposta for “não”, registre essa escolha no campo “Deseja informar?”. Nunca complete a categoria por suposição.'
    }
  ],
  sampleQuestions: [
    {
      title: 'Nome e pronome',
      question: 'Como você gostaria que eu te chamasse? Você possui nome social? Quais pronomes devemos usar?'
    },
    {
      title: 'Identidade de gênero',
      question: 'Você deseja informar sua identidade de gênero? Se sim: com qual gênero você se identifica?'
    },
    {
      title: 'Orientação sexual',
      question: 'Você deseja informar sua orientação sexual? Se sim: qual das opções apresentadas representa como você se identifica?'
    }
  ],
  conversationSteps: [
    'Explique que as perguntas fazem parte do cadastro da Atenção Primária e ajudam a equipe a planejar um cuidado mais adequado.',
    'Faça a pergunta para todas as pessoas quando o campo for apresentado, sem selecionar quem “parece” precisar responder.',
    'Pergunte orientação sexual e identidade de gênero separadamente, porque são informações diferentes.',
    'Leia as alternativas da versão instalada e aguarde a autodeclaração da pessoa. Se ela não desejar informar, registre essa escolha sem insistir.',
    'Se a pessoa não compreender um termo, explique de forma simples, sem conduzir a resposta.',
    'Mantenha tom de voz respeitoso e evite expor a resposta diante de familiares, vizinhos ou outras pessoas.'
  ],
  avoid: [
    'Não inferir a resposta pela aparência, pelo nome, pela voz, pelo documento ou por quem acompanha a pessoa.',
    'Não confundir orientação sexual com identidade de gênero.',
    'Não corrigir, discutir ou questionar a identidade declarada.',
    'Não marcar “outro” por conveniência: a Nota Técnica orienta usar essa opção apenas quando a autodeclaração for diferente das alternativas apresentadas.',
    'Não registrar informação inventada para concluir o cadastro.',
    'Não copiar dados deste guia para fora do e-SUS APS: esta página é educativa e não é prontuário.'
  ]
};
