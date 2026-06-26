import { prisma } from "../lib/prisma.js"

export async function relatorioPedidosEntregues(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      baseData = "entrega",
      vendedorId,
      busca,
      page = 1,
      limit = 50
    } = req.query

    const paginaAtual = Number(page) || 1
    const limite = Number(limit) || 50
    const skip = (paginaAtual - 1) * limite

    const where = {
      status: "ENTREGUE"
    }

    function criarDataLocal(data, fimDoDia = false) {
      if (!data) return null

      const [ano, mes, dia] = data.split("-").map(Number)

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

    const campoData =
      baseData === "pedido"
        ? "dataPedido"
        : "dataEntrega"

    if (dataInicio || dataFim) {
      where[campoData] = {}

      if (dataInicio) {
        where[campoData].gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        where[campoData].lte = criarDataLocal(dataFim, true)
      }
    }

    if (vendedorId) {
      where.vendedorId = vendedorId
    }

    if (busca) {
      where.OR = [
        {
          cliente: {
            nome: {
              contains: busca,
              mode: "insensitive"
            }
          }
        },
        {
          vendedor: {
            nome: {
              contains: busca,
              mode: "insensitive"
            }
          }
        },
        {
          numeroPedidoManual: {
            contains: busca,
            mode: "insensitive"
          }
        },
        ...(Number(busca)
          ? [
              {
                numeroPedido: Number(busca)
              }
            ]
          : [])
      ]
    }

    const orderBy =
      campoData === "dataPedido"
        ? [
            { dataPedido: "desc" },
            { numeroPedido: "desc" }
          ]
        : [
            { dataEntrega: "desc" },
            { numeroPedido: "desc" }
          ]

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: {
          cliente: true,
          vendedor: true,
          rota: true
        },
        orderBy,
        skip,
        take: limite
      }),

      prisma.pedido.count({
        where
      })
    ])

    const pedidosComPrazo = pedidos.map((pedido) => {
      let situacaoPrazo = "Entregue no prazo"

      if (!pedido.dataEntrega) {
        situacaoPrazo = "Sem data"
      } else {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const dataEntrega = new Date(
          pedido.dataEntrega.getFullYear(),
          pedido.dataEntrega.getMonth(),
          pedido.dataEntrega.getDate()
        )

        situacaoPrazo =
          dataEntrega < hoje
            ? "Entregue com atraso"
            : "Entregue no prazo"
      }

      return {
        ...pedido,
        situacaoPrazo
      }
    })

    return res.json({
      baseData,
      campoData,
      dados: pedidosComPrazo,
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
      error: "Erro ao gerar relatório de pedidos entregues"
    })
  }
}