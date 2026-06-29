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

      return new Date(
        ano,
        mes - 1,
        dia,
        fimDoDia ? 23 : 0,
        fimDoDia ? 59 : 0,
        fimDoDia ? 59 : 0,
        fimDoDia ? 999 : 0
      )
    }

    const inicioPeriodo = dataInicio
      ? criarDataLocal(dataInicio, false)
      : new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0)

    const fimPeriodo = dataFim
      ? criarDataLocal(dataFim, true)
      : new Date()

    const campoDataPedido =
      baseData === "pedido"
        ? "dataPedido"
        : "dataEntrega"

    const statusContaAtrasoProducao = [
      "ABERTO",
      "EM_SEPARACAO",
      "EM_PRODUCAO"
    ]

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
            in: statusContaAtrasoProducao
          }
        }
      }

      return {
        dataPedido: {
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
            in: statusContaAtrasoProducao
          }
        }
      }

      return {
        dataPedido: {
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
            in: statusContaAtrasoProducao
          }
        }
      }

      return {
        dataPedido: {
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

    const filtroPedidoAtivo = {
      status: {
        notIn: ["ENTREGUE", "CANCELADO"]
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
      financeiroTotal,

      pedidosAbertosPeriodo,
      pedidosEmProducaoPeriodo,
      pedidosEntreguesPeriodo,

      totalPedidosPeriodo,
      clientesAtendidos,
      vendedoresAtivos,
      rankingVendedores,
      rankingClientes
    ] = await Promise.all([
      prisma.pedido.count({
        where: { status: "ABERTO" }
      }),

      prisma.pedido.count({
        where: { status: "EM_SEPARACAO" }
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
        where: {
          status: "ENTREGUE",
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: {
          status: {
            in: statusContaAtrasoProducao
          },
          dataEntrega: {
            lt: hoje
          }
        }
      }),

      prisma.servicoPlano.count({
        where: {
          status: "ABERTO"
        }
      }),

      prisma.servicoPlano.count({
        where: {
          status: "INICIADO"
        }
      }),

      prisma.servicoPlano.count({
        where: {
          status: "CONCLUIDO"
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
      }),

      prisma.pedido.count({
        where: {
          status: "ABERTO",
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
          status: "ENTREGUE",
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.count({
        where: {
          ...filtroPeriodoPedido
        }
      }),

      prisma.pedido.findMany({
        where: {
          ...filtroPeriodoPedido
        },
        distinct: ["clienteId"],
        select: {
          clienteId: true
        }
      }),

      prisma.pedido.findMany({
        where: {
          ...filtroPeriodoPedido
        },
        distinct: ["vendedorId"],
        select: {
          vendedorId: true
        }
      }),

      prisma.pedido.groupBy({
        by: ["vendedorId"],
        where: {
          ...filtroPeriodoPedido
        },
        _count: {
          id: true
        },
        _sum: {
          valorTotal: true
        },
        _avg: {
          valorTotal: true
        }
      }),

      prisma.pedido.groupBy({
        by: ["clienteId"],
        where: {
          ...filtroPeriodoPedido
        },
        _count: {
          id: true
        },
        _sum: {
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

    const rankingVendedoresCompleto = await Promise.all(
      rankingVendedores.map(async (item) => {
        const vendedor = await prisma.funcionario.findUnique({
          where: {
            id: item.vendedorId
          }
        })

        return {
          vendedorId: item.vendedorId,
          nome: vendedor?.nome || "Sem nome",
          pedidos: item._count.id,
          valorTotal: Number(item._sum.valorTotal || 0),
          ticketMedio: Number(item._avg.valorTotal || 0)
        }
      })
    )

    rankingVendedoresCompleto.sort(
      (a, b) => b.valorTotal - a.valorTotal
    )

    const rankingClientesCompleto = await Promise.all(
      rankingClientes.map(async (item) => {
        const cliente = await prisma.cliente.findUnique({
          where: {
            id: item.clienteId
          }
        })

        return {
          clienteId: item.clienteId,
          nome: cliente?.nome || "Sem nome",
          pedidos: item._count.id,
          valorTotal: Number(item._sum.valorTotal || 0)
        }
      })
    )

    rankingClientesCompleto.sort(
      (a, b) => b.valorTotal - a.valorTotal
    )

    const totalSla = pedidosDentroPrazo + pedidosForaPrazo

    const percentualSla =
      totalSla > 0
        ? Math.round((pedidosDentroPrazo / totalSla) * 100)
        : 100

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

      pedidosPeriodo: {
        abertos: pedidosAbertosPeriodo,
        emProducao: pedidosEmProducaoPeriodo,
        entregues: pedidosEntreguesPeriodo
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

      comercial: {
        totalPedidos: totalPedidosPeriodo,
        clientesAtendidos: clientesAtendidos.length,
        vendedoresAtivos: vendedoresAtivos.length,
        rankingVendedores: rankingVendedoresCompleto,
        rankingClientes: rankingClientesCompleto
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