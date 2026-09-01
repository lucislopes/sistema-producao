import { prisma } from "../lib/prisma.js"

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

function calcularSituacaoPrazo(pedido, hoje) {
  if (!pedido.dataEntrega) {
    return "Sem data"
  }

  const statusContaAtrasoProducao = [
    "ABERTO",
    "EM_SEPARACAO",
    "EM_PRODUCAO"
  ]

  if (!statusContaAtrasoProducao.includes(pedido.status)) {
    return "Produção finalizada"
  }

  const dataEntrega = new Date(
    pedido.dataEntrega.getFullYear(),
    pedido.dataEntrega.getMonth(),
    pedido.dataEntrega.getDate()
  )

  if (dataEntrega < hoje) {
    return "Atrasado"
  }

  if (dataEntrega.getTime() === hoje.getTime()) {
    return "Último dia"
  }

  return "No prazo"
}

export async function relatorioPedidos(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      baseData = "entrega",
      pedido,
      cliente,
      vendedorId,
      status,
      prazo,
      busca,
      page = 1,
      limit = 50
    } = req.query

    const paginaAtual = Number(page) || 1
    const limite = Number(limit) || 50
    const skip = (paginaAtual - 1) * limite

    const where = {}

    const statusEmAndamento = [
      "ABERTO",
      "EM_SEPARACAO",
      "EM_PRODUCAO"
    ]

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

    if (pedido) {
      where.OR = [
        {
          numeroPedido: Number(pedido) || -1
        },
        {
          numeroPedidoManual: {
            contains: pedido,
            mode: "insensitive"
          }
        }
      ]
    }

    if (cliente) {
      where.cliente = {
        nome: {
          contains: cliente,
          mode: "insensitive"
        }
      }
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

    if (vendedorId) {
      where.vendedorId = vendedorId
    }

    if (status) {
      if (!statusEmAndamento.includes(status)) {
        return res.status(400).json({
          error: "Este relatório exibe somente pedidos em aberto ou em produção"
        })
      }

      where.status = status
    } else {
      where.status = {
        in: statusEmAndamento
      }
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    if (prazo === "ATRASADO") {
      where.dataEntrega = {
        ...(where.dataEntrega || {}),
        lt: hoje
      }
    }

    const orderBy =
      campoData === "dataPedido"
        ? [
            { dataPedido: "asc" },
            { numeroPedido: "asc" }
          ]
        : [
            { dataEntrega: "asc" },
            { numeroPedido: "asc" }
          ]

    const [pedidos, total, resumoStatus, resumoValores] = await Promise.all([
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
      }),

      prisma.pedido.groupBy({
        by: ["status"],
        where,
        _count: { _all: true }
      }),

      prisma.pedido.aggregate({
        where,
        _sum: { valorTotal: true }
      })
    ])

    const pedidosComPrazo = pedidos.map((pedido) => ({
      ...pedido,
      situacaoPrazo: calcularSituacaoPrazo(pedido, hoje)
    }))

    return res.json({
      baseData,
      campoData,
      dados: pedidosComPrazo,
      resumo: {
        total,
        abertos: resumoStatus.find((item) => item.status === "ABERTO")?._count?._all || 0,
        emSeparacao: resumoStatus.find((item) => item.status === "EM_SEPARACAO")?._count?._all || 0,
        emProducao: resumoStatus.find((item) => item.status === "EM_PRODUCAO")?._count?._all || 0,
        atrasados: prazo === "ATRASADO"
          ? total
          : await prisma.pedido.count({
              where: {
                ...where,
                dataEntrega: {
                  ...(where.dataEntrega || {}),
                  lt: hoje
                }
              }
            }),
        valorTotal: resumoValores._sum.valorTotal || 0
      },
      paginacao: {
        total,
        page: paginaAtual,
        limit: limite,
        totalPages: Math.max(1, Math.ceil(total / limite))
      }
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de pedidos"
    })
  }
}
