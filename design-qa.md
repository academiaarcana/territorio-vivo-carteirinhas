# Design QA — Painel de Campo e fluxos autenticados

## Estado da validação

- Data: 28/08/2026.
- Base das oito capturas autenticadas: versão publicada no GitHub Pages, commit `f9b1cc6fd0fc2afdcf8486f578f64a324022b7a2`.
- Versão pública atual após as correções de PDF e pictogramas: commit `374828d9c47abb0e85aa10aff823d8f90449dbea`.
- Sessão: perfil Enfermeira(o) ativo, vinculado à UBS Madre Tereza de Calcutá e à Equipe 02.
- Viewport real: 1348 × 926 px, densidade 1×.
- Dados clínicos: nenhum formulário foi preenchido; nenhuma receita, identificação pessoal ou diagnóstico foi inserido.
- Console: nenhuma mensagem de erro ou alerta originada pelo domínio do Território Vivo durante as capturas autenticadas.

## Evidências desktop

Foram capturadas, salvas e inspecionadas as seguintes rotas publicadas:

1. `#/app/inicio` — shell, vínculo territorial, papel e roteiro principal.
2. `#/app/territorio` — faixa territorial, filtros, métricas, estado vazio e formulário de achado.
3. `#/app/carteirinhas` — biblioteca, busca, categorias, cartões e declaração de não persistência.
4. `#/app/5-minutos` — roteiro em quatro movimentos, nota temporária e formulário sequencial.
5. `#/app/indicadores` — ciclo de leitura, números disponíveis, interpretação e declarações de rascunho temporário.
6. `#/app/educacao` — guia de cadastro, biblioteca interna e materiais educativos.
7. `#/app/guia-cadastro` — limites do material e primeiras dimensões do cadastro territorial.
8. `#/app/prescricoes` — restrição por papel, fronteira de privacidade, colagem opcional do PEC e prévia de adesivos.

As oito capturas mostraram conteúdo estável, sem tela em branco, carregamento interrompido, parede de login, modal indevido ou erro de renderização.

## Evidência complementar de PDF

O modelo **Minha ACS e Minha Equipe** foi gerado no site público em uma sessão autenticada de Enfermeira(o), sem nome de cidadão, receita, diagnóstico ou outro dado clínico. A primeira inspeção real identificou que a instrução interna do editor aparecia indevidamente nas quatro posições da folha. A separação entre prévia vazia e conteúdo imprimível foi corrigida no PR #15.

Depois da publicação do commit `0c07302ac0ba54ea5bd9aeac23618ef28559a299`, o mesmo PDF foi baixado, renderizado em PNG e inspecionado novamente:

- formato A4 e uma única página;
- grade 2 × 2 com quatro carteirinhas;
- nenhuma instrução interna do editor no material final;
- nenhum corte, sobreposição ou estouro da folha;
- título, UBS, equipe, referência profissional e rodapé legíveis.

O PR #16 ampliou a correspondência automatizada dos pictogramas e corrigiu os termos reais no plural usados pelo produto: **Famílias**, **Pessoas idosas**, **Gestantes** e **Equipe**. O contrato também cobre data, hora, UBS, serviços, preparos, avisos, 5 Minutos e Indicadores.

A inspeção humana do modelo **Meu Próximo Atendimento** preenchido com data, hora, serviço e preparos continua pendente. A sessão autenticada expirou antes dessa prova e nenhuma senha foi solicitada ou manipulada. Contrato automatizado aprovado não deve ser apresentado como substituto dessa inspeção visual.

## Resultado visual desktop

- **P0:** nenhum problema bloqueador observado.
- **P1:** nenhum problema grave de hierarquia, corte, sobreposição ou navegação observado no viewport auditado.
- **P2:** telas de trabalho extensas dependem de rolagem para alcançar todos os campos e ações; isso é esperado, mas deve ser reavaliado no celular para evitar excesso de densidade.
- O shell mantém navegação lateral, identificação de UBS/equipe/papel e ação de saída de forma consistente.
- Títulos, faixas introdutórias, ações primárias, cartões e estados vazios apresentam hierarquia legível.
- As declarações de privacidade e não persistência aparecem antes dos campos temporários nas superfícies correspondentes.
- Educação e Guia de Cadastro apresentam o conteúdo inclusivo sem coletar respostas do cidadão.
- Prescrições comunica que o apoio visual é complementar, temporário e exclusivo para Médico/Enfermeiro ativo.

## Acessibilidade: evidência e limites

Pelas capturas, há contraste visual consistente, indicação clara do item ativo no menu, títulos hierárquicos e botões distinguíveis de texto comum. Capturas não comprovam navegação por teclado, ordem de foco, nomes acessíveis, leitura por tecnologia assistiva, zoom, redução de movimento, alvos de toque ou contraste calculado. Esses pontos continuam cobertos pelos contratos automatizados, mas ainda exigem homologação humana quando houver dispositivo adequado.

## Verificações técnicas já concluídas

- `npm run check --offline`: aprovado integralmente no commit público `374828d9c47abb0e85aa10aff823d8f90449dbea`.
- Contratos de Território, Carteirinhas, 5 Minutos, Indicadores, Educação e papéis clínicos: aprovados.
- Sintaxe, arquitetura, segurança, migrations, Auth, papéis, concorrência, coordenadas, impressão e PDF: aprovados.
- Migration de papéis clínicos: `20260827001020 — add_clinical_professional_roles`.
- Migration territorial: `20260827180933 — add_microareas_and_population_counts`.
- Tabela `microareas`: criada com RLS e políticas verificadas; totais populacionais oficiais continuam sem preenchimento até recebimento de fonte e data de referência.

## Pendência móvel

O navegador autenticado disponível para esta auditoria não oferece alteração real de viewport nem emulação de dispositivo. Recortar a captura desktop não produz reflow e não seria evidência válida. A validação em celular permanece pendente e deve cobrir, no mínimo:

- menu e saída da conta;
- empilhamento de faixas, cartões, filtros e formulários;
- rolagem horizontal involuntária;
- legibilidade e alvos de toque;
- editor e prévia de Carteirinhas;
- formulários de 5 Minutos, Indicadores e Prescrições;
- Guia de Cadastro e aba Microáreas da gestão.

final result: desktop approved; simple PDF approved; complex pictogram PDF pending; mobile pending

## QA específica — ícones do menu lateral

- Data: 28/08/2026.
- Referências: captura do menu atual do Território Vivo e capturas desktop/menu do PEC fornecidas pela autora.
- Escopo: somente navegação autenticada; rotas, papéis, permissões e conteúdo das páginas permaneceram inalterados.
- Decisão: adaptar a área regular, o alinhamento e a diferenciação funcional observados no PEC, preservando a barra azul e os pictogramas gratuitos com atribuição já adotados pelo Território Vivo.
- Comparação desktop: referência e implementação foram inspecionadas juntas no navegador em uma única entrada visual.
- Comparação responsiva: reflow real da aplicação em quadro de 390 × 844 px, sem simular conteúdo por recorte de screenshot.
- Medidas verificadas: botões com 49,44 px de altura; caixas de pictograma com 34 × 34 px; mesma coordenada inicial em todos os itens; nenhum texto ou item com overflow.
- Semântica corrigida: **Carteirinhas** usa cartão de saúde; **Objetivo e tutorial** usa documento/guia.
- Estado ativo, hover e foco mantêm diferenciação por forma, contraste e contorno; a cor não é o único sinal.
- Os dez pictogramas do perfil Master carregaram com largura natural de 512 px; nenhum placeholder ou emoji foi usado.

### Resultado desta alteração

- **P0:** nenhum bloqueador.
- **P1:** nenhum corte, desalinhamento, ícone ausente ou perda de navegação.
- **P2:** nenhum problema visual remanescente dentro do escopo do menu; a auditoria móvel completa das demais páginas continua com o status geral acima.

final result: passed — menu lateral desktop e reflow responsivo de 390 px
