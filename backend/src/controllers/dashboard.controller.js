import { prisma } from "../lib/prisma.js"

export async function obterDashboard(req, res) {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const { dataInicio, dataFim } = req.query

    const inicioPeriodo = dataInicio
      ? new Date(dataInicio)
      : new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    inicioPeriodo.setHours(0, 0, 0, 0)

    const fimPeriodo = dataFim
      ? new Date(dataFim)
      : new Date()

    fimPeriodo.setHours(23, 59, 59, 999)

    const filtroPeriodoPedido = {
      dataEntrega: {
        gte: inicioPeriodo,
        lte: fimPeriodo
      }
    }

    const filtroPeriodoServico = {
      updatedAt: {
        gte: inicioPeriodo,
        lte: fimPeriodo
      }
    }

    const [
      pedidosAbertos,
      pedidosEmProducao,
      pedidosConcluidos,
      pedidosProntoEntrega,
      pedidosSaiuEntrega,
      pedidosEntregues,
      pedidosAtrasados,

      servicosAbertos,
      servicosIniciados,
      servicosConcluidos,

      leaderboard,

      pedidosDentroPrazo,
      pedidosForaPrazo,

      financeiroAberto,

      financeiroProducao,
      financeiroConcluido,
      financeiroEntregue,
      financeiroTotal

    ] = await Promise.all([
      prisma.pedido.count({
        where: {
          status: "ABERTO",
        }
      }),

      prisma.pedido.count({
        where: {
          status: "EM_PRODUCAO",
        }
      }),

      prisma.pedido.count({
        where: { 
          status: "CONCLUIDO",
        }
      }),

      prisma.pedido.count({
        where: { 
          status: "PRONTO_ENTREGA",
        }
      }),

      prisma.pedido.count({
        where: { 
          status: "SAIU_ENTREGA",

        }
      }),

      prisma.pedido.count({
        where: { 
          status: "ENTREGUE",
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: {
          ...filtroPeriodoPedido,
          dataEntrega: {
            lt: hoje,
            gte: inicioPeriodo,
            lte: fimPeriodo
          },
          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        }
              
      }),

      prisma.servicoPlano.count({
        where: { 
          status: "ABERTO",
          ...filtroPeriodoServico
        }
      }),

      prisma.servicoPlano.count({
        where: { 
          status: "INICIADO",
          ...filtroPeriodoServico
        }
      }),

      prisma.servicoPlano.count({
        where: { 
          status: "CONCLUIDO",
          ...filtroPeriodoServico
        }
      }),

      prisma.servicoPlano.groupBy({
        by: ["operadorId"],

        where: {
          status: "CONCLUIDO",
          operadorId: {
            not: null
          },
          ...filtroPeriodoServico
        },

        _count: {
          operadorId: true
        },

        orderBy: {
          _count: {
            operadorId: "desc"
          }
        }
      }),

      prisma.pedido.count({
        where: {
          dataEntrega: {
            gte: hoje > inicioPeriodo ? hoje : inicioPeriodo,
            lte: fimPeriodo
          },

          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        }
      }),

      prisma.pedido.count({
        where: {
          dataEntrega: {
            lt: hoje,
            gte: inicioPeriodo,
            lte: fimPeriodo
          },

          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        }
      }),

        prisma.pedido.aggregate({
          where: {
            status: "ABERTO",
            ...filtroPeriodoPedido
          },
          _sum: {
            valorTotal: true
          }
        }),

        prisma.pedido.aggregate({
          where: {
            status: "EM_PRODUCAO",
            ...filtroPeriodoPedido
          },
          _sum: {
            valorTotal: true
          }
        }),

        prisma.pedido.aggregate({
          where: {
            status: "CONCLUIDO",
            ...filtroPeriodoPedido
          },
          _sum: {
            valorTotal: true
          }
        }),

        prisma.pedido.aggregate({
          where: {
            status: "ENTREGUE",
            ...filtroPeriodoPedido
          },
          _sum: {
            valorTotal: true
          }
        }),

        prisma.pedido.aggregate({
          where: {
            ...filtroPeriodoPedido
          },
          _sum: {
            valorTotal: true
          },
          _avg: {
            valorTotal: true
          }
        })
    ])

    const leaderboardCompleto = await Promise.all(
      leaderboard.map(async (item) => {
        const funcionario = await prisma.funcionario.findUnique({
          where: {
            id: item.operadorId
          }
        })

        return {
          nome: funcionario?.nome || "Sem nome",
          total: item._count.operadorId
        }
      })
    )

    const totalSla = pedidosDentroPrazo + pedidosForaPrazo

    const percentualSla =
      totalSla > 0
        ? Math.round((pedidosDentroPrazo / totalSla) * 100)
        : 100

    return res.json({
      pedidos: {
        abertos: pedidosAbertos,
        emProducao: pedidosEmProducao,
        concluidos: pedidosConcluidos,
        prontoEntrega: pedidosProntoEntrega,
        saiuEntrega: pedidosSaiuEntrega,
        entregues: pedidosEntregues,
        atrasados: pedidosAtrasados
      },

      servicos: {
        abertos: servicosAbertos,
        iniciados: servicosIniciados,
        concluidos: servicosConcluidos
      },

      sla: {
        dentroPrazo: pedidosDentroPrazo,
        foraPrazo: pedidosForaPrazo,
        total: totalSla,
        percentual: percentualSla
      },

            financeiro: {
        aberto: Number(financeiroAberto._sum.valorTotal || 0),
        producao: Number(financeiroProducao._sum.valorTotal || 0),
        concluido: Number(financeiroConcluido._sum.valorTotal || 0),
        entregue: Number(financeiroEntregue._sum.valorTotal || 0),
        total: Number(financeiroTotal._sum.valorTotal || 0),
        ticketMedio: Number(financeiroTotal._avg.valorTotal || 0)
      },

      leaderboard: leaderboardCompleto
    })

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar dashboard"
    })
  }
}