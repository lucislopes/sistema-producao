const STATUS_EM_ANDAMENTO = ["ABERTO", "EM_SEPARACAO", "EM_PRODUCAO", "PRONTO_ENTREGA", "SAIU_ENTREGA"]

function pedidoEstaAtrasado(pedido, hoje) {
  if (!pedido.dataEntrega || !STATUS_EM_ANDAMENTO.includes(pedido.status)) return false

  const entrega = new Date(pedido.dataEntrega)
  entrega.setHours(0, 0, 0, 0)

  return entrega < hoje
}

export function consolidarRelatorioComercial(pedidos, dataReferencia = new Date()) {
  const hoje = new Date(dataReferencia)
  hoje.setHours(0, 0, 0, 0)

  const vendedores = new Map()

  for (const pedido of pedidos) {
    const vendedorId = pedido.vendedor?.id || pedido.vendedorId || "SEM_VENDEDOR"
    const nome = pedido.vendedor?.nome || "Sem vendedor"

    if (!vendedores.has(vendedorId)) {
      vendedores.set(vendedorId, {
        vendedorId,
        vendedor: nome,
        totalPedidos: 0,
        pedidosValidos: 0,
        valorVendido: 0,
        entregues: 0,
        cancelados: 0,
        emAndamento: 0,
        atrasados: 0
      })
    }

    const item = vendedores.get(vendedorId)
    item.totalPedidos += 1

    if (pedido.status === "CANCELADO") {
      item.cancelados += 1
    } else {
      item.pedidosValidos += 1
      item.valorVendido += Number(pedido.valorTotal || 0)
    }

    if (pedido.status === "ENTREGUE") item.entregues += 1
    if (STATUS_EM_ANDAMENTO.includes(pedido.status)) item.emAndamento += 1
    if (pedidoEstaAtrasado(pedido, hoje)) item.atrasados += 1
  }

  const dados = Array.from(vendedores.values())
    .map((item) => ({
      ...item,
      valorVendido: Number(item.valorVendido.toFixed(2)),
      ticketMedio: item.pedidosValidos
        ? Number((item.valorVendido / item.pedidosValidos).toFixed(2))
        : 0
    }))
    .sort((a, b) => b.valorVendido - a.valorVendido || b.totalPedidos - a.totalPedidos)

  const resumo = dados.reduce(
    (total, item) => ({
      totalPedidos: total.totalPedidos + item.totalPedidos,
      pedidosValidos: total.pedidosValidos + item.pedidosValidos,
      valorVendido: total.valorVendido + item.valorVendido,
      entregues: total.entregues + item.entregues,
      cancelados: total.cancelados + item.cancelados,
      emAndamento: total.emAndamento + item.emAndamento,
      atrasados: total.atrasados + item.atrasados
    }),
    { totalPedidos: 0, pedidosValidos: 0, valorVendido: 0, entregues: 0, cancelados: 0, emAndamento: 0, atrasados: 0 }
  )

  resumo.valorVendido = Number(resumo.valorVendido.toFixed(2))
  resumo.ticketMedio = resumo.pedidosValidos
    ? Number((resumo.valorVendido / resumo.pedidosValidos).toFixed(2))
    : 0

  return { resumo, dados }
}
