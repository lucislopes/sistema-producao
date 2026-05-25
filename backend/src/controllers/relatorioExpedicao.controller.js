import { prisma } from "../lib/prisma.js"

export async function relatorioExpedicao(req, res) {
  try {
    const { data, rotaId, status, busca } = req.query
    const dataFiltro = data ? new Date(data) : new Date()

    const inicioDia = new Date(dataFiltro)
    inicioDia.setHours(0, 0, 0, 0)

    const fimDia = new Date(dataFiltro)
    fimDia.setHours(23, 59, 59, 999)

    const pedidos = await prisma.pedido.findMany({
      where: {
        status: status
        ? status
        : {
            in: ["PRONTO_ENTREGA", "SAIU_ENTREGA"]
        },

        dataEntrega: {
          gte: inicioDia,
          lte: fimDia
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
      },

      include: {
        cliente: true,
        rota: true,
        vendedor: true
      },

      orderBy: [
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