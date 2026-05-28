import { prisma } from "../lib/prisma.js"

export async function obterAlertas(req, res) {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const [
      pedidosAtrasados,
      servicosSemOperador,
      pedidosEmSeparacao,
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
          operadorId: null,
          status: "ABERTO",
          plano: {
            pedido: {
              status: {
                notIn: ["PRONTO_ENTREGA", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"]
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
          status: "EM_SEPARACAO"
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
      servicosSemOperador,
      pedidosEmSeparacao,
      pedidosProntoEntrega
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar alertas"
    })
  }
}