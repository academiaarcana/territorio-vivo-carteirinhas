# Integração segura com a prescrição do PEC

## Decisão adotada

O **PEC e-SUS APS continua sendo o sistema oficial para prescrever, assinar e emitir a receita**. O Território Vivo não substitui a prescrição digital, não assina receitas e não consulta diretamente o banco do PEC.

O gerador do Território Vivo produz somente uma **folha complementar de orientação visual**, sempre revisada pela(o) médica(o) ou enfermeira(o) responsável. A receita original emitida no PEC deve acompanhar essa folha.

## Fluxo autorizado na versão atual

1. A(o) profissional emite e confere a prescrição no PEC.
2. Se necessário, copia apenas a linha de medicamento e posologia para o campo temporário do Território Vivo.
3. Não copia nome, CPF, CNS, endereço, diagnóstico, número do prontuário ou outro identificador da pessoa.
4. Preenche manualmente medicamento, dose, via, frequência, duração e observações.
5. Seleciona os pictogramas compatíveis com o texto e faz a conferência clínica item a item.
6. Imprime ou baixa a folha complementar e a entrega junto da receita original.
7. Apaga o rascunho ou fecha a aba. O conteúdo não é enviado ao Supabase nem armazenado no navegador.

## Por que não haverá importação automática nesta fase

O manual oficial do PEC documenta a emissão em papel ou a geração de prescrição digital assinada, com envio ao cidadão e validação própria. Não foi identificada uma API pública oficial específica para um sistema externo extrair o conteúdo clínico de prescrições já emitidas.

As integrações gerais do e-SUS APS por Apache Thrift, XML e LEDI possuem governança própria e não devem ser tratadas como autorização para consultar prontuário ou copiar prescrições. Qualquer integração futura dependerá de:

- autorização formal da gestão municipal e do responsável técnico pelo e-SUS APS;
- documentação oficial aplicável à versão instalada do PEC;
- finalidade, base legal, perfis de acesso, logs, retenção e resposta a incidentes definidos;
- ambiente de homologação separado da produção;
- revisão de segurança, privacidade e responsabilidade clínica;
- validação de que somente o mínimo necessário circula entre os sistemas.

## Evolução futura permitida

Uma futura importação poderá aceitar um **formato estruturado oficialmente fornecido pelo PEC**, caso esse recurso seja documentado e autorizado. Até lá, a única entrada aceita é a transcrição mínima e temporária feita pela(o) profissional, sem interpretação automática.

Não serão adotados:

- acesso direto às tabelas internas do banco do PEC;
- captura de sessão, senha, token ou cookie do PEC;
- OCR automático de receitas como fonte clínica definitiva;
- envio de receita ou dados pessoais ao Supabase, Google Cloud ou serviços de IA;
- sugestão automática de medicamento, dose, via, frequência ou duração.

## Fontes oficiais

- Ministério da Saúde — Manual do PEC, capítulo Atendimentos: https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/PEC/PEC_06_atendimentos/
- Ministério da Saúde — Manual do PEC, Administração e configurações da prescrição digital: https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/PEC/PEC_03_adm_conf/
- Ministério da Saúde — Manual de implantação do e-SUS APS: https://sisaps.saude.gov.br/sistemas/esusaps/docs/manual/PEC/PEC_01_implantacao/

