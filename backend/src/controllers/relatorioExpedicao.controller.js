import { prisma } from "../lib/prisma.js"

export async function relatorioExpedicao(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      rotaId,
      status,
      busca
    } = req.query

    const where = {
      status: status
        ? status
        : {
            in: [
              "CONCLUIDO",
              "PRONTO_ENTREGA",
              "SAIU_ENTREGA"
            ]
          },

      ...(rotaId
        ? {
            rotaId
          }
        : {}),

      ...(busca
        ? {
            OR: [
              {
                cliente: {
                  nome: {
                    contains: busca,
                    mode: "insensitive"
                  }
                }
              },
              ...(Number(busca)
                ? [
                    {
                      numeroPedido: Number(busca)
                    }
                  ]
                : [])
            ]
          }
        : {})
    }

    if (dataInicio || dataFim) {
      where.dataEntrega = {}

      if (dataInicio) {
        const inicio = new Date(dataInicio)
        inicio.setHours(0, 0, 0, 0)

        where.dataEntrega.gte = inicio
      }

      if (dataFim) {
        const fim = new Date(dataFim)
        fim.setHours(23, 59, 59, 999)

        where.dataEntrega.lte = fim
      }
    }

    const pedidos = await prisma.pedido.findMany({
      where,

      include: {
        cliente: true,
        rota: true,
        vendedor: true
      },

      orderBy: [
        {
          dataEntrega: "asc"
        },
        {
          rota: {
            nome: "asc"
          }
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
      error: "Erro ao gerar relatório de expedição"
    })
  }
}