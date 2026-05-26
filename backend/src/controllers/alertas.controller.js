import { prisma } from "../lib/prisma.js"

export async function obterAlertas(req, res) {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const [
      pedidosAtrasados,
      servicosPausados,
      servicosSemOperador,
      pedidosAguardandoExterno,
      pedidosProntoEntrega
    ] = await Promise.all([
      prisma.pedido.findMany({
        where: {
          dataEntrega: {
            lt: hoje
          },
          status: {
            notIn: ["ENTREGUE", "CANCELADO"]
          }
        },
        include: {
          cliente: true,
          vendedor: true,
          rota: true
        },
        orderBy: {
          dataEntrega: "asc"
        }
      }),

      prisma.servicoPlano.findMany({
        where: {
          status: "PAUSADO",
          plano: {
            pedido: {
              status: {
                notIn: ["ENTREGUE", "CANCELADO"]
              }
            }
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
        },
        orderBy: {
          updatedAt: "asc"
        }
      }),

      prisma.servicoPlano.findMany({
        where: {
          operadorId: null,
          status: "ABERTO",
          plano: {
            pedido: {
              status: {
                notIn: ["ENTREGUE", "CANCELADO"]
              }
            }
          }
        },
        include: {
          tipoServico: true,
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
        orderBy: {
          createdAt: "asc"
        }
      }),

      prisma.pedido.findMany({
        where: {
          status: "AGUARDANDO_EXTERNO"
        },
        include: {
          cliente: true,
          vendedor: true,
          rota: true
        },
        orderBy: {
          dataEntrega: "asc"
        }
      }),

      prisma.pedido.findMany({
        where: {
          status: "PRONTO_ENTREGA"
        },
        include: {
          cliente: true,
          vendedor: true,
          rota: true
        },
        orderBy: {
          dataEntrega: "asc"
        }
      })
    ])

    return res.json({
      pedidosAtrasados,
      servicosPausados,
      servicosSemOperador,
      pedidosAguardandoExterno,
      pedidosProntoEntrega
    })

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar alertas"
    })
  }
}