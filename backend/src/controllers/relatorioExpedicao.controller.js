import { prisma } from "../lib/prisma.js"

function criarDataLocal(dataTexto, fimDoDia = false) {
  const [ano, mes, dia] = dataTexto.split("-")

  const data = new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia)
  )

  if (fimDoDia) {
    data.setHours(23, 59, 59, 999)
  } else {
    data.setHours(0, 0, 0, 0)
  }

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
                : [])
            ]
          }
        : {})
    }

    if (dataInicio || dataFim) {
      where.dataEntrega = {}

      if (dataInicio) {
        where.dataEntrega.gte = new Date(`${dataInicio}T03:00:00.000Z`)
      }

      if (dataFim) {
        where.dataEntrega.lte = new Date(`${dataFim}T23:59:59.999-03:00`)
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

    return res.json(pedidos)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de expedição"
    })
  }
}