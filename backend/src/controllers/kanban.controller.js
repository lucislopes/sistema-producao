import { prisma } from "../lib/prisma.js"

export async function obterKanban(req, res) {
  try {

    const servicos = await prisma.servicoPlano.findMany({

      where: {
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