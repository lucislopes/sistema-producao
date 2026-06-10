import { prisma } from "../lib/prisma.js"



export async function obterDashboard(req, res) {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const {
      dataInicio,
      dataFim,
      baseData = "entrega"
    } = req.query

    function criarDataLocal(data, fimDoDia = false) {
      if (!data) return null

      const [ano, mes, dia] = data.split("-").map(Number)

      const novaData = new Date(
        ano,
        mes - 1,
        dia,
        fimDoDia ? 23 : 0,
        fimDoDia ? 59 : 0,
        fimDoDia ? 59 : 0,
        fimDoDia ? 999 : 0
      )

      return novaData
    }

    const inicioPeriodo = dataInicio
      ? criarDataLocal(dataInicio, false)
      : new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0)

    const fimPeriodo = dataFim
      ? criarDataLocal(dataFim, true)
      : new Date()

    const campoDataPedido =
      baseData === "pedido"
        ? "createdAt"
        : "dataEntrega"

    const filtroPeriodoPedido = {
      [campoDataPedido]: {
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

    function filtroAtrasados() {
      if (campoDataPedido === "dataEntrega") {
        return {
          dataEntrega: {
            gte: inicioPeriodo,
            lte: fimPeriodo,
            lt: hoje
          },
          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        }
      }

      return {
        createdAt: {
          gte: inicioPeriodo,
          lte: fimPeriodo
        },
        dataEntrega: {
          lt: hoje
        },
        status: {
          notIn: ["ENTREGUE", "CANCELADO"]
        }
      }
    }

    function filtroSlaDentroPrazo() {
      if (campoDataPedido === "dataEntrega") {
        return {
          dataEntrega: {
            gte: hoje > inicioPeriodo ? hoje : inicioPeriodo,
            lte: fimPeriodo
          },
          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        }
      }

      return {
        createdAt: {
          gte: inicioPeriodo,
          lte: fimPeriodo
        },
        dataEntrega: {
          gte: hoje
        },
        status: {
          notIn: ["ENTREGUE", "CANCELADO"]
        }
      }
    }

    function filtroSlaForaPrazo() {
      if (campoDataPedido === "dataEntrega") {
        return {
          dataEntrega: {
            gte: inicioPeriodo,
            lte: fimPeriodo,
            lt: hoje
          },
          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        }
      }

      return {
        createdAt: {
          gte: inicioPeriodo,
          lte: fimPeriodo
        },
        dataEntrega: {
          lt: hoje
        },
        status: {
          notIn: ["ENTREGUE", "CANCELADO"]
        }
      }
    }

    const [
      pedidosAbertos,
      pedidosEmSeparacao,
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
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: {
          status: "EM_SEPARACAO",
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: {
          status: "EM_PRODUCAO",
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: {
          status: "CONCLUIDO",
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: {
          status: "PRONTO_ENTREGA",
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: {
          status: "SAIU_ENTREGA",
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: {
          status: "ENTREGUE",
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: filtroAtrasados()
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
        where: filtroSlaDentroPrazo()
      }),

      prisma.pedido.count({
        where: filtroSlaForaPrazo()
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


console.log("BASE:", baseData)
console.log("PERIODO:", inicioPeriodo, fimPeriodo)
console.log("PRONTO ENTREGA:", pedidosProntoEntrega)

const testePronto = await prisma.pedido.findMany({
  where: {
    status: "PRONTO_ENTREGA"
  },
  select: {
    numeroPedido: true,
    status: true,
    tipoPedido: true,
    createdAt: true,
    dataEntrega: true
  }
})

console.log("TODOS PRONTO ENTREGA:", testePronto)






    return res.json({
      baseData,

      pedidos: {
        abertos: pedidosAbertos,
        emSeparacao: pedidosEmSeparacao,
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