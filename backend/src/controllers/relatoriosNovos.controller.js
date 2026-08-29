import { prisma } from "../lib/prisma.js"
import { consolidarRelatorioComercial } from "../utils/relatorioComercial.js"
import { consolidarPontualidade } from "../utils/relatorioPontualidade.js"

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
