import { jsPDF } from "jspdf";
import autoTable, { type CellDef } from "jspdf-autotable";
import type { Fluxo } from "./fluxo";
import {
  formatBRL,
  dataAtualPorExtenso,
  formatData,
  mesCurto,
} from "./format";

const COR_PRIMARIA: [number, number, number] = [13, 148, 136];
const COR_PRIMARIA_ESCURA: [number, number, number] = [10, 126, 116];
const COR_CINZA: [number, number, number] = [120, 124, 130];
const COR_NEGATIVO_TEXTO: [number, number, number] = [194, 65, 12];
const COR_NEGATIVO_FUNDO: [number, number, number] = [255, 237, 213];

const MARGEM = 14;
const LARGURA_UTIL = 210 - MARGEM * 2;

type DocPDF = Parameters<typeof autoTable>[0];

const cel = (content: string, valor: number) =>
  ({ content, raw: valor }) as unknown as CellDef;

const valorBruto = (data: { cell: { raw: unknown } }) =>
  (data.cell.raw as unknown as { raw?: number } | undefined)?.raw;

const vazioAjustado = (doc: DocPDF, y: number) => {
  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 0;
  return finalY > 0 ? finalY + 4 : y;
};

function desenharCabecalho(
  doc: DocPDF,
  titulo: string,
  subtitulo: string,
  logoDataUrl: string | null
) {
  const largura = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COR_PRIMARIA);
  doc.rect(0, 0, largura, 26, "F");
  doc.setFillColor(...COR_PRIMARIA_ESCURA);
  doc.rect(0, 26, largura, 0.8, "F");

  if (logoDataUrl) {
    try {
      const logoLargura = 36;
      const logoAltura = 12;
      const cabecalhoAltura = 26;
      const logoY = (cabecalhoAltura - logoAltura) / 2;
      doc.addImage(
        logoDataUrl,
        "PNG",
        largura - MARGEM - logoLargura,
        logoY,
        logoLargura,
        logoAltura
      );
    } catch {
      // logo é opcional; segue sem ele
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FluxFin", MARGEM, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(titulo, 44, 11, { maxWidth: largura - MARGEM - 44 - 20 });

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(subtitulo, MARGEM, 19, { maxWidth: largura - MARGEM * 2 });
}

function tituloSecao(doc: DocPDF, texto: string, y: number) {
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COR_PRIMARIA_ESCURA);
  doc.text(texto, MARGEM, y);
  doc.setDrawColor(...COR_PRIMARIA);
  doc.setLineWidth(0.4);
  doc.line(MARGEM, y + 2, 210 - MARGEM, y + 2);
  return y + 8;
}

function obterResumo(projetoId: number | null, fluxo: Fluxo) {
  if (projetoId) {
    const projeto = fluxo.projetos.find((p) => p.id === projetoId);

    if (projeto) {
      return {
        qtdProjetos: 1,
        orcamentoGlobal: projeto.orcamentoGlobal,
        totalExecutado: projeto.totalExecutado,
        saldoGeral: projeto.saldoProjeto,
        percentualGlobal: projeto.percentualProjeto,
      };
    }
  }

  return fluxo.resumo;
}

function obterSerieFluxo(projetoId: number | null, fluxo: Fluxo) {
  if (projetoId) {
    const projeto = fluxo.projetos.find((p) => p.id === projetoId);
    if (projeto) return projeto.fluxoMensal;
  }

  return fluxo.fluxoConsolidado;
}

export interface OpcoesRelatorio {
  fluxo: Fluxo;
  filtroProjetoId: number | null;
  nomeUsuario: string;
  logoDataUrl?: string | null;
}

export function gerarRelatorioPDF(opcoes: OpcoesRelatorio) {
  const doc = new jsPDF() as DocPDF;
  const largura = doc.internal.pageSize.getWidth();

  const titulo =
    "Relatório Gerencial de Prestação de Contas — FluxFin";
  const subtitulo = opcoes.filtroProjetoId
    ? "Demonstrativo de execução financeira do projeto selecionado"
    : "Consolidação financeira de todos os projetos P&D+I";

  desenharCabecalho(doc, titulo, subtitulo, opcoes.logoDataUrl ?? null);

  let y = 40;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 84, 88);
  doc.text(
    `${opcoes.filtroProjetoId ? `Projeto selecionado.` : "Abrange todos os projetos cadastrados."} Relatório gerencial consolidado em tempo real a partir das despesas lançadas e da alocação orçamentária por rubricas ANEEL.`,
    MARGEM,
    y,
    { maxWidth: LARGURA_UTIL }
  );
  doc.text(
    `Gerado em ${dataAtualPorExtenso()} por ${opcoes.nomeUsuario}.`,
    MARGEM,
    y + 5,
    { maxWidth: LARGURA_UTIL }
  );
  y += 12;

  const resumo = obterResumo(opcoes.filtroProjetoId, opcoes.fluxo);
  const serieFluxo = obterSerieFluxo(opcoes.filtroProjetoId, opcoes.fluxo);
  const projetos = opcoes.filtroProjetoId
    ? opcoes.fluxo.projetos.filter((p) => p.id === opcoes.filtroProjetoId)
    : opcoes.fluxo.projetos;

  y = tituloSecao(doc, "1. Resumo Geral", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGEM, right: MARGEM },
    head: [["Indicador", "Valor"]],
    body: [
      ["Total de projetos", resumo.qtdProjetos],
      ["Orçamento global", formatBRL(resumo.orcamentoGlobal)],
      [
        "Total executado",
        `${formatBRL(resumo.totalExecutado)} (${resumo.percentualGlobal.toFixed(1)}%)`,
      ],
      ["Saldo geral", cel(formatBRL(resumo.saldoGeral), resumo.saldoGeral)],
    ],
    columnStyles: {
      0: { cellWidth: 90, fontStyle: "bold", textColor: [55, 58, 62] },
      1: { cellWidth: 60, halign: "right" },
    },
    headStyles: { fillColor: COR_PRIMARIA, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    didParseCell: (data) => {
      const bruto = valorBruto(data);

      if (
        data.section === "body" &&
        data.column.index === 1 &&
        typeof bruto === "number" &&
        bruto < 0
      ) {
        data.cell.styles.textColor = COR_NEGATIVO_TEXTO;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = COR_NEGATIVO_FUNDO;
      }
    },
  });

  y = vazioAjustado(doc, y);

  y = tituloSecao(doc, "2. Demonstrativo de Saldo por Rubrica", y);

  for (const projeto of projetos) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 44, 48);
    doc.text(
      `${projeto.codigo} — ${projeto.titulo}`,
      MARGEM,
      y + 4
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COR_CINZA);
    doc.text(
      `Período: ${formatData(projeto.dataInicio)} a ${formatData(projeto.dataTermino)}   •   Orçamento: ${formatBRL(projeto.orcamentoGlobal)}   •   Executado: ${formatBRL(projeto.totalExecutado)}   •   Saldo: ${formatBRL(projeto.saldoProjeto)}`,
      MARGEM,
      y + 9,
      { maxWidth: LARGURA_UTIL }
    );

    const somar = (chave: keyof (typeof projeto.rubricas)[number]) =>
      projeto.rubricas.reduce((acc, r) => acc + Number(r[chave]), 0);

    const totalPrevisto = somar("valorPrevisto");
    const totalExecutado = somar("valorExecutado");
    const totalSaldo = totalPrevisto - totalExecutado;

    const totalPercentual =
      totalPrevisto > 0 ? (totalExecutado / totalPrevisto) * 100 : 0;

    autoTable(doc, {
      startY: y + 12,
      margin: { left: MARGEM, right: MARGEM },
      head: [["Código", "Rubrica (ANEEL)", "Previsto", "Executado", "Saldo", "% Exec."]],
      body: [
        ...projeto.rubricas.map((rubrica) => [
          rubrica.rubricaCodigo,
          rubrica.rubricaDescricao,
          formatBRL(rubrica.valorPrevisto),
          formatBRL(rubrica.valorExecutado),
          cel(formatBRL(rubrica.saldo), rubrica.saldo),
          `${rubrica.percentual.toFixed(1)}%`,
        ]),
        [
          "Total",
          "",
          formatBRL(totalPrevisto),
          formatBRL(totalExecutado),
          cel(formatBRL(totalSaldo), totalSaldo),
          `${totalPercentual.toFixed(1)}%`,
        ],
      ],
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 58 },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
        5: { cellWidth: 16, halign: "right" },
      },
      headStyles: { fillColor: COR_PRIMARIA, textColor: 255 },
      footStyles: { fillColor: [240, 242, 244], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2.5 },
      didParseCell: (data) => {
        const bruto = valorBruto(data);

        if (
          (data.section === "body" || data.section === "foot") &&
          data.column.index === 4 &&
          typeof bruto === "number" &&
          bruto < 0
        ) {
          data.cell.styles.textColor = COR_NEGATIVO_TEXTO;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = COR_NEGATIVO_FUNDO;
        }
      },
    });

    y = vazioAjustado(doc, y);
  }

  y = tituloSecao(doc, "3. Fluxo de Caixa Mensal", y + 6);

  if (serieFluxo.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COR_CINZA);
    doc.text("Não há período de fluxo para exibir.", MARGEM, y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGEM, right: MARGEM },
      head: [["Mês", "Entradas", "Saídas", "Previsto Acumulado", "Saldo Acumulado"]],
      body: serieFluxo.map((mes) => [
        mesCurto(mes.mes),
        formatBRL(mes.entradas),
        formatBRL(mes.saidas),
        formatBRL(mes.entradasAcumuladas),
        cel(formatBRL(mes.saldoAcumulado), mes.saldoAcumulado),
      ]),
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 34, halign: "right" },
        2: { cellWidth: 34, halign: "right" },
        3: { cellWidth: 42, halign: "right" },
        4: { cellWidth: 42, halign: "right" },
      },
      headStyles: { fillColor: COR_PRIMARIA, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      didParseCell: (data) => {
        const bruto = valorBruto(data);

        if (
          (data.section === "body" || data.section === "foot") &&
          data.column.index === 4 &&
          typeof bruto === "number" &&
          bruto < 0
        ) {
          data.cell.styles.textColor = COR_NEGATIVO_TEXTO;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = COR_NEGATIVO_FUNDO;
        }
      },
    });
  }

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...COR_CINZA);
  doc.text(
    "Nota: entradas = desembolso previsto distribuído uniformemente pela duração do projeto; saídas = despesas lançadas por data de ocorrência.",
    MARGEM,
    y + 6,
    { maxWidth: LARGURA_UTIL }
  );

  const totalPaginas = doc.getNumberOfPages();

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    const altura = doc.internal.pageSize.getHeight();
    doc.setDrawColor(220, 222, 226);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, altura - 12, largura - MARGEM, altura - 12);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COR_CINZA);
    doc.text("Gerado por FluxFin v1.0.0", MARGEM, altura - 8);
    doc.text(`Página ${i} de ${totalPaginas}`, largura - MARGEM, altura - 8, {
      align: "right",
    });
  }

  doc.save("relatorio-fluxfin.pdf");
}