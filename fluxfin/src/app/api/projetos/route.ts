import { NextResponse } from "next/server";
import { getClient } from "@/lib/prisma";

function getSession(request: Request) {
  const sessionCookie = request.headers.get("cookie")?.match(/session=([^;]+)/);

  if (!sessionCookie) return null;

  try {
    return JSON.parse(decodeURIComponent(sessionCookie[1]));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (!getSession(request)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const client = await getClient();

    const projetosResult = await client.query(
      'SELECT * FROM "Projeto" ORDER BY "createdAt" DESC'
    );

    const alocacoesResult = await client.query(
      `SELECT a."projetoId", a."valorPrevisto", r.id AS "rubricaId",
              r."codigoAneel" AS "rubricaCodigo", r.descricao AS "rubricaDescricao", r.ordem AS "rubricaOrdem"
       FROM "AlocacaoOrcamentaria" a
       JOIN "Rubrica" r ON r.id = a."rubricaId"
       ORDER BY r.ordem ASC`
    );

    const alocacoesPorProjeto = new Map<
      number,
      {
        rubricaId: number;
        rubricaCodigo: string;
        rubricaDescricao: string;
        valorPrevisto: number;
      }[]
    >();

    for (const row of alocacoesResult.rows) {
      const atual = alocacoesPorProjeto.get(row.projetoId) ?? [];
      atual.push({
        rubricaId: row.rubricaId,
        rubricaCodigo: row.rubricaCodigo,
        rubricaDescricao: row.rubricaDescricao,
        valorPrevisto: Number(row.valorPrevisto),
      });
      alocacoesPorProjeto.set(row.projetoId, atual);
    }

    const projetos = projetosResult.rows.map((p) => ({
      ...p,
      orcamentoGlobal: Number(p.orcamentoGlobal),
      alocacoes: alocacoesPorProjeto.get(p.id) ?? [],
    }));

    return NextResponse.json(projetos);
  } catch (error) {
    console.error("Erro ao listar projetos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!getSession(request)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const {
      titulo,
      codigo,
      descricao,
      dataInicio,
      dataTermino,
      orcamentoGlobal,
      alocacoes,
    } = await request.json();

    if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
      return NextResponse.json(
        { error: "O título do projeto é obrigatório" },
        { status: 400 }
      );
    }

    if (!codigo || typeof codigo !== "string" || !codigo.trim()) {
      return NextResponse.json(
        { error: "O código do projeto é obrigatório" },
        { status: 400 }
      );
    }

    const dataInicioDate = new Date(dataInicio);
    const dataTerminoDate = new Date(dataTermino);

    if (
      isNaN(dataInicioDate.getTime()) ||
      isNaN(dataTerminoDate.getTime())
    ) {
      return NextResponse.json(
        { error: "Datas de início e término inválidas" },
        { status: 400 }
      );
    }

    if (dataTerminoDate < dataInicioDate) {
      return NextResponse.json(
        { error: "A data de término deve ser posterior à data de início" },
        { status: 400 }
      );
    }

    const orcamento = Number(orcamentoGlobal);

    if (!Number.isFinite(orcamento) || orcamento <= 0) {
      return NextResponse.json(
        { error: "O orçamento global deve ser maior que zero" },
        { status: 400 }
      );
    }

    if (!Array.isArray(alocacoes)) {
      return NextResponse.json(
        { error: "Alocação orçamentária inválida" },
        { status: 400 }
      );
    }

    let totalAlocado = 0;

    for (const alocacao of alocacoes) {
      const valor = Number(alocacao.valorPrevisto);

      if (
        !Number.isInteger(alocacao.rubricaId) ||
        !Number.isFinite(valor) ||
        valor < 0
      ) {
        return NextResponse.json(
          { error: "Alocação orçamentária inválida" },
          { status: 400 }
        );
      }

      totalAlocado += valor;
    }

    if (Math.abs(totalAlocado - orcamento) > 0.01) {
      return NextResponse.json(
        {
          error:
            "A soma das rubricas deve ser igual ao orçamento global do projeto",
        },
        { status: 400 }
      );
    }

    const client = await getClient();

    await client.query("BEGIN");

    try {
      const inserted = await client.query(
        `INSERT INTO "Projeto"
           ("codigo", "titulo", "descricao", "dataInicio", "dataTermino", "orcamentoGlobal", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id`,
        [
          codigo.trim(),
          titulo.trim(),
          descricao?.trim() || null,
          dataInicioDate,
          dataTerminoDate,
          orcamento,
        ]
      );

      const projetoId = inserted.rows[0].id;

      for (const alocacao of alocacoes) {
        await client.query(
          `INSERT INTO "AlocacaoOrcamentaria"
             ("projetoId", "rubricaId", "valorPrevisto")
           VALUES ($1, $2, $3)`,
          [projetoId, alocacao.rubricaId, Number(alocacao.valorPrevisto)]
        );
      }

      await client.query("COMMIT");

      const created = await client.query(
        'SELECT * FROM "Projeto" WHERE id = $1',
        [projetoId]
      );

      const projeto = created.rows[0];

      const alocacoesResult = await client.query(
        `SELECT a."projetoId", a."valorPrevisto", r.id AS "rubricaId",
                r."codigoAneel" AS "rubricaCodigo", r.descricao AS "rubricaDescricao", r.ordem AS "rubricaOrdem"
         FROM "AlocacaoOrcamentaria" a
         JOIN "Rubrica" r ON r.id = a."rubricaId"
         WHERE a."projetoId" = $1
         ORDER BY r.ordem ASC`,
        [projetoId]
      );

      return NextResponse.json(
        {
          ...projeto,
          orcamentoGlobal: Number(projeto.orcamentoGlobal),
          alocacoes: alocacoesResult.rows.map((row) => ({
            rubricaId: row.rubricaId,
            rubricaCodigo: row.rubricaCodigo,
            rubricaDescricao: row.rubricaDescricao,
            valorPrevisto: Number(row.valorPrevisto),
          })),
        },
        { status: 201 }
      );
    } catch (insertError) {
      await client.query("ROLLBACK");

      if (
        typeof insertError === "object" &&
        insertError !== null &&
        (insertError as { code?: string }).code === "23505"
      ) {
        return NextResponse.json(
          { error: "Já existe um projeto com este código" },
          { status: 409 }
        );
      }

      throw insertError;
    }
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}