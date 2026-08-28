import bcrypt from "bcrypt"
import { prisma } from "../lib/prisma.js"

async function main() {
  const senhaAdmin = process.env.ADMIN_PASSWORD

  if (!senhaAdmin || senhaAdmin.length < 8) {
    throw new Error("Defina ADMIN_PASSWORD com pelo menos 8 caracteres")
  }

  const senhaHash = await bcrypt.hash(senhaAdmin, 10)

  const usuario = await prisma.usuario.upsert({
    where: {
      email: "admin@sistema.com",
    },
    update: {
      senha: senhaHash,
      funcionario: {
        update: {
          nome: "Administrador",
          funcao: "ADMIN",
          ativo: true,
        },
      },
    },
    create: {
      email: "admin@sistema.com",
      senha: senhaHash,
      funcionario: {
        create: {
          nome: "Administrador",
          funcao: "ADMIN",
          ativo: true,
        },
      },
    },
    include: {
      funcionario: true,
    },
  })

  console.log("Admin criado/atualizado:", usuario.email)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
