# Homologação do Território Vivo

## Estado técnico

- Frontend estático publicado por GitHub Pages.
- Supabase dedicado ao Território Vivo.
- Catálogo multiunidade: município → unidade/ponto → equipe → microárea → profissional.
- RLS ativo em perfis, municípios, unidades e equipes.
- Conta master definida no banco para `macedotaynara@outlook.com`.
- Vercel desativada para este repositório por `vercel.json`; isso não afeta outros projetos da conta.
- Dados temporários das carteirinhas não são persistidos por padrão.
- Página pública com apresentação, unidades, entrar e criar conta.

## 1. Configuração manual obrigatória no Supabase

No Dashboard do projeto `territorio-vivo-carteirinhas`, abrir:

**Authentication → URL Configuration**

Usar como Site URL:

`https://academiaarcana.github.io/territorio-vivo-carteirinhas/`

Adicionar também o mesmo endereço em **Redirect URLs**.

Essa etapa é necessária para confirmação de e-mail e recuperação de senha retornarem ao site publicado.

## 2. Primeiro acesso master

Na página pública, escolher **Criar conta** e cadastrar o e-mail:

`macedotaynara@outlook.com`

A senha deve ser criada pela própria titular. Município, unidade, equipe e microárea são opcionais para a conta master.

O banco força automaticamente o papel `admin` apenas para esse e-mail.

## 3. Teste com uma ACS da Equipe 02

1. Criar uma conta individual.
2. Selecionar Pimenta Bueno.
3. Selecionar UBS Madre Tereza de Calcutá.
4. Selecionar Equipe 02.
5. Informar a microárea.
6. Confirmar o e-mail, se solicitado.
7. Entrar no sistema.
8. Completar o perfil profissional.
9. Gerar uma carteirinha.
10. Baixar PDF e imprimir uma folha A4.
11. Abrir os 5 minutos do território.
12. Abrir os indicadores.
13. Imprimir um material de educação em saúde.

## 4. Teste da conta master

- Conferir se o perfil da ACS aparece em Gestão da equipe.
- Confirmar unidade, equipe e microárea.
- Editar apenas dados profissionais/institucionais.
- Criar novas equipes quando a unidade informar a composição atual.
- Não cadastrar informações de pacientes no painel master.

## 5. Regra para expansão da rede

Dados públicos relativamente estáveis podem entrar no catálogo com fonte e data de consulta: nome institucional, CNES, endereço, telefone e referência territorial.

Equipe, INE, profissionais e lotação só devem ser marcados como **confirmados** quando houver validação atual da própria rede ou fonte oficial suficientemente recente.

## 6. Critério de liberação

O sistema pode ser divulgado para outras equipes depois que os quatro fluxos abaixo funcionarem sem erro:

- criar conta;
- entrar/recuperar senha;
- salvar perfil por unidade/equipe/microárea;
- gerar PDF/impressão.

O objetivo da homologação é avaliar a ferramenta, não o trabalhador.
