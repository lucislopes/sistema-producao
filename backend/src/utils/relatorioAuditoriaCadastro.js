const ORDEM_GRAVIDADE = { CRITICO: 3, ATENCAO: 2, INFORMATIVO: 1 }

export const TIPOS_INCONSISTENCIA = {
  SEM_VALOR: { texto: "Sem valor do pedido", gravidade: "CRITICO" },
  SEM_DATA_ENTREGA: { texto: "Sem data de entrega", gravidade: "CRITICO" },
  ENTREGA_SEM_ROTA: { texto: "Entrega sem rota", gravidade: "CRITICO" },
  ENTREGA_SEM_ENDERECO: { texto: "Entrega sem endereço", gravidade: "CRITICO" },
  ENTREGA_SEM_RECEBEDOR: { texto: "Entrega sem recebedor", gravidade: "ATENCAO" },
  ENTREGA_SEM_CONTATO: { texto: "Entrega sem contato", gravidade: "ATENCAO" },
  CLIENTE_SEM_TELEFONE: { texto: "Cliente sem telefone", gravidade: "INFORMATIVO" }
}

export function identificarInconsistencias(pedido) {
  const tipos = []
  if (pedido.valorTotal === null || pedido.valorTotal === undefined || Number(pedido.valorTotal) <= 0) tipos.push("SEM_VALOR")
  if (!pedido.dataEntrega) tipos.push("SEM_DATA_ENTREGA")

  if (pedido.tipoEntrega === "ENTREGA_EMPRESA") {
    if (!pedido.rotaId) tipos.push("ENTREGA_SEM_ROTA")
    if (!pedido.enderecoEntrega?.trim()) tipos.push("ENTREGA_SEM_ENDERECO")
    if (!pedido.nomeRecebedor?.trim()) tipos.push("ENTREGA_SEM_RECEBEDOR")
    if (!pedido.contatoRecebedor?.trim()) tipos.push("ENTREGA_SEM_CONTATO")
  }

  if (!pedido.cliente?.telefone?.trim()) tipos.push("CLIENTE_SEM_TELEFONE")
  return tipos.map((tipo) => ({ tipo, ...TIPOS_INCONSISTENCIA[tipo] }))
}

export function consolidarAuditoriaCadastro(pedidos, { tipo = "" } = {}) {
  const auditados = pedidos.map((pedido) => {
    const inconsistencias = identificarInconsistencias(pedido)
    const gravidade = inconsistencias.reduce(
      (maior, item) => ORDEM_GRAVIDADE[item.gravidade] > ORDEM_GRAVIDADE[maior] ? item.gravidade : maior,
      "INFORMATIVO"
    )
    return { ...pedido, inconsistencias, gravidade }
  })

  const dados = auditados
    .filter((pedido) => pedido.inconsistencias.length > 0)
    .filter((pedido) => !tipo || pedido.inconsistencias.some((item) => item.tipo === tipo))
    .sort((a, b) => ORDEM_GRAVIDADE[b.gravidade] - ORDEM_GRAVIDADE[a.gravidade] || b.inconsistencias.length - a.inconsistencias.length)

  return {
    resumo: {
      pedidosAuditados: pedidos.length,
      pedidosComInconsistencia: dados.length,
      totalInconsistencias: dados.reduce((total, item) => total + item.inconsistencias.length, 0),
      criticos: dados.filter((item) => item.gravidade === "CRITICO").length,
      semValor: dados.filter((item) => item.inconsistencias.some((inc) => inc.tipo === "SEM_VALOR")).length,
      entregaIncompleta: dados.filter((item) => item.inconsistencias.some((inc) => inc.tipo.startsWith("ENTREGA_SEM_"))).length
    },
    dados
  }
}
