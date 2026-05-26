import { prisma } from "../lib/prisma.js"

export async function relatorioPedidos(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      pedido,
      cliente,
      vendedorId,
      status,
      page = 1,
      limit = 50
    } = req.query

    const paginaAtual = Number(page) || 1
    const limite = Number(limit) || 50
    const skip = (paginaAtual - 1) * limite

    const where = {}

    if (dataInicio || dataFim) {
      where.dataEntrega = {}

      if (dataInicio) {
        const inicio = new Date(dataInicio)
        inicio.setHours(0, 0, 0, 0)
        where.dataEntrega.gte = inicio
      }

      if (dataFim) {
        const fim = new Date(dataFim)
        fim.setHours(23, 59, 59, 999)
        where.dataEntrega.lte = fim
      }
    }

    if (pedido) {
      where.numeroPedido = Number(pedido)
    }

    if (cliente) {
      where.cliente = {
        nome: {
          contains: cliente,
          mode: "insensitive"
        }
      }
    }

    if (vendedorId) {
      where.vendedorId = vendedorId
    }

    if (status) {
      where.status = status
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,

        include: {
          cliente: true,
          vendedor: true,
          rota: true
        },

        orderBy: [
          { dataEntrega: "asc" },
          { numeroPedido: "asc" }
        ],

        skip,
        take: limite
      }),

      prisma.pedido.count({
        where
      })
    ])

    return res.json({
      dados: pedidos,
      paginacao: {
        total,
        page: paginaAtual,
        limit: limite,
        totalPages: Math.ceil(total / limite)
      }
    })

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de pedidos"
    })
  }
}