import { prisma } from "../lib/prisma.js"

function criarDataLocal(dataTexto, fimDoDia = false) {
  if (!dataTexto) return null

  const [ano, mes, dia] = dataTexto.split("-").map(Number)

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
        where.plano.pedido.dataEntrega.gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        where.plano.pedido.dataEntrega.lte = criarDataLocal(dataFim, true)
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
        },
        {
          plano: {
            pedido: {
              numeroPedidoManual: {
                contains: busca,
                mode: "insensitive"
              }
            }
          }
        },
        ...(Number(busca)
          ? [
              {
                plano: {
                  pedido: {
                    numeroPedido: Number(busca)
                  }
                }
              }
            ]
          : [])
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
        wherePedido.dataEntrega.gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        wherePedido.dataEntrega.lte = criarDataLocal(dataFim, true)
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
      const dataA = String(a.pedido?.dataEntrega || "")
      const dataB = String(b.pedido?.dataEntrega || "")

      return dataA.localeCompare(dataB)
    })

    return res.json(resultado)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de pendências"
    })
  }
}