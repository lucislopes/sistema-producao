function inicioDoDia(valor) {
  const data = new Date(valor)
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime()
}

export function calcularDiasParaEntrega(dataEntrega, dataReferencia = new Date()) {
  if (!dataEntrega) return null
  return Math.round((inicioDoDia(dataEntrega) - inicioDoDia(dataReferencia)) / 86400000)
}

export function classificarPrevisaoEntrega(diasParaEntrega) {
  if (diasParaEntrega === null) return "SEM_PREVISAO"
  if (diasParaEntrega < 0) return "ATRASADO"
  if (diasParaEntrega === 0) return "HOJE"
  if (diasParaEntrega <= 7) return "PROXIMOS_7_DIAS"
  return "FUTURO"
}

export function consolidarCarteiraPedidos(pedidos, { dataReferencia = new Date() } = {}) {
  const dados = pedidos.map((pedido) => {
    const diasParaEntrega = calcularDiasParaEntrega(pedido.dataEntrega, dataReferencia)
    return {
      ...pedido,
      valorTotal: Number(pedido.valorTotal || 0),
      diasParaEntrega,
      previsao: classificarPrevisaoEntrega(diasParaEntrega)
    }
  }).sort((a, b) => {
    if (a.diasParaEntrega === null && b.diasParaEntrega !== null) return 1
    if (a.diasParaEntrega !== null && b.diasParaEntrega === null) return -1
    if (a.diasParaEntrega !== b.diasParaEntrega) return a.diasParaEntrega - b.diasParaEntrega
    return b.valorTotal - a.valorTotal
  })

  const totalValor = (itens) => Number(itens.reduce((total, item) => total + item.valorTotal, 0).toFixed(2))
  const atrasados = dados.filter((item) => item.previsao === "ATRASADO")
  const proximos = dados.filter((item) => ["HOJE", "PROXIMOS_7_DIAS"].includes(item.previsao))
  const semPrevisao = dados.filter((item) => item.previsao === "SEM_PREVISAO")

  return {
    resumo: {
      totalPedidos: dados.length,
      valorCarteira: totalValor(dados),
      pedidosAtrasados: atrasados.length,
      valorAtrasado: totalValor(atrasados),
      proximosSeteDias: proximos.length,
      valorProximosSeteDias: totalValor(proximos),
      semPrevisao: semPrevisao.length
    },
    porStatus: Object.values(dados.reduce((grupos, item) => {
      if (!grupos[item.status]) grupos[item.status] = { status: item.status, pedidos: 0, valor: 0 }
      grupos[item.status].pedidos += 1
      grupos[item.status].valor += item.valorTotal
      return grupos
    }, {})).map((item) => ({ ...item, valor: Number(item.valor.toFixed(2)) })),
    dados
  }
}
