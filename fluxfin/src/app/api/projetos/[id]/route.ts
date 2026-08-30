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
    const client = await getClient();

    const deleted = await client.query(
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