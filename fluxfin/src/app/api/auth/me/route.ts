import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const sessionCookie = request.headers.get("cookie")?.match(/session=([^;]+)/);

  if (!sessionCookie) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie[1]));
    return NextResponse.json(session);
  } catch {
    return NextResponse.json(
      { error: "Sessão inválida" },
      { status: 401 }
    );
  }
}
