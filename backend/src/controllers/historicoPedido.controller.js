import { prisma } from "../lib/prisma.js"

export async function listarHistoricoPedido(req, res) {
  try {
    const { pedidoId } = req.params

    const historicos = await prisma.historicoPedido.findMany({
      where: {
        pedidoId
      },

      include: {
        usuario: {
          include: {
            funcionario: true
          }
        }
      },

      orderBy: {
        createdAt: "desc"
      }
    })

    return res.json(historicos)

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar histórico"
    })
  }
}