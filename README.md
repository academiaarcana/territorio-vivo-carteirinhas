# Território Vivo — Carteirinhas da UBS

Aplicação web simples para preencher, visualizar e imprimir carteirinhas da Atenção Primária em papel A4.

## Primeira versão

O protótipo inicial contém a carteirinha **“Minha ACS e Minha Equipe”** com:

- preenchimento dos dados da ACS, microárea e contato;
- dados da UBS e da Equipe 02;
- profissionais de referência;
- visualização da frente e do verso;
- impressão de **2 ou 4 unidades por folha A4**;
- **modo econômico de toner**;
- **modo leitura fácil**;
- salvamento opcional dos dados da equipe apenas no dispositivo;
- nenhuma base de dados de pacientes.

## Privacidade

A aplicação foi pensada para não criar um prontuário paralelo. Nesta versão, os dados digitados não são enviados para servidor. O navegador só grava os dados da equipe quando o usuário escolhe explicitamente a opção de salvar no dispositivo.

## Como testar

Abra `index.html` em um navegador ou publique a pasta como site estático, por exemplo com GitHub Pages.

Para testar a impressão:

1. Preencha os campos.
2. Escolha 2 ou 4 carteirinhas por A4.
3. Ative, se necessário, o modo econômico ou leitura fácil.
4. Clique em **Imprimir frente** ou **Imprimir verso**.
5. Na janela da impressora, mantenha o papel A4 e a escala em 100% sempre que possível.

## Próximos modelos planejados

- Bem-vindo ao Meu Território
- O que Mudou no Território?
- Quem Precisa de um Olhar Prioritário?
- Risco, Recurso ou Potencialidade?
- Nota Rápida do ACS
- Guia de Bolso — 5 Minutos do Território
- Decisão dos 5 Minutos
- Indicadores da Microárea
- Indicadores da Equipe
- Sistema × Território

## Diretrizes do projeto

- sempre imprimir em papel A4;
- funcionar bem em preto e branco e impressora a toner;
- não depender de cor para transmitir informação;
- prever versões de leitura fácil para pessoas com baixa escolaridade ou dificuldade de compreensão;
- evitar excesso de texto e siglas;
- usar ícones simples e campos grandes;
- evitar dados clínicos ou sociais sensíveis em materiais entregues às famílias;
- oferecer versões econômicas para períodos de escassez de papel ou toner.
