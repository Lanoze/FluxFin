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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getSession(request)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const projetoId = Number(id);

  if (!Number.isInteger(projetoId) || projetoId <= 0) {
    return NextResponse.json(
      { error: "Identificador de projeto inválido" },
      { status: 400 }
    );
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

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existentesResult = await client.query(
        'SELECT "rubricaId" FROM "AlocacaoOrcamentaria" WHERE "projetoId" = $1',
        [projetoId]
      );

      const rubricasExistentes = new Set(
        existentesResult.rows.map((r) => r.rubricaId)
      );
      const rubricasDoPayload = new Set(
        alocacoes.map((a) => a.rubricaId as number)
      );

      for (const rubricaId of rubricasExistentes) {
        if (rubricasDoPayload.has(rubricaId)) continue;

        const comDespesas = await client.query(
          'SELECT 1 FROM "Despesa" WHERE "projetoId" = $1 AND "rubricaId" = $2 LIMIT 1',
          [projetoId, rubricaId]
        );

        if ((comDespesas.rowCount ?? 0) > 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            {
              error:
                "Não é possível remover a rubrica porque existem despesas lançadas nela",
            },
            { status: 409 }
          );
        }

        await client.query(
          'DELETE FROM "AlocacaoOrcamentaria" WHERE "projetoId" = $1 AND "rubricaId" = $2',
          [projetoId, rubricaId]
        );
      }

      const updated = await client.query(
        `UPDATE "Projeto"
           SET "codigo" = $1, "titulo" = $2, "descricao" = $3, "dataInicio" = $4,
               "dataTermino" = $5, "orcamentoGlobal" = $6, "updatedAt" = NOW()
         WHERE id = $7
         RETURNING id`,
        [
          codigo.trim(),
          titulo.trim(),
          descricao?.trim() || null,
          dataInicioDate,
          dataTerminoDate,
          orcamento,
          projetoId,
        ]
      );

      if (updated.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Projeto não encontrado" },
          { status: 404 }
        );
      }

      for (const alocacao of alocacoes) {
        if (rubricasExistentes.has(alocacao.rubricaId as number)) {
          await client.query(
            'UPDATE "AlocacaoOrcamentaria" SET "valorPrevisto" = $1 WHERE "projetoId" = $2 AND "rubricaId" = $3',
            [Number(alocacao.valorPrevisto), projetoId, alocacao.rubricaId]
          );
        } else {
          await client.query(
            `INSERT INTO "AlocacaoOrcamentaria"
               ("projetoId", "rubricaId", "valorPrevisto")
             VALUES ($1, $2, $3)`,
            [projetoId, alocacao.rubricaId, Number(alocacao.valorPrevisto)]
          );
        }
      }

      await client.query("COMMIT");

      const full = await client.query('SELECT * FROM "Projeto" WHERE id = $1', [
        projetoId,
      ]);

      const alocacoesResult = await client.query(
        `SELECT a."projetoId", a."valorPrevisto", r.id AS "rubricaId",
                r."codigoAneel" AS "rubricaCodigo", r.descricao AS "rubricaDescricao", r.ordem AS "rubricaOrdem"
         FROM "AlocacaoOrcamentaria" a
         JOIN "Rubrica" r ON r.id = a."rubricaId"
         WHERE a."projetoId" = $1
         ORDER BY r.ordem ASC`,
        [projetoId]
      );

      const projeto = full.rows[0];

      return NextResponse.json({
        ...projeto,
        orcamentoGlobal: Number(projeto.orcamentoGlobal),
        alocacoes: alocacoesResult.rows.map((row) => ({
          rubricaId: row.rubricaId,
          rubricaCodigo: row.rubricaCodigo,
          rubricaDescricao: row.rubricaDescricao,
          valorPrevisto: Number(row.valorPrevisto),
        })),
      });
    } catch (updateError) {
      await client.query("ROLLBACK");

      if (
        typeof updateError === "object" &&
        updateError !== null &&
        (updateError as { code?: string }).code === "23505"
      ) {
        return NextResponse.json(
          { error: "Já existe um projeto com este código" },
          { status: 409 }
        );
      }

      throw updateError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Erro ao atualizar projeto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getSession(request)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const projetoId = Number(id);

  if (!Number.isInteger(projetoId) || projetoId <= 0) {
    return NextResponse.json(
      { error: "Identificador de projeto inválido" },
      { status: 400 }
    );
  }

  try {
    const comDespesas = await pool.query(
      'SELECT 1 FROM "Despesa" WHERE "projetoId" = $1 LIMIT 1',
      [projetoId]
    );

    if ((comDespesas.rowCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir o projeto enquanto houver despesas lançadas. Exclua as despesas primeiro.",
        },
        { status: 409 }
      );
    }

    const deleted = await pool.query(
      'DELETE FROM "Projeto" WHERE id = $1 RETURNING id',
      [projetoId]
    );

    if (deleted.rowCount === 0) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir projeto:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}