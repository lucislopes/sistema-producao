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

      orderBy: {
        createdAt: "asc"
      }

    })

    const kanban = {
      ABERTO: [],
      INICIADO: [],
      PAUSADO: [],
      CONCLUIDO: [],
      CANCELADO: []
    }

    servicos.forEach((servico) => {
      kanban[servico.status].push(servico)
    })

    return res.json(kanban)

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar kanban"
    })
  }
}