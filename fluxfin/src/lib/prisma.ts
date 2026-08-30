import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (error) => {
  console.error("Erro inesperado na conexão com o banco de dados:", error);
});

export { pool };