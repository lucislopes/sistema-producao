import { prisma } from "../lib/prisma.js"

export async function listarExpedicao(req, res) {
  try {

    const pedidos = await prisma.pedido.findMany({

      where: {
        status: {
          in: [
            "CONCLUIDO",
            "PRONTO_ENTREGA",
            "SAIU_ENTREGA"
          ]
        }
      },

      include: {
        cliente: true,
        rota: true,
        vendedor: true
      },

      orderBy: {
        dataEntrega: "asc"
      }

    })

    return res.json(pedidos)

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar expedição"
    })
  }
}

export async function alterarStatusExpedicao(req, res) {
  try {

    const { id } = req.params

    const { status } = req.body

    const pedido = await prisma.pedido.update({
      where: {
        id
      },

      data: {
        status
      }
    })

    return res.json(pedido)

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      error: "Erro ao atualizar expedição"
    })
  }
}