import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'SELECT * FROM "Usuario" WHERE "email" = $1',
      [email]
    );

    const usuario = result.rows[0];

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

    if (!senhaValida) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      nivelAcesso: usuario.nivelAcesso,
    });

    response.cookies.set(
      "session",
      JSON.stringify({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivelAcesso: usuario.nivelAcesso,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
