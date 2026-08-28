import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("123456", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@fluxfin.com" },
    update: {},
    create: {
      nome: "Lorenzo",
      email: "admin@fluxfin.com",
      senhaHash,
      nivelAcesso: "admin",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "pesquisador@fluxfin.com" },
    update: {},
    create: {
      nome: "Arthur",
      email: "pesquisador@fluxfin.com",
      senhaHash,
      nivelAcesso: "pesquisador",
    },
  });

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
