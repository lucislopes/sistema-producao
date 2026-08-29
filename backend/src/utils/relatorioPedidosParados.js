function inicioDoDia(valor) {
  const data = new Date(valor)
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime()
}

export function calcularDiasSemMudanca(dataUltimaMudanca, dataReferencia = new Date()) {
  if (!dataUltimaMudanca) return 0
  return Math.max(0, Math.floor((inicioDoDia(dataReferencia) - inicioDoDia(dataUltimaMudanca)) / 86400000))
}

export function classificarParalisacao(dias) {
  if (dias >= 15) return "CRITICO"
  if (dias >= 7) return "ALTO"
  if (dias >= 3) return "ATENCAO"
  return "RECENTE"
}

export function consolidarPedidosParados(pedidos, { minimoDias = 3, dataReferencia = new Date() } = {}) {
  const dados = pedidos
    .map((pedido) => {
      const diasParado = calcularDiasSemMudanca(pedido.dataUltimaMudancaStatus, dataReferencia)
      return { ...pedido, diasParado, nivel: classificarParalisacao(diasParado) }
    })
    .filter((pedido) => pedido.diasParado >= Number(minimoDias || 0))
    .sort((a, b) => b.diasParado - a.diasParado)

  const somaDias = dados.reduce((total, item) => total + item.diasParado, 0)

  return {
    resumo: {
      total: dados.length,
      atencao: dados.filter((item) => item.nivel === "ATENCAO").length,
      alto: dados.filter((item) => item.nivel === "ALTO").length,
      critico: dados.filter((item) => item.nivel === "CRITICO").length,
      mediaDias: dados.length ? Number((somaDias / dados.length).toFixed(1)) : 0,
      maiorTempo: dados[0]?.diasParado || 0
    },
    dados
  }
}
