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

  const rubricas = [
    { codigoAneel: "RH", descricao: "Recursos Humanos", ordem: 1 },
    { codigoAneel: "ST", descricao: "Serviços de Terceiros", ordem: 2 },
    { codigoAneel: "MC", descricao: "Materiais de Consumo", ordem: 3 },
    {
      codigoAneel: "MPE",
      descricao: "Materiais Permanentes e Equipamentos",
      ordem: 4,
    },
    { codigoAneel: "VD", descricao: "Viagens e Diárias", ordem: 5 },
    {
      codigoAneel: "CA",
      descricao: "Custos Administrativos / Outras Despesas",
      ordem: 6,
    },
  ];

  for (const rubrica of rubricas) {
    await prisma.rubrica.upsert({
      where: { codigoAneel: rubrica.codigoAneel },
      update: rubrica,
      create: rubrica,
    });
  }

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
