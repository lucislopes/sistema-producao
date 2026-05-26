import { prisma } from "../lib/prisma.js"
import { registrarHistoricoPedido } from "../utils/registrarHistoricoPedido.js"

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

    const pedidoAnterior = await prisma.pedido.findUnique({
      where: {
        id
      }
    })

    const pedido = await prisma.pedido.update({
      where: {
        id
      },

      data: {
        status
      }
    })

    await registrarHistoricoPedido({
      pedidoId: pedido.id,
      usuarioId: req.user.id,
      tipo: "EXPEDICAO_ATUALIZADA",
      descricao: `Expedição: status alterado de ${pedidoAnterior.status} para ${pedido.status}`
    })

    return res.json(pedido)

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      error: "Erro ao atualizar expedição"
    })
  }
}