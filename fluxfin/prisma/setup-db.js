/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "..", ".env");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const vars = {};
  for (const linha of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trim = linha.trim();
    if (!trim || trim.startsWith("#")) continue;
    const idx = trim.indexOf("=");
    if (idx <= 0) continue;
    const chave = trim.slice(0, idx).trim();
    let valor = trim.slice(idx + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    vars[chave] = valor;
  }
  return vars;
}

const env = loadEnv(envPath);
const DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERRO: DATABASE_URL não encontrado em .env");
  process.exit(1);
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS "Rubrica" (
    id SERIAL PRIMARY KEY,
    "codigoAneel" TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS "Projeto" (
    id SERIAL PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataTermino" TIMESTAMP(3) NOT NULL,
    "orcamentoGlobal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS "AlocacaoOrcamentaria" (
    id SERIAL PRIMARY KEY,
    "projetoId" INTEGER NOT NULL REFERENCES "Projeto"(id) ON DELETE CASCADE,
    "rubricaId" INTEGER NOT NULL REFERENCES "Rubrica"(id),
    "valorPrevisto" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "AlocacaoOrcamentaria_projetoId_rubricaId_key" UNIQUE ("projetoId", "rubricaId")
  )`,
  `CREATE TABLE IF NOT EXISTS "Despesa" (
    id SERIAL PRIMARY KEY,
    "projetoId" INTEGER NOT NULL REFERENCES "Projeto"(id) ON DELETE CASCADE,
    "rubricaId" INTEGER NOT NULL REFERENCES "Rubrica"(id),
    "dataDespesa" TIMESTAMP(3) NOT NULL,
    "valorExecutado" DECIMAL(12,2) NOT NULL,
    descricao TEXT NOT NULL,
    "comprovanteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS "Despesa_projetoId_idx" ON "Despesa" ("projetoId")`,
  `CREATE TABLE IF NOT EXISTS "Usuario" (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "senhaHash" TEXT NOT NULL,
    "nivelAcesso" TEXT NOT NULL DEFAULT 'pesquisador',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
  )`,
];

const RUBRICAS = [
  ["RH", "Recursos Humanos", 1],
  ["ST", "Serviços de Terceiros", 2],
  ["MC", "Materiais de Consumo", 3],
  ["MPE", "Materiais Permanentes e Equipamentos", 4],
  ["VD", "Viagens e Diárias", 5],
  ["CA", "Custos Administrativos / Outras Despesas", 6],
];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Conectando ao banco...");

  try {
    await client.connect();
  } catch (error) {
    console.error("Falha na conexão:", error.message);
    process.exit(1);
  }

  for (const ddl of DDL) {
    try {
      await client.query(ddl);
    } catch (error) {
      console.error("ERRO ao executar DDL:", error.message);
      console.error("SQL:", ddl);
      await client.end();
      process.exit(1);
    }
  }

  for (const [codigo, descricao, ordem] of RUBRICAS) {
    await client.query(
      `INSERT INTO "Rubrica" ("codigoAneel", descricao, ordem)
       VALUES ($1, $2, $3)
       ON CONFLICT ("codigoAneel") DO UPDATE SET
         descricao = EXCLUDED.descricao,
         ordem = EXCLUDED.ordem`,
      [codigo, descricao, ordem]
    );
  }

  const tabelas = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`
  );

  console.log("TABELAS:", tabelas.rows.map((r) => r.table_name).join(", "));

  const rubricas = await client.query(
    'SELECT id, "codigoAneel", descricao, ordem FROM "Rubrica" ORDER BY ordem'
  );

  console.log("RUBRICAS (%d):", rubricas.rowCount);
  for (const r of rubricas.rows) {
    console.log(`  #${r.id} ${r.codigoAneel} - ${r.descricao}`);
  }

  await client.end();
  console.log("OK");
}

main().catch((error) => {
  console.error("ERRO:", error);
  process.exit(1);
});