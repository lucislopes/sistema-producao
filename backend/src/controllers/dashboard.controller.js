import { prisma } from "../lib/prisma.js"

export async function obterDashboard(req, res) {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

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
      servicosPausados,
      servicosConcluidos,

      leaderboard,

      pedidosDentroPrazo,
      pedidosForaPrazo
    ] = await Promise.all([
      prisma.pedido.count({
        where: { status: "ABERTO" }
      }),

      prisma.pedido.count({
        where: { status: "EM_PRODUCAO" }
      }),

      prisma.pedido.count({
        where: { status: "CONCLUIDO" }
      }),

      prisma.pedido.count({
        where: { status: "PRONTO_ENTREGA" }
      }),

      prisma.pedido.count({
        where: { status: "SAIU_ENTREGA" }
      }),

      prisma.pedido.count({
        where: { status: "ENTREGUE" }
      }),

      prisma.pedido.count({
        where: {
          dataEntrega: {
            lt: hoje
          },
          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        }
      }),

      prisma.servicoPlano.count({
        where: { status: "ABERTO" }
      }),

      prisma.servicoPlano.count({
        where: { status: "INICIADO" }
      }),

      prisma.servicoPlano.count({
        where: { status: "PAUSADO" }
      }),

      prisma.servicoPlano.count({
        where: { status: "CONCLUIDO" }
      }),

      prisma.servicoPlano.groupBy({
        by: ["operadorId"],

        where: {
          status: "CONCLUIDO",
          operadorId: {
            not: null
          }
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
            gte: hoje
          },
          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        }
      }),

      prisma.pedido.count({
        where: {
          dataEntrega: {
            lt: hoje
          },
          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
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
        pausados: servicosPausados,
        concluidos: servicosConcluidos
      },

      sla: {
        dentroPrazo: pedidosDentroPrazo,
        foraPrazo: pedidosForaPrazo,
        total: totalSla,
        percentual: percentualSla
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