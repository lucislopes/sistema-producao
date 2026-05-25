import bcrypt from "bcrypt"
import { prisma } from "../lib/prisma.js"

async function main() {
  const senhaHash = await bcrypt.hash("123456", 10)

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
  console.log("Senha: 123456")
  console.log("Hash:", usuario.senha)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })