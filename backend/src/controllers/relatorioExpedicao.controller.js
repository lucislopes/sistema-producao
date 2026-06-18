import { prisma } from "../lib/prisma.js"

function criarDataLocal(dataTexto, fimDoDia = false) {
  if (!dataTexto) return null

  const [ano, mes, dia] = dataTexto.split("-").map(Number)

  const data = new Date(
    ano,
    mes - 1,
    dia,
    fimDoDia ? 23 : 0,
    fimDoDia ? 59 : 0,
    fimDoDia ? 59 : 0,
    fimDoDia ? 999 : 0
  )

  return data
}

export async function relatorioExpedicao(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      rotaId,
      status,
      busca
    } = req.query

    const where = {
      status: status
        ? status
        : {
            in: [
              "CONCLUIDO",
              "PRONTO_ENTREGA",
              "SAIU_ENTREGA"
            ]
          },

      ...(rotaId
        ? {
            rotaId
          }
        : {}),

      ...(busca
        ? {
            OR: [
              {
                cliente: {
                  nome: {
                    contains: busca,
                    mode: "insensitive"
                  }
                }
              },
              ...(Number(busca)
                ? [
                    {
                      numeroPedido: Number(busca)
                    }
                  ]
                : []),
              {
                numeroPedidoManual: {
                  contains: busca,
                  mode: "insensitive"
                }
              }
            ]
          }
        : {})
    }

    if (dataInicio || dataFim) {
      where.dataEntrega = {}

      if (dataInicio) {
        where.dataEntrega.gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        where.dataEntrega.lte = criarDataLocal(dataFim, true)
      }
    }

    const pedidos = await prisma.pedido.findMany({
      where,

      include: {
        cliente: true,
        rota: true,
        vendedor: true,

        planos: {
          select: {
            id: true,
            quantidadeChapas: true
          }
        }
      },

      orderBy: [
        {
          dataEntrega: "asc"
        },
        {
          rota: {
            nome: "asc"
          }
        },
        {
          numeroPedido: "asc"
        }
      ]
    })

    const pedidosFormatados = pedidos.map((pedido) => {
      const totalChapasPlanos = pedido.planos.reduce(
        (acc, plano) => acc + Number(plano.quantidadeChapas || 0),
        0
      )

      const totalChapas =
        Number(pedido.quantidadeChapasDiretoEntrega || 0) +
        totalChapasPlanos

      return {
        ...pedido,
        totalChapas
      }
    })

    return res.json(pedidosFormatados)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de expedição"
    })
  }
}