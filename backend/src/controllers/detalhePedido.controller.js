import { prisma } from "../lib/prisma.js"

export async function detalhePedido(req, res) {
  try {
    const { id } = req.params

    const pedido = await prisma.pedido.findUnique({
      where: {
        id
      },

      include: {
        cliente: true,
        vendedor: true,
        rota: true,

        planos: {
          include: {
            servicos: {
              include: {
                tipoServico: true,
                operador: true
              },
              orderBy: {
                createdAt: "asc"
              }
            }
          },
          orderBy: {
            createdAt: "asc"
          }
        },

        historicos: {
          include: {
            usuario: {
              include: {
                funcionario: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    })

    if (!pedido) {
      return res.status(404).json({
        error: "Pedido não encontrado"
      })
    }

    return res.json(pedido)

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar detalhe do pedido"
    })
  }
}