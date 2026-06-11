import { prisma } from "../lib/prisma.js"
import { registrarHistoricoPedido } from "../utils/registrarHistoricoPedido.js"

const STATUS_EXPEDICAO_PERMITIDOS = [
  "CONCLUIDO",
  "PRONTO_ENTREGA",
  "SAIU_ENTREGA",
  "ENTREGUE"
]

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
    vendedor: true,

    planos: {
      select: {
        id: true,
        quantidadeChapas: true
      }
    }
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

    if (!status || !STATUS_EXPEDICAO_PERMITIDOS.includes(status)) {
      return res.status(400).json({
        error: "Status de expedição inválido"
      })
    }

    const pedidoAnterior = await prisma.pedido.findUnique({
      where: {
        id
      }
    })

    if (!pedidoAnterior) {
      return res.status(404).json({
        error: "Pedido não encontrado"
      })
    }

    if (pedidoAnterior.status === "CANCELADO") {
      return res.status(400).json({
        error: "Pedido cancelado não pode ir para expedição"
      })
    }

    if (pedidoAnterior.status === "ENTREGUE") {
      return res.status(400).json({
        error: "Pedido já foi entregue"
      })
    }

    const statusPermitidosNaExpedicao = [
      "CONCLUIDO",
      "PRONTO_ENTREGA",
      "SAIU_ENTREGA"
    ]

    if (!statusPermitidosNaExpedicao.includes(pedidoAnterior.status)) {
      return res.status(400).json({
        error: "Pedido ainda não está disponível para expedição"
      })
    }

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