import { prisma } from "../lib/prisma.js"

export async function romaneioEntrega(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      rotas,
      status, 
      busca
    } = req.query

    const rotasIds = rotas
      ? rotas.split(",").filter(Boolean)
      : []

    const statusSelecionados = status
      ? status.split(",").filter(Boolean)
      : [
          "CONCLUIDO",
          "PRONTO_ENTREGA"
        ]  
    
    const where = {
      tipoEntrega: "ENTREGA_EMPRESA",

      status: {
        in: statusSelecionados
      }
    }

  
    if (dataInicio || dataFim) {
      where.dataEntrega = {}

      if (dataInicio) {
        where.dataEntrega.gte = new Date(`${dataInicio}T00:00:00`)
      }

      if (dataFim) {
        where.dataEntrega.lte = new Date(`${dataFim}T23:59:59`)
      }
    }

    if (rotasIds.length > 0) {
      where.rotaId = {
        in: rotasIds
      }
    }

    if (busca) {
      where.OR = [
        {
          cliente: {
            nome: {
              contains: busca,
              mode: "insensitive"
            }
          }
        },
        {
          numeroPedidoManual: {
            contains: busca,
            mode: "insensitive"
          }
        }
      ]

      const numeroBusca = Number(busca)

      if (!Number.isNaN(numeroBusca)) {
        where.OR.push({
          numeroPedido: numeroBusca
        })
      }
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: true,
        rota: true,
        planos: true
      },
      orderBy: [
        {
          rota: {
            nome: "asc"
          }
        },
        {
          dataEntrega: "asc"
        },
        {
          numeroPedido: "asc"
        }
      ]
    })

    return res.json(pedidos)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar romaneio de entrega"
    })
  }
}