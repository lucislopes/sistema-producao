import { prisma } from "../lib/prisma.js"

const filtroHistoricoEntrega = {
  tipo: "EXPEDICAO_ATUALIZADA",
  descricao: { contains: "para ENTREGUE", mode: "insensitive" }
}

function somenteData(data) {
  if (!data) return null
  return Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())
}

function calcularSituacaoPrazo(dataPrevista, dataRealizada) {
  if (!dataRealizada) return "Sem registro de entrega"
  if (!dataPrevista) return "Sem data prevista"
  return somenteData(dataRealizada) > somenteData(dataPrevista)
    ? "Entregue com atraso"
    : "Entregue no prazo"
}

export async function relatorioPedidosEntregues(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      baseData = "realizada",
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

    const campoData = baseData === "pedido" ? "dataPedido" : "dataEntrega"

    if (dataInicio || dataFim) {
      const intervalo = {}
      if (dataInicio) intervalo.gte = criarDataLocal(dataInicio, false)
      if (dataFim) intervalo.lte = criarDataLocal(dataFim, true)

      if (baseData === "realizada") {
        where.historicos = {
          some: {
            ...filtroHistoricoEntrega,
            createdAt: intervalo
          }
        }
      } else {
        where[campoData] = intervalo
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

    const incluirRelacionamentos = {
      cliente: true,
      vendedor: true,
      rota: true,
      historicos: {
        where: filtroHistoricoEntrega,
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1
      }
    }

    const [pedidos, total, pedidosResumo] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: incluirRelacionamentos,
        orderBy,
        skip,
        take: limite
      }),

      prisma.pedido.count({
        where
      }),

      prisma.pedido.findMany({
        where,
        select: {
          dataEntrega: true,
          valorTotal: true,
          historicos: {
            where: filtroHistoricoEntrega,
            select: { createdAt: true },
            orderBy: { createdAt: "asc" },
            take: 1
          }
        }
      })
    ])

    const pedidosComPrazo = pedidos.map(({ historicos, ...pedido }) => {
      const dataEntregaReal = historicos[0]?.createdAt || null
      return {
        ...pedido,
        dataEntregaReal,
        situacaoPrazo: calcularSituacaoPrazo(pedido.dataEntrega, dataEntregaReal)
      }
    })

    const resumo = pedidosResumo.reduce((acc, pedido) => {
      const dataEntregaReal = pedido.historicos[0]?.createdAt || null
      const situacao = calcularSituacaoPrazo(pedido.dataEntrega, dataEntregaReal)
      if (situacao === "Entregue no prazo") acc.noPrazo += 1
      if (situacao === "Entregue com atraso") acc.comAtraso += 1
      if (!dataEntregaReal) acc.semRegistro += 1
      if (!["Entregue no prazo", "Entregue com atraso"].includes(situacao)) {
        acc.semClassificacao += 1
      }
      acc.valorTotal += Number(pedido.valorTotal || 0)
      return acc
    }, { total, noPrazo: 0, comAtraso: 0, semRegistro: 0, semClassificacao: 0, valorTotal: 0 })

    return res.json({
      baseData,
      campoData,
      dados: pedidosComPrazo,
      resumo,
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
      error: "Erro ao gerar relatório de pedidos entregues"
    })
  }
}
