export interface RubricaFluxo {
  rubricaId: number;
  rubricaCodigo: string;
  rubricaDescricao: string;
  valorPrevisto: number;
  valorExecutado: number;
  saldo: number;
  percentual: number;
}

export interface MesFluxo {
  mes: string;
  entradas: number;
  saidas: number;
  entradasAcumuladas: number;
  saidasAcumuladas: number;
  saldoAcumulado: number;
}

export interface ProjetoFluxo {
  id: number;
  codigo: string;
  titulo: string;
  dataInicio: string;
  dataTermino: string;
  orcamentoGlobal: number;
  totalExecutado: number;
  saldoProjeto: number;
  percentualProjeto: number;
  rubricas: RubricaFluxo[];
  fluxoMensal: MesFluxo[];
}

export interface Fluxo {
  resumo: {
    qtdProjetos: number;
    orcamentoGlobal: number;
    totalExecutado: number;
    saldoGeral: number;
    percentualGlobal: number;
  };
  projetos: ProjetoFluxo[];
  fluxoConsolidado: MesFluxo[];
}