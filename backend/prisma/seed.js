import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {

  const senhaHash = await bcrypt.hash("123456", 10)

  const usuarioExistente = await prisma.usuario.findUnique({
    where: {
      email: "admin@sistema.com"
    }
  })

  if (usuarioExistente) {
    console.log("Usuário admin já existe")
    return
  }

  const funcionario = await prisma.funcionario.create({
    data: {
      nome: "Administrador",
      funcao: "ADMIN",
      telefone: "(00)00000-0000",

      usuario: {
        create: {
          email: "admin@sistema.com",
          senha: senhaHash
        }
      }
    }
  })

  console.log(funcionario)
}

main()
  .then(() => {
    console.log("✅ Seed executada")
  })
  .catch((e) => {
    console.log(e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })