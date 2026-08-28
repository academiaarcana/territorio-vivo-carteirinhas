# Território Vivo — Atenção Primária

Aplicação web para apoiar **territorialização, carteirinhas, 5 minutos do território, indicadores, educação em saúde e gestão da rede** na Atenção Primária.

A aplicação nasceu a partir da UBS Madre Tereza de Calcutá / Equipe 02, em Pimenta Bueno/RO, e foi estruturada para uso por outras unidades, equipes e microáreas.

## Arquitetura V2

A versão 2 abandona o protótipo monolítico e usa módulos ES nativos, sem framework e sem processo de build obrigatório.

```text
index.html
config.js
src/
  main.js
  core/       # router, store, sessão e shell
  services/   # Supabase, autenticação e repositório de domínio
  data/       # modelos de carteirinhas e conteúdos
  pages/      # páginas/módulos da aplicação
  utils/      # impressão e PDF
  styles/     # CSS estrutural e impressão
scripts/      # validação automatizada
supabase/     # migrações do banco
```

A descrição detalhada está em `docs/ARQUITETURA_V2.md`. A matriz que determina o nível e as capacidades de cada conta está em `docs/CONTROLE_DE_ACESSO.md`.

## Hospedagem

- **Frontend:** GitHub Pages
- **Backend/Auth:** Supabase Free
- **Deploy de produção:** exclusivamente pelo workflow `.github/workflows/pages.yml`, a partir da `main`
- **Produção:** `https://territoriovivo.github.io/territorio-vivo-carteirinhas/`

O repositório não depende de configuração Vercel. A branch de desenvolvimento executa somente validação; publicação no GitHub Pages ocorre pela `main` depois das validações estruturais e do smoke test público do Supabase.

## Módulos

- Página pública da plataforma e catálogo de unidades;
- login, autocadastro e recuperação de senha;
- início/dashboard;
- território e rede;
- biblioteca de carteirinhas;
- 5 minutos do território;
- indicadores;
- educação em saúde;
- guia inclusivo de cadastro territorial;
- prescrições e receitas com apoio visual temporário para Médico/Enfermeiro;
- perfil profissional/territorial;
- aprovações e gestão por escopo para Administrador da UBS, Gestor Municipal e Master;
- gestão de microáreas e totais populacionais agregados.

## Modelo territorial

O vínculo principal é:

**Município → Unidade de saúde → Equipe → Microárea → Profissional**

Tabelas atuais do Supabase:

- `municipalities`;
- `health_units`;
- `teams`;
- `microareas`;
- `territory_points`;
- `profiles`.

Unidades podem vir de referência pública. Equipes e lotações profissionais devem ser confirmadas localmente, porque mudam com o tempo.

## Autenticação e permissões

Cada profissional cria a própria conta. O backend é a fonte de verdade para permissões.

- contas comuns recebem papel `acs`;
- Médico e Enfermeiro são perfis clínicos de menor privilégio, vinculados à UBS/equipe;
- o Administrador da UBS gerencia somente a própria unidade;
- o Gestor Municipal atua no escopo municipal;
- a conta master definida no banco recebe papel `admin`;
- o frontend **não permite escolher função**;
- `role` + `access_status` + vínculo territorial determinam o nível efetivo;
- combinações inválidas são negadas por padrão;
- RLS limita perfis comuns ao próprio perfil;
- ações administrativas dependem de políticas RLS;
- o campo `role` é protegido por trigger no banco.

## Privacidade

O Território Vivo **não é prontuário** e não deve criar um segundo cadastro de pacientes.

O Supabase guarda dados profissionais e institucionais necessários ao funcionamento. Campos usados nas carteirinhas, indicadores e notas rápidas são temporários por padrão e não são persistidos no banco.

O módulo Território/Mapa Inteligente foi desenhado para referências **não pessoais**: unidades, equipes, recursos institucionais e pontos territoriais sem identificação clínica individual.

## Carteirinhas

A biblioteca é declarativa em `src/data/cards.js`. Cada modelo define:

- categoria;
- título e objetivo;
- campos necessários;
- quantidade A4 sugerida;
- recado padrão.

O módulo suporta 2, 4, 8 ou 12 unidades por A4, leitura fácil, modo econômico, impressão e PDF.

## Educação em saúde

Conteúdos ficam em `src/data/education.js`, isolados do código da aplicação e acompanhados de fonte e data de revisão. A interface não deve misturar faixas/condutas de fontes diferentes sem identificação clara.

## Desenvolvimento

Não há dependências npm obrigatórias. O `package.json` existe para validação estrutural.

```bash
npm run check
```

O comando verifica:

- arquivos essenciais;
- imports relativos quebrados;
- referências ao legado no `index.html`;
- presença indevida de `service_role`;
- IDs duplicados de carteirinhas e conteúdos educativos.

O CI também executa `node --check` em todos os módulos, consulta o catálogo público real do Supabase e confirma que `profiles` e `territory_points` rejeitam acesso anônimo.

## Configuração

`config.js` contém somente configurações públicas de navegador. Nunca coloque `service_role`, senha do banco ou qualquer segredo no repositório.

Exemplo: `config.example.js`.

No Supabase, a URL de produção precisa estar autorizada em **Authentication → URL Configuration** para confirmação de e-mail e recuperação de senha.

## Diretrizes de produto

- registrar só o necessário;
- evitar burocracia paralela;
- transformar achado em decisão, ação e reavaliação;
- avaliar a ferramenta, não o trabalhador;
- imprimir bem em A4 e preto e branco;
- não depender de cor para transmitir significado;
- oferecer leitura fácil;
- manter dados clínicos/pessoais fora do mapa institucional.

## Estado da V2

A V2 está publicada na `main` e no GitHub Pages. A arquitetura modular, o Painel de Campo, os papéis territoriais, o Guia de Cadastro Inclusivo, o apoio visual a prescrições e a estrutura de microáreas foram integrados após CI e homologação.

| Área | Estado em 28/08/2026 |
|---|---|
| Auth, aprovação e papéis | Homologados |
| RLS, migrations e Advisors | Verificados |
| Painel de Campo no desktop | Aprovado em navegador autenticado |
| Guia de Cadastro Inclusivo | Publicado |
| Prescrições e receitas | Publicado; rascunho temporário, sem prontuário paralelo |
| Carteirinhas e PDF | Modelo simples validado em A4 real; modelo com pictogramas complexos aguarda inspeção humana |
| Correspondência dos pictogramas | Contratos cobrem plurais, serviços, preparos, 5 Minutos e Indicadores |
| Microáreas | Estrutura publicada; totais oficiais aguardam fonte e data de referência |
| Reflow em celular | Pendente de evidência em dispositivo real |
| Senhas vazadas do Supabase | Recurso posterior, dependente de plano Pro |

Não cadastrar totais populacionais por estimativa. Ausência de fonte oficial continua como `null`/“Não informado”.
