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

const URL_COMPROVANTE = /^https?:\/\/.+/i;

const SELECT_DESPESA = `
  SELECT d.*,
         p.codigo AS "projetoCodigo", p.titulo AS "projetoTitulo",
         r."codigoAneel" AS "rubricaCodigo", r.descricao AS "rubricaDescricao",
         a."valorPrevisto"
  FROM "Despesa" d
  JOIN "Projeto" p ON p.id = d."projetoId"
  JOIN "Rubrica" r ON r.id = d."rubricaId"
  JOIN "AlocacaoOrcamentaria" a
    ON a."projetoId" = d."projetoId" AND a."rubricaId" = d."rubricaId"
`;

function formatarDespesa(row: {
  valorExecutado: string | number;
  valorPrevisto: string | number;
}) {
  return {
    ...row,
    valorExecutado: Number(row.valorExecutado),
    valorPrevisto: Number(row.valorPrevisto),
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getSession(request)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const despesaId = Number(id);

  if (!Number.isInteger(despesaId) || despesaId <= 0) {
    return NextResponse.json(
      { error: "Identificador de despesa inválido" },
      { status: 400 }
    );
  }

  try {
    const {
      projetoId,
      rubricaId,
      dataDespesa,
      valorExecutado,
      descricao,
      comprovanteUrl,
    } = await request.json();

    const projeto = Number(projetoId);
    const rubrica = Number(rubricaId);

    if (!Number.isInteger(projeto) || projeto <= 0) {
      return NextResponse.json(
        { error: "O projeto é obrigatório e deve ser válido" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rubrica) || rubrica <= 0) {
      return NextResponse.json(
        { error: "A rubrica é obrigatória e deve ser válida" },
        { status: 400 }
      );
    }

    const valor = Number(valorExecutado);

    if (!Number.isFinite(valor) || valor <= 0) {
      return NextResponse.json(
        { error: "O valor da despesa deve ser maior que zero" },
        { status: 400 }
      );
    }

    const data = new Date(dataDespesa);

    if (isNaN(data.getTime())) {
      return NextResponse.json(
        { error: "A data da despesa é inválida" },
        { status: 400 }
      );
    }

    const desc = String(descricao ?? "").trim();

    if (!desc) {
      return NextResponse.json(
        { error: "A descrição da despesa é obrigatória" },
        { status: 400 }
      );
    }

    const url = String(comprovanteUrl ?? "").trim();

    if (url && !URL_COMPROVANTE.test(url)) {
      return NextResponse.json(
        { error: "O comprovante deve ser uma URL válida (http/https)" },
        { status: 400 }
      );
    }

    const existe = await pool.query(
      'SELECT 1 FROM "Despesa" WHERE id = $1 LIMIT 1',
      [despesaId]
    );

    if ((existe.rowCount ?? 0) === 0) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    const projetoResult = await pool.query(
      'SELECT id FROM "Projeto" WHERE id = $1',
      [projeto]
    );

    if (projetoResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Projeto não encontrado" },
        { status: 400 }
      );
    }

    const alocacaoResult = await pool.query(
      'SELECT id FROM "AlocacaoOrcamentaria" WHERE "projetoId" = $1 AND "rubricaId" = $2',
      [projeto, rubrica]
    );

    if (alocacaoResult.rowCount === 0) {
      return NextResponse.json(
        { error: "A rubrica informada não está alocada a este projeto" },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE "Despesa"
         SET "projetoId" = $1, "rubricaId" = $2, "dataDespesa" = $3,
             "valorExecutado" = $4, "descricao" = $5, "comprovanteUrl" = $6
       WHERE id = $7`,
      [projeto, rubrica, data, valor, desc, url || null, despesaId]
    );

    const full = await pool.query(`${SELECT_DESPESA} WHERE d.id = $1`, [
      despesaId,
    ]);

    return NextResponse.json(formatarDespesa(full.rows[0]));
  } catch (error) {
    console.error("Erro ao atualizar despesa:", error);
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
  const despesaId = Number(id);

  if (!Number.isInteger(despesaId) || despesaId <= 0) {
    return NextResponse.json(
      { error: "Identificador de despesa inválido" },
      { status: 400 }
    );
  }

  try {
    const deleted = await pool.query(
      'DELETE FROM "Despesa" WHERE id = $1 RETURNING id',
      [despesaId]
    );

    if (deleted.rowCount === 0) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir despesa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}