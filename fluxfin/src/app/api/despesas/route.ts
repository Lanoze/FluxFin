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

export async function GET(request: Request) {
  if (!getSession(request)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const projetoId = Number(url.searchParams.get("projetoId"));

    let result;

    if (Number.isInteger(projetoId) && projetoId > 0) {
      result = await pool.query(
        `${SELECT_DESPESA} WHERE d."projetoId" = $1 ORDER BY d."dataDespesa" DESC, d.id DESC`,
        [projetoId]
      );
    } else {
      result = await pool.query(
        `${SELECT_DESPESA} ORDER BY d."dataDespesa" DESC, d.id DESC`
      );
    }

    return NextResponse.json(result.rows.map(formatarDespesa));
  } catch (error) {
    console.error("Erro ao listar despesas:", error);
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

    const inserted = await pool.query(
      `INSERT INTO "Despesa"
         ("projetoId", "rubricaId", "dataDespesa", "valorExecutado", "descricao", "comprovanteUrl", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [projeto, rubrica, data, valor, desc, url || null]
    );

    const despesaId = inserted.rows[0].id;

    const full = await pool.query(
      `${SELECT_DESPESA} WHERE d.id = $1`,
      [despesaId]
    );

    return NextResponse.json(formatarDespesa(full.rows[0]), { status: 201 });
  } catch (error) {
    console.error("Erro ao lançar despesa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}