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

export async function GET(request: Request) {
  if (!getSession(request)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const result = await pool.query(
      'SELECT id, "codigoAneel", descricao, ordem FROM "Rubrica" ORDER BY ordem ASC'
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar rubricas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}