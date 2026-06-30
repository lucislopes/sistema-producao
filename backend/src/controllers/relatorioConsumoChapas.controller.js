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

function formatarPedidoConsumo(pedido) {
  const chapasProducao = pedido.planos.reduce(
    (total, plano) => total + Number(plano.quantidadeChapas || 0),
    0
  )

  const chapasDiretoEntrega = Number(
    pedido.quantidadeChapasDiretoEntrega || 0
  )

  const totalChapas =
    pedido.tipoPedido === "DIRETO_ENTREGA"
      ? chapasDiretoEntrega
      : chapasProducao

  return {
    id: pedido.id,
    numeroPedido: pedido.numeroPedido,
    numeroPedidoManual: pedido.numeroPedidoManual,
    origemPedido: pedido.origemPedido,
    dataPedido: pedido.dataPedido,
    dataEntrega: pedido.dataEntrega,
    status: pedido.status,
    tipoPedido: pedido.tipoPedido,
    cliente: pedido.cliente,
    vendedor: pedido.vendedor,
    totalChapas
  }
}

export async function relatorioConsumoChapas(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      vendedorId,
      clienteId,
      tipoPedido,
      page = 1,
      limit = 50
    } = req.query

    const paginaAtual = Number(page) || 1
    const limite = Number(limit) || 50
    const skip = (paginaAtual - 1) * limite

    const where = {
      status: {
        not: "CANCELADO"
      }
    }

    if (dataInicio || dataFim) {
      where.dataPedido = {}

      if (dataInicio) {
        where.dataPedido.gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        where.dataPedido.lte = criarDataLocal(dataFim, true)
      }
    }

    if (vendedorId) {
      where.vendedorId = vendedorId
    }

    if (clienteId) {
      where.clienteId = clienteId
    }

    if (tipoPedido) {
      where.tipoPedido = tipoPedido
    }

    const includePedido = {
      cliente: true,
      vendedor: true,
      planos: {
        select: {
          id: true,
          numeroPlano: true,
          quantidadeChapas: true
        }
      }
    }

    const [pedidosResumo, pedidosPagina, totalRegistros] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: includePedido,
        orderBy: {
          dataPedido: "asc"
        }
      }),

      prisma.pedido.findMany({
        where,
        include: includePedido,
        orderBy: {
          dataPedido: "asc"
        },
        skip,
        take: limite
      }),

      prisma.pedido.count({
        where
      })
    ])

    const dadosResumo = pedidosResumo.map(formatarPedidoConsumo)
    const dados = pedidosPagina.map(formatarPedidoConsumo)

    const totalChapas = dadosResumo.reduce(
      (total, item) => total + item.totalChapas,
      0
    )

    const totalProducao = dadosResumo
      .filter((item) => item.tipoPedido === "COM_PRODUCAO")
      .reduce((total, item) => total + item.totalChapas, 0)

    const totalChapaInteira = dadosResumo
      .filter((item) => item.tipoPedido === "DIRETO_ENTREGA")
      .reduce((total, item) => total + item.totalChapas, 0)

    const pedidosComChapas = dadosResumo.filter(
      (item) => item.totalChapas > 0
    )

    const clientesAtendidos = new Set(
      dadosResumo.map((item) => item.cliente?.id).filter(Boolean)
    ).size

    const mediaPorPedido =
      pedidosComChapas.length > 0
        ? totalChapas / pedidosComChapas.length
        : 0

    const porVendedorMap = {}

    dadosResumo.forEach((item) => {
      const vendedorNome = item.vendedor?.nome || "Sem vendedor"

      if (!porVendedorMap[vendedorNome]) {
        porVendedorMap[vendedorNome] = 0
      }

      porVendedorMap[vendedorNome] += item.totalChapas
    })

    const porVendedor = Object.entries(porVendedorMap)
      .map(([nome, chapas]) => ({
        nome,
        chapas
      }))
      .sort((a, b) => b.chapas - a.chapas)

    const porDiaMap = {}

    dadosResumo.forEach((item) => {
      const dia = item.dataPedido.toISOString().substring(0, 10)

      if (!porDiaMap[dia]) {
        porDiaMap[dia] = 0
      }

      porDiaMap[dia] += item.totalChapas
    })

    const porDia = Object.entries(porDiaMap).map(([data, chapas]) => ({
      data,
      chapas
    }))

    return res.json({
      dados,
      resumo: {
        totalChapas,
        totalProducao,
        totalChapaInteira,
        totalPedidos: totalRegistros,
        clientesAtendidos,
        mediaPorPedido
      },
      porVendedor,
      porDia,
      paginacao: {
        total: totalRegistros,
        page: paginaAtual,
        limit: limite,
        totalPages: Math.ceil(totalRegistros / limite)
      }
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de consumo de chapas"
    })
  }
}