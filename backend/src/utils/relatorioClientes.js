const STATUS_ATIVOS = new Set(["ABERTO", "EM_SEPARACAO", "EM_PRODUCAO", "PRONTO_ENTREGA", "SAIU_ENTREGA"])

function inicioDoDia(valor) {
  const data = new Date(valor)
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime()
}

export function calcularDiasSemComprar(ultimoPedido, dataReferencia = new Date()) {
  if (!ultimoPedido) return null
  return Math.max(0, Math.floor((inicioDoDia(dataReferencia) - inicioDoDia(ultimoPedido)) / 86400000))
}

export function consolidarRelatorioClientes(
  pedidos,
  { ultimosPedidos = {}, minimoDiasSemComprar = 0, dataReferencia = new Date() } = {}
) {
  const clientes = new Map()

  for (const pedido of pedidos) {
    const cliente = pedido.cliente
    if (!cliente) continue

    if (!clientes.has(cliente.id)) {
      clientes.set(cliente.id, {
        clienteId: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone || null,
        totalPedidos: 0,
        pedidosValidos: 0,
        valorComprado: 0,
        entregues: 0,
        ativos: 0,
        atrasadosAtuais: 0,
        cancelados: 0
      })
    }

    const item = clientes.get(cliente.id)
    item.totalPedidos += 1

    if (pedido.status === "CANCELADO") {
      item.cancelados += 1
      continue
    }

    item.pedidosValidos += 1
    item.valorComprado += Number(pedido.valorTotal || 0)
    if (pedido.status === "ENTREGUE") item.entregues += 1
    if (STATUS_ATIVOS.has(pedido.status)) {
      item.ativos += 1
      if (pedido.dataEntrega && inicioDoDia(pedido.dataEntrega) < inicioDoDia(dataReferencia)) {
        item.atrasadosAtuais += 1
      }
    }
  }

  const dados = [...clientes.values()]
    .map((item) => {
      const ultimoPedido = ultimosPedidos[item.clienteId] || null
      return {
        ...item,
        valorComprado: Number(item.valorComprado.toFixed(2)),
        ticketMedio: item.pedidosValidos
          ? Number((item.valorComprado / item.pedidosValidos).toFixed(2))
          : 0,
        ultimoPedido,
        diasSemComprar: calcularDiasSemComprar(ultimoPedido, dataReferencia)
      }
    })
    .filter((item) => !minimoDiasSemComprar || (item.diasSemComprar ?? -1) >= Number(minimoDiasSemComprar))
    .sort((a, b) => b.valorComprado - a.valorComprado || b.pedidosValidos - a.pedidosValidos || a.nome.localeCompare(b.nome))

  const valorTotal = dados.reduce((total, item) => total + item.valorComprado, 0)
  const pedidosValidos = dados.reduce((total, item) => total + item.pedidosValidos, 0)

  return {
    resumo: {
      totalClientes: dados.length,
      valorTotal: Number(valorTotal.toFixed(2)),
      ticketMedio: pedidosValidos ? Number((valorTotal / pedidosValidos).toFixed(2)) : 0,
      clientesRecorrentes: dados.filter((item) => item.pedidosValidos >= 2).length,
      clientesComAtrasos: dados.filter((item) => item.atrasadosAtuais > 0).length
    },
    dados
  }
}
