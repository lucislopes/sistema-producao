import { prisma } from "../lib/prisma.js"

export async function buscaGlobal(req, res) {
  try {
    const { busca } = req.query

    if (!busca || busca.trim() === "") {
      return res.json([])
    }

    const numeroPedido = Number(busca)

    const pedidos = await prisma.pedido.findMany({
      where: {
        OR: [
          ...(Number.isInteger(numeroPedido)
            ? [
                {
                  numeroPedido: numeroPedido
                }
              ]
            : []),

          {
            cliente: {
              nome: {
                contains: busca,
                mode: "insensitive"
              }
            }
          },

          {
            nomeRecebedor: {
              contains: busca,
              mode: "insensitive"
            }
          },

          {
            enderecoEntrega: {
              contains: busca,
              mode: "insensitive"
            }
          }
        ]
      },

      include: {
        cliente: true
      },

      take: 20,

      orderBy: {
        createdAt: "desc"
      }
    })

    return res.json(pedidos)

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro na busca global"
    })
  }
}