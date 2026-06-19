import { prisma } from "../lib/prisma.js"

export async function obterKanban(req, res) {
  try {
    const { busca } = req.query

    const where = {
      plano: {
        pedido: {
          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        }
      }
    }

    if (busca) {
      const buscaTexto = String(busca).trim()
      const numeroBusca = Number(buscaTexto)

      where.OR = [
        !isNaN(numeroBusca)
          ? {
              plano: {
                pedido: {
                  numeroPedido: numeroBusca
                }
              }
            }
          : null,

        {
          plano: {
            numeroPlano: {
              contains: buscaTexto,
              mode: "insensitive"
            }
          }
        },

        {
          plano: {
            pedido: {
              numeroPedidoManual: {
                contains: buscaTexto,
                mode: "insensitive"
              }
            }
          }
        },

        {
          plano: {
            pedido: {
              cliente: {
                nome: {
                  contains: buscaTexto,
                  mode: "insensitive"
                }
              }
            }
          }
        },

        {
          plano: {
            pedido: {
              cliente: {
                endereco: {
                  contains: buscaTexto,
                  mode: "insensitive"
                }
              }
            }
          }
        }
      ].filter(Boolean)
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
              numeroPedido: "asc"
            }
          }
        },
        {
          plano: {
            numeroPlano: "asc"
          }
        },
        {
          createdAt: "asc"
        }
      ]
    })

    const kanban = {
      ABERTO: [],
      INICIADO: [],
      CONCLUIDO: [],
      CANCELADO: []
    }

    servicos.forEach((servico) => {
      if (kanban[servico.status]) {
        kanban[servico.status].push(servico)
      }
    })

    return res.json(kanban)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar kanban"
    })
  }
}