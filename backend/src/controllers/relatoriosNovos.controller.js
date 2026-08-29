import { prisma } from "../lib/prisma.js"
import { consolidarRelatorioComercial } from "../utils/relatorioComercial.js"
import { consolidarPontualidade } from "../utils/relatorioPontualidade.js"
import { consolidarPedidosParados } from "../utils/relatorioPedidosParados.js"
import { consolidarRelatorioClientes } from "../utils/relatorioClientes.js"

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

export async function relatorioComercialVendedores(req, res) {
  try {
    const { dataInicio, dataFim, vendedorId } = req.query
    const where = {}

    if (dataInicio || dataFim) {
      where.dataPedido = {}
      if (dataInicio) where.dataPedido.gte = criarDataLocal(dataInicio)
      if (dataFim) where.dataPedido.lte = criarDataLocal(dataFim, true)
    }

    if (vendedorId) where.vendedorId = vendedorId

    const pedidos = await prisma.pedido.findMany({
      where,
      select: {
        vendedorId: true,
        valorTotal: true,
        status: true,
        dataEntrega: true,
        vendedor: {
          select: { id: true, nome: true }
        }
      }
    })

    return res.json({
      ...consolidarRelatorioComercial(pedidos),
      periodo: { dataInicio: dataInicio || null, dataFim: dataFim || null }
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Erro ao gerar relatório comercial" })
  }
}

export async function relatorioPontualidadeEntregas(req, res) {
  try {
    const { dataInicio, dataFim, vendedorId, rotaId } = req.query
    const where = { status: "ENTREGUE" }

    if (dataInicio || dataFim) {
      where.dataEntrega = {}
      if (dataInicio) where.dataEntrega.gte = criarDataLocal(dataInicio)
      if (dataFim) where.dataEntrega.lte = criarDataLocal(dataFim, true)
    }

    if (vendedorId) where.vendedorId = vendedorId
    if (rotaId) where.rotaId = rotaId

    const pedidos = await prisma.pedido.findMany({
      where,
      select: {
        id: true,
        numeroPedido: true,
        numeroPedidoManual: true,
        origemPedido: true,
        dataEntrega: true,
        tipoEntrega: true,
        cliente: { select: { nome: true } },
        vendedor: { select: { id: true, nome: true } },
        rota: { select: { id: true, nome: true } },
        historicos: {
          where: {
            tipo: "EXPEDICAO_ATUALIZADA",
            descricao: { contains: "para ENTREGUE", mode: "insensitive" }
          },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
          take: 1
        }
      },
      orderBy: [{ dataEntrega: "desc" }, { numeroPedido: "desc" }]
    })

    const normalizados = pedidos.map(({ historicos, ...pedido }) => ({
      ...pedido,
      dataEntregaReal: historicos[0]?.createdAt || null
    }))

    return res.json({
      ...consolidarPontualidade(normalizados),
      periodo: { dataInicio: dataInicio || null, dataFim: dataFim || null }
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Erro ao gerar relatório de pontualidade" })
  }
}

export async function relatorioPedidosParados(req, res) {
  try {
    const { status, vendedorId, busca, minimoDias = 3 } = req.query
    const statusAtivos = ["ABERTO", "EM_SEPARACAO", "EM_PRODUCAO", "PRONTO_ENTREGA", "SAIU_ENTREGA"]
    const where = { status: status ? status : { in: statusAtivos } }

    if (status && !statusAtivos.includes(status)) {
      return res.status(400).json({ error: "Status inválido para pedidos ativos" })
    }
    if (vendedorId) where.vendedorId = vendedorId
    if (busca) {
      where.OR = [
        { cliente: { nome: { contains: busca, mode: "insensitive" } } },
        { numeroPedidoManual: { contains: busca, mode: "insensitive" } },
        ...(Number(busca) ? [{ numeroPedido: Number(busca) }] : [])
      ]
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      select: {
        id: true,
        numeroPedido: true,
        numeroPedidoManual: true,
        origemPedido: true,
        status: true,
        dataPedido: true,
        dataEntrega: true,
        createdAt: true,
        cliente: { select: { nome: true } },
        vendedor: { select: { id: true, nome: true } },
        historicos: {
          where: { tipo: { in: ["STATUS_PEDIDO_ALTERADO", "EXPEDICAO_ATUALIZADA"] } },
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    })

    const normalizados = pedidos.map(({ historicos, ...pedido }) => ({
      ...pedido,
      dataUltimaMudancaStatus: historicos[0]?.createdAt || pedido.createdAt,
      fonteUltimaMudanca: historicos.length ? "HISTORICO" : "CADASTRO"
    }))

    return res.json(consolidarPedidosParados(normalizados, { minimoDias: Number(minimoDias) || 0 }))
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Erro ao gerar relatório de pedidos parados" })
  }
}

export async function relatorioGerencialClientes(req, res) {
  try {
    const { dataInicio, dataFim, busca, minimoDiasSemComprar = 0 } = req.query
    const where = {}

    if (dataInicio || dataFim) {
      where.dataPedido = {}
      if (dataInicio) where.dataPedido.gte = criarDataLocal(dataInicio)
      if (dataFim) where.dataPedido.lte = criarDataLocal(dataFim, true)
    }
    if (busca) where.cliente = { nome: { contains: busca, mode: "insensitive" } }

    const pedidos = await prisma.pedido.findMany({
      where,
      select: {
        clienteId: true,
        status: true,
        valorTotal: true,
        dataEntrega: true,
        cliente: { select: { id: true, nome: true, telefone: true } }
      }
    })

    const clienteIds = [...new Set(pedidos.map((pedido) => pedido.clienteId))]
    const ultimos = clienteIds.length
      ? await prisma.pedido.groupBy({
          by: ["clienteId"],
          where: { clienteId: { in: clienteIds }, status: { not: "CANCELADO" } },
          _max: { dataPedido: true }
        })
      : []
    const ultimosPedidos = Object.fromEntries(ultimos.map((item) => [item.clienteId, item._max.dataPedido]))

    return res.json({
      ...consolidarRelatorioClientes(pedidos, {
        ultimosPedidos,
        minimoDiasSemComprar: Number(minimoDiasSemComprar) || 0
      }),
      periodo: { dataInicio: dataInicio || null, dataFim: dataFim || null }
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Erro ao gerar relatório gerencial de clientes" })
  }
}
