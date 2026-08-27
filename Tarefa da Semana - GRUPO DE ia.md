


## GRUPO DE ESTUDO EM IA – TAREFA DA SEMANA
## Página
## 1

Tarefa da Semana
1 Especificação Técnica de Projeto de Desenvolvimento: Sistema FluxFin
## Objetivo Geral:
Desenvolvimento de uma aplicação web voltada ao controle financeiro e gestão orçamentária
de projetos de pesquisa, desenvolvimento e inovação (P&D+I), com foco no cumprimento das
exigências  normativas  e  estruturais  dos  projetos  regulados  pela  ANEEL.  A  aplicação  será
denominada FluxFin.
O trabalho deverá ser executado de forma colaborativa, exigindo o versionamento adequado
do  código  e  a  divisão  equilibrada  das  frentes  de  trabalho  (frontend,  backend/integração  e
modelagem de banco de dados).

2 Escopo Tecnológico (Stack)
A arquitetura do sistema deverá ser fundamentada nas seguintes tecnologias:
- Linguagens e Estruturação: HTML5, CSS3, JavaScript e TypeScript.
- Frontend: React (recomenda-se a utilização de um framework como Next.js ou Vite
para otimização da compilação e roteamento).
- Banco  de  Dados: PostgreSQL,  obrigatoriamente  hospedado  na  plataforma Neon
(Serverless Postgres).
- Hospedagem e Deploy: O deploy da aplicação (frontend e funções de backend/API)
deverá ser realizado na plataforma Vercel.
3 Requisitos Funcionais (RF)
- RF01 - Autenticação e Controle de Acesso: O sistema deve possuir uma tela de
login segura para restringir o acesso apenas a usuários autorizados (pesquisadores e
gestores do projeto).
- RF02 - Interface  de  Abertura  (Splashscreen): Ao  iniciar  o  carregamento  da
aplicação, o usuário deve ser apresentado a uma splashscreen com alto apelo visual e
design  responsivo,  contendo  o  logotipo  ou  tipografia  do FluxFin,  antes  de  ser
redirecionado ao painel principal.
- RF03 - Cadastro e Parametrização de Projetos: Módulo para inserção de novos
projetos. A tabela de cadastro de projetos deve conter, no mínimo:
o Título e código do projeto.
o Datas estabelecidas de Início e Término.
o Orçamento global e alocação orçamentária inicial distribuída por rubricas.

- RF04 - Estruturação   Orçamentária   (Rubricas   ANEEL): O   sistema   deve
categorizar os recursos de acordo com as rubricas padronizadas para projetos de P&D
da ANEEL. São elas:
o Recursos Humanos (RH)
o Serviços de Terceiros
o Materiais de Consumo
o Materiais Permanentes e Equipamentos
o Viagens e Diárias
o Custos Administrativos / Outras Despesas
- RF05 - Execução  Financeira  (Lançamento  de  Despesas): Interface  para  o
lançamento  contínuo  de  despesas,  exigindo  a  vinculação  obrigatória  a  um  projeto
específico, a uma rubrica correspondente, data da ocorrência e valor.



## GRUPO DE ESTUDO EM IA – TAREFA DA SEMANA
## Página
## 2

- RF06 - Motor   de   Cálculo   e   Fluxo   de   Caixa: O   sistema   deve   calcular
automaticamente, em tempo real, os saldos atualizados. Deve apresentar uma visão
de  fluxo  de  caixa  (entradas  e  saídas  no  tempo)  e  um  demonstrativo  de  saldo
remanescente por rubrica para cada projeto.
- RF07 - Geração  de  Relatórios: Capacidade  de  consolidar  os  dados  financeiros  e
exportá-los no formato PDF, gerando um relatório gerencial pronto para prestação de
contas.
4 Diretrizes de Modelagem de Dados
Para garantir a consistência das informações no PostgreSQL (Neon), a modelagem relacional
mínima deve contemplar as seguintes entidades e suas inter-relações:
- Usuários: (id, nome, email, senha_hash, nivel_acesso).
- Projetos: (id, nome, descricao, data_inicio, data_termino, orcamento_total).
- Rubricas: (id, codigo_aneel, descricao).
- Orcamento_Rubrica: Tabela  associativa  definindo  o  limite  de  gasto  por  rubrica
dentro de um projeto (id_projeto, id_rubrica, valor_previsto).
- Despesas: (id,  id_projeto, id_rubrica,  data_despesa,  valor_executado,  descricao,
comprovante_url).
5 Metodologia de Trabalho e Entregáveis
Os senhores atuarão em conjunto. O projeto exige a aplicação de boas práticas de Engenharia
de Software, incluindo:
- Segurança  de  Dados: As  credenciais  do  banco  de  dados  (Neon)  jamais  devem  ser
expostas  no  código do frontend.  Recomenda-se  a  criação  de  rotas  de API  (Serverless
Functions na Vercel) para intermediar a comunicação com o banco.
- Design UI/UX: A interface deve ser limpa, responsiva e adequada ao uso corporativo
e acadêmico.
Fases de Entrega:
- Fase  1  (Modelagem  e  Infraestrutura): Criação  do  repositório,  configuração  do
ambiente  na  Vercel  e  instanciação  do  banco  de  dados  na  Neon  com  a  criação  das
tabelas.
- Fase 2 (Autenticação e Cadastros): Implementação do Login, da Splashscreen e do
módulo de cadastro de projetos e orçamentos.
- Fase  3  (Lançamentos  e  Lógica  Financeira): Implementação  da  entrada  de
despesas e da rotina de cálculo do fluxo de caixa.
- Fase 4 (Relatórios e Finalização): Desenvolvimento da rotina de exportação para
PDF e ajustes finais de interface.

Mãos à obra.