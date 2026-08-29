import { prisma } from "../lib/prisma.js"
import { consolidarRelatorioComercial } from "../utils/relatorioComercial.js"

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
