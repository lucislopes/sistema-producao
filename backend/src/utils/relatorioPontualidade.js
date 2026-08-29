function somenteData(valor, usarUTC = false) {
  if (!valor) return null

  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-").map(Number)
    return Date.UTC(ano, mes - 1, dia)
  }

  const data = new Date(valor)
  return usarUTC
    ? Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())
    : Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
}

export function classificarEntrega(pedido) {
  if (!pedido.dataEntrega) return { situacao: "SEM_DATA_PREVISTA", diasDiferenca: null }
  if (!pedido.dataEntregaReal) return { situacao: "SEM_REGISTRO_ENTREGA", diasDiferenca: null }

  const prevista = somenteData(pedido.dataEntrega, true)
  const realizada = somenteData(pedido.dataEntregaReal)
  const diasDiferenca = Math.round((realizada - prevista) / 86400000)

  return {
    situacao: diasDiferenca > 0 ? "COM_ATRASO" : "NO_PRAZO",
    diasDiferenca
  }
}

export function consolidarPontualidade(pedidos) {
  const dados = pedidos.map((pedido) => ({
    ...pedido,
    ...classificarEntrega(pedido)
  }))

  const avaliados = dados.filter((item) => ["NO_PRAZO", "COM_ATRASO"].includes(item.situacao))
  const noPrazo = avaliados.filter((item) => item.situacao === "NO_PRAZO").length
  const comAtraso = avaliados.filter((item) => item.situacao === "COM_ATRASO")
  const totalDiasAtraso = comAtraso.reduce((total, item) => total + item.diasDiferenca, 0)

  return {
    resumo: {
      totalEntregues: dados.length,
      avaliados: avaliados.length,
      noPrazo,
      comAtraso: comAtraso.length,
      semRegistro: dados.filter((item) => item.situacao === "SEM_REGISTRO_ENTREGA").length,
      semDataPrevista: dados.filter((item) => item.situacao === "SEM_DATA_PREVISTA").length,
      percentualNoPrazo: avaliados.length ? Number(((noPrazo / avaliados.length) * 100).toFixed(1)) : 0,
      mediaDiasAtraso: comAtraso.length ? Number((totalDiasAtraso / comAtraso.length).toFixed(1)) : 0
    },
    dados
  }
}
