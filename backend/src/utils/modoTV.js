function inicioDoDia(valor) {
  const data = new Date(valor)
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime()
}

function numeroPedido(pedido) {
  return pedido.origemPedido === "EXTERNO" && pedido.numeroPedidoManual
    ? pedido.numeroPedidoManual
    : `#${pedido.numeroPedido}`
}

export function consolidarModoTV(servicos, { dataReferencia = new Date(), pedidosAtivos = [] } = {}) {
  const hoje = inicioDoDia(dataReferencia)
  const pedidos = new Map()
  const planos = new Map()

  for (const servico of servicos) {
    const plano = servico.plano
    const pedido = plano?.pedido
    if (!pedido) continue
    pedidos.set(pedido.id, pedido)
    if (plano?.id) planos.set(plano.id, plano)
  }

  const pedidosLista = [...pedidos.values()]
  const pedidosResumo = pedidosAtivos.length ? pedidosAtivos : pedidosLista
  const fila = servicos
    .filter((servico) => ["ABERTO", "INICIADO"].includes(servico.status))
    .map((servico) => {
      const pedido = servico.plano.pedido
      const diasPrazo = pedido.dataEntrega
        ? Math.round((inicioDoDia(pedido.dataEntrega) - hoje) / 86400000)
        : null
      return {
        id: servico.id,
        status: servico.status,
        servico: servico.tipoServico?.nome || "Serviço",
        operador: servico.operador?.nome || null,
        plano: servico.plano.numeroPlano,
        chapas: Number(servico.plano.quantidadeChapas || 0),
        pedidoId: pedido.id,
        pedido: numeroPedido(pedido),
        cliente: pedido.cliente?.nome || "Cliente não informado",
        dataEntrega: pedido.dataEntrega,
        diasPrazo,
        atrasado: diasPrazo !== null && diasPrazo < 0
      }
    })
    .sort((a, b) => {
      if (a.diasPrazo === null && b.diasPrazo !== null) return 1
      if (a.diasPrazo !== null && b.diasPrazo === null) return -1
      if (a.diasPrazo !== b.diasPrazo) return a.diasPrazo - b.diasPrazo
      if (a.status !== b.status) return a.status === "INICIADO" ? -1 : 1
      return a.pedido.localeCompare(b.pedido)
    })

  return {
    resumo: {
      pedidosSeparacao: pedidosResumo.filter((pedido) => pedido.status === "EM_SEPARACAO").length,
      pedidosProducao: pedidosResumo.filter((pedido) => pedido.status === "EM_PRODUCAO").length,
      pedidosProntos: pedidosResumo.filter((pedido) => pedido.status === "PRONTO_ENTREGA").length,
      pedidosAtrasados: pedidosResumo.filter((pedido) => pedido.dataEntrega && inicioDoDia(pedido.dataEntrega) < hoje).length,
      servicosAbertos: servicos.filter((servico) => servico.status === "ABERTO").length,
      servicosIniciados: servicos.filter((servico) => servico.status === "INICIADO").length,
      concluidosHoje: servicos.filter((servico) => servico.status === "CONCLUIDO" && servico.dataFim && inicioDoDia(servico.dataFim) === hoje).length,
      chapasAtivas: [...planos.values()].reduce((total, plano) => total + Number(plano.quantidadeChapas || 0), 0),
      operadoresAtivos: new Set(servicos.filter((servico) => servico.status === "INICIADO" && servico.operadorId).map((servico) => servico.operadorId)).size
    },
    fila
  }
}
