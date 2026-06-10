import { prisma } from "../lib/prisma.js"

export async function relatorioServicos(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      status,
      operadorId,
      tipoServicoId,
      busca,
      somentePendentes
    } = req.query

    const where = {}

    if (status) {
      where.status = status
    }

    if (somentePendentes === "true") {
      where.status = {
        in: ["ABERTO", "INICIADO"]
      }
    }

    if (operadorId) {
      where.operadorId = operadorId
    }

    if (tipoServicoId) {
      where.tipoServicoId = tipoServicoId
    }

    if (dataInicio || dataFim) {
      where.plano = {
        pedido: {
          dataEntrega: {}
        }
      }

      if (dataInicio) {
        where.plano.pedido.dataEntrega.gte = new Date(`${dataInicio}T00:00:00`)
      }

      if (dataFim) {
        where.plano.pedido.dataEntrega.lte = new Date(`${dataFim}T23:59:59`)
      }
    }

    if (busca) {
      where.OR = [
        {
          plano: {
            pedido: {
              cliente: {
                nome: {
                  contains: busca,
                  mode: "insensitive"
                }
              }
            }
          }
        },
        {
          tipoServico: {
            nome: {
              contains: busca,
              mode: "insensitive"
            }
          }
        }
      ]
    }

    const servicos = await prisma.servicoPlano.findMany({
      where,
      include: {
        tipoServico: true,
        operador: true,
        plano: {
          include: {
            pedido: {
              include: {
                cliente: true
              }
            }
          }
        }
      },
      orderBy: [
        {
          plano: {
            pedido: {
              dataEntrega: "asc"
            }
          }
        },
        {
          createdAt: "asc"
        }
      ]
    })

    return res.json(servicos)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de serviços"
    })
  }
}


export async function relatorioPendencias(req, res) {
  try {
    const { dataInicio, dataFim, busca } = req.query

    const wherePedido = {
      status: {
        notIn: ["ENTREGUE", "CANCELADO"]
      }
    }

    if (dataInicio || dataFim) {
      wherePedido.dataEntrega = {}

      if (dataInicio) {
        wherePedido.dataEntrega.gte = new Date(`${dataInicio}T00:00:00`)
      }

      if (dataFim) {
        wherePedido.dataEntrega.lte = new Date(`${dataFim}T23:59:59`)
      }
    }

    const [pedidos, planos, todosServicos, servicosPendentes] =
      await Promise.all([
        prisma.pedido.findMany({
          where: wherePedido,
          include: {
            cliente: true
          }
        }),

        prisma.planoCorte.findMany({
          include: {
            pedido: {
              include: {
                cliente: true
              }
            }
          }
        }),

        prisma.servicoPlano.findMany({
          select: {
            id: true,
            planoId: true
          }
        }),

        prisma.servicoPlano.findMany({
          where: {
            status: {
              in: ["ABERTO", "INICIADO"]
            }
          },
          include: {
            tipoServico: true,
            operador: true,
            plano: {
              include: {
                pedido: {
                  include: {
                    cliente: true
                  }
                }
              }
            }
          }
        })
      ])

    const pedidosComPlano = new Set(planos.map((p) => p.pedidoId))
    const planosComServico = new Set(
      todosServicos.map((s) => s.planoId)
    )

    let resultado = []

    pedidos.forEach((pedido) => {
      if (!pedidosComPlano.has(pedido.id)) {
        resultado.push({
          tipo: "PEDIDO_SEM_PLANO",
          pedido,
          plano: null,
          servico: null,
          status: pedido.status
        })
      }
    })

    planos.forEach((plano) => {
      if (
        !planosComServico.has(plano.id) &&
        plano.pedido &&
        !["ENTREGUE", "CANCELADO"].includes(plano.pedido.status)
      ) {
        resultado.push({
          tipo: "PLANO_SEM_SERVICO",
          pedido: plano.pedido,
          plano,
          servico: null,
          status: "ABERTO"
        })
      }
    })

    servicosPendentes.forEach((servico) => {
      if (
        servico.plano?.pedido &&
        !["ENTREGUE", "CANCELADO"].includes(servico.plano.pedido.status)
      ) {
        resultado.push({
          tipo: "SERVICO_PENDENTE",
          pedido: servico.plano.pedido,
          plano: servico.plano,
          servico,
          status: servico.status
        })
      }
    })

    if (busca) {
      const termo = busca.toLowerCase()

      resultado = resultado.filter((item) =>
        String(item.pedido?.numeroPedido || "").includes(termo) ||
        item.pedido?.numeroPedidoManual?.toLowerCase().includes(termo) ||
        item.pedido?.cliente?.nome?.toLowerCase().includes(termo) ||
        item.servico?.tipoServico?.nome?.toLowerCase().includes(termo)
      )
    }

    resultado.sort((a, b) => {
      const dataA = a.pedido?.dataEntrega || ""
      const dataB = b.pedido?.dataEntrega || ""

      return String(dataA).localeCompare(String(dataB))
    })

    return res.json(resultado)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de pendências"
    })
  }
}