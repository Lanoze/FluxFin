import { NextResponse } from "next/server";
import { pool } from "@/lib/prisma";

function getSession(request: Request) {
  const sessionCookie = request.headers.get("cookie")?.match(/session=([^;]+)/);

  if (!sessionCookie) return null;

  try {
    return JSON.parse(decodeURIComponent(sessionCookie[1]));
  } catch {
    return null;
  }
}

const centavos = (valor: number) => Math.round(valor * 100) / 100;

const indiceMes = (mes: string) => {
  const [ano, indice] = mes.split("-").map(Number);
  return ano * 12 + (indice - 1);
};

const mesPorIndice = (indice: number) => {
  const ano = Math.floor(indice / 12);
  const mes = (indice % 12) + 1;
  return `${ano}-${String(mes).padStart(2, "0")}`;
};

function listarMeses(mesInicio: string, mesFim: string) {
  const meses: string[] = [];

  for (
    let indice = indiceMes(mesInicio);
    indice <= indiceMes(mesFim);
    indice++
  ) {
    meses.push(mesPorIndice(indice));
  }

  return meses;
}

export async function GET(request: Request) {
  if (!getSession(request)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const filtro = Number(url.searchParams.get("projetoId"));
    const filtrarPorProjeto = Number.isInteger(filtro) && filtro > 0;

    const projetosResult = await pool.query(
      `SELECT p.*,
              TO_CHAR(date_trunc('month', p."dataInicio"), 'YYYY-MM') AS "mesInicio",
              TO_CHAR(date_trunc('month', p."dataTermino"), 'YYYY-MM') AS "mesFim"
       FROM "Projeto" p
       ORDER BY p."createdAt" DESC`
    );

    const alocacoesResult = await pool.query(
      `SELECT a."projetoId", a."valorPrevisto", r.id AS "rubricaId",
              r."codigoAneel" AS "rubricaCodigo", r.descricao AS "rubricaDescricao", r.ordem AS "rubricaOrdem"
       FROM "AlocacaoOrcamentaria" a
       JOIN "Rubrica" r ON r.id = a."rubricaId"
       WHERE ($1::int IS NULL OR a."projetoId" = $1)
       ORDER BY r.ordem ASC`,
      [filtrarPorProjeto ? filtro : null]
    );

    const executadoRubricaResult = await pool.query(
      `SELECT d."projetoId", d."rubricaId", SUM(d."valorExecutado")::numeric AS "total"
       FROM "Despesa" d
       WHERE ($1::int IS NULL OR d."projetoId" = $1)
       GROUP BY d."projetoId", d."rubricaId"`,
      [filtrarPorProjeto ? filtro : null]
    );

    const executadoProjetoResult = await pool.query(
      `SELECT d."projetoId", SUM(d."valorExecutado")::numeric AS "total"
       FROM "Despesa" d
       WHERE ($1::int IS NULL OR d."projetoId" = $1)
       GROUP BY d."projetoId"`,
      [filtrarPorProjeto ? filtro : null]
    );

    const saidasMensaisResult = await pool.query(
      `SELECT d."projetoId",
              TO_CHAR(date_trunc('month', d."dataDespesa"), 'YYYY-MM') AS "mes",
              SUM(d."valorExecutado")::numeric AS "total"
       FROM "Despesa" d
       WHERE ($1::int IS NULL OR d."projetoId" = $1)
       GROUP BY d."projetoId", date_trunc('month', d."dataDespesa")
       ORDER BY d."projetoId", date_trunc('month', d."dataDespesa")`,
      [filtrarPorProjeto ? filtro : null]
    );

    const previstoPorRubrica = new Map<string, number>();
    const executadoPorRubrica = new Map<string, number>();
    const executadoPorProjeto = new Map<number, number>();
    const saidasPorMesProjeto = new Map<string, number>();

    for (const row of alocacoesResult.rows) {
      previstoPorRubrica.set(
        `${row.projetoId}:${row.rubricaId}`,
        Number(row.valorPrevisto)
      );
    }

    for (const row of executadoRubricaResult.rows) {
      executadoPorRubrica.set(
        `${row.projetoId}:${row.rubricaId}`,
        Number(row.total)
      );
    }

    for (const row of executadoProjetoResult.rows) {
      executadoPorProjeto.set(row.projetoId, Number(row.total));
    }

    for (const row of saidasMensaisResult.rows) {
      saidasPorMesProjeto.set(`${row.projetoId}:${row.mes}`, Number(row.total));
    }

    const projetos = [];
    const fluxoConsolidado = new Map<string, { entradas: number; saidas: number }>();
    let orcamentoGlobal = 0;
    let totalExecutado = 0;

    for (const projetoRaw of projetosResult.rows) {
      const projetoId = projetoRaw.id;
      const orcamento = Number(projetoRaw.orcamentoGlobal);

      if (filtrarPorProjeto && projetoId !== filtro) continue;

      orcamentoGlobal += orcamento;
      totalExecutado += executadoPorProjeto.get(projetoId) ?? 0;

      const alocacoesDoProjeto = alocacoesResult.rows.filter(
        (row) => row.projetoId === projetoId
      );

      const rubricas = alocacoesDoProjeto.map((row) => {
        const chave = `${projetoId}:${row.rubricaId}`;
        const valorPrevisto = previstoPorRubrica.get(chave) ?? 0;
        const valorExecutado = executadoPorRubrica.get(chave) ?? 0;

        return {
          rubricaId: row.rubricaId,
          rubricaCodigo: row.rubricaCodigo,
          rubricaDescricao: row.rubricaDescricao,
          valorPrevisto,
          valorExecutado,
          saldo: centavos(valorPrevisto - valorExecutado),
          percentual:
            valorPrevisto > 0
              ? centavos((valorExecutado / valorPrevisto) * 100)
              : 0,
        };
      });

      const meses = listarMeses(projetoRaw.mesInicio, projetoRaw.mesFim);
      const nMeses = Math.max(meses.length, 1);
      const entradaBase = centavos(orcamento / nMeses);
      const residual = centavos(orcamento - entradaBase * nMeses);

      const fluxoMensal: {
        mes: string;
        entradas: number;
        saidas: number;
        entradasAcumuladas: number;
        saidasAcumuladas: number;
        saldoAcumulado: number;
      }[] = [];
      let entradasAcumuladas = 0;
      let saidasAcumuladas = 0;

      meses.forEach((mes, indice) => {
        const entradas = centavos(
          indice === meses.length - 1 ? entradaBase + residual : entradaBase
        );
        const saidas = saidasPorMesProjeto.get(`${projetoId}:${mes}`) ?? 0;

        entradasAcumuladas = centavos(entradasAcumuladas + entradas);
        saidasAcumuladas = centavos(saidasAcumuladas + saidas);

        fluxoMensal.push({
          mes,
          entradas,
          saidas,
          entradasAcumuladas,
          saidasAcumuladas,
          saldoAcumulado: centavos(entradasAcumuladas - saidasAcumuladas),
        });

        const consolidado = fluxoConsolidado.get(mes) ?? {
          entradas: 0,
          saidas: 0,
        };
        consolidado.entradas = centavos(consolidado.entradas + entradas);
        consolidado.saidas = centavos(consolidado.saidas + saidas);
        fluxoConsolidado.set(mes, consolidado);
      });

      const executado = executadoPorProjeto.get(projetoId) ?? 0;

      projetos.push({
        id: projetoId,
        codigo: projetoRaw.codigo,
        titulo: projetoRaw.titulo,
        dataInicio: projetoRaw.dataInicio,
        dataTermino: projetoRaw.dataTermino,
        orcamentoGlobal: orcamento,
        totalExecutado: executado,
        saldoProjeto: centavos(orcamento - executado),
        percentualProjeto:
          orcamento > 0 ? centavos((executado / orcamento) * 100) : 0,
        rubricas,
        fluxoMensal,
      });
    }

    const fluxoConsolidadoLista = Array.from(fluxoConsolidado.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([mes, { entradas, saidas }]) => ({ mes, entradas, saidas }));

    let entradasAcum = 0;
    let saidasAcum = 0;

    const comAcumulados = fluxoConsolidadoLista.map((item) => {
      entradasAcum = centavos(entradasAcum + item.entradas);
      saidasAcum = centavos(saidasAcum + item.saidas);

      return {
        ...item,
        entradasAcumuladas: entradasAcum,
        saidasAcumuladas: saidasAcum,
        saldoAcumulado: centavos(entradasAcum - saidasAcum),
      };
    });

    return NextResponse.json({
      resumo: {
        qtdProjetos: projetos.length,
        orcamentoGlobal: centavos(orcamentoGlobal),
        totalExecutado: centavos(totalExecutado),
        saldoGeral: centavos(orcamentoGlobal - totalExecutado),
        percentualGlobal:
          orcamentoGlobal > 0
            ? centavos((totalExecutado / orcamentoGlobal) * 100)
            : 0,
      },
      projetos,
      fluxoConsolidado: comAcumulados,
    });
  } catch (error) {
    console.error("Erro ao calcular fluxo de caixa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}