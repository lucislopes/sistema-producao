export function montarConsultaPedidos(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100)
  const skip = (page - 1) * limit
  const where = {}

  if (query.somenteAtivos === "true") {
    where.status = { notIn: ["ENTREGUE", "CANCELADO"] }
  }

  if (query.status) where.status = query.status
  if (query.frete === "ALTERADO") where.freteAlterado = true
  if (query.frete === "CORRETO") where.freteAlterado = false
  if (query.vendedorId) where.vendedorId = query.vendedorId

  const textoBusca = query.busca?.trim()

  if (textoBusca) {
    const numeroPedido = Number(textoBusca.replace(/^#/, ""))

    where.OR = [
      { numeroPedidoManual: { contains: textoBusca, mode: "insensitive" } },
      { cliente: { nome: { contains: textoBusca, mode: "insensitive" } } },
      { vendedor: { nome: { contains: textoBusca, mode: "insensitive" } } },
      ...(!Number.isNaN(numeroPedido) ? [{ numeroPedido }] : [])
    ]
  }

  if (query.dataInicio || query.dataFim) {
    where.dataEntrega = {}

    if (query.dataInicio) {
      where.dataEntrega.gte = new Date(`${query.dataInicio}T00:00:00.000Z`)
    }

    if (query.dataFim) {
      const limiteFim = new Date(`${query.dataFim}T00:00:00.000Z`)
      limiteFim.setUTCDate(limiteFim.getUTCDate() + 1)
      where.dataEntrega.lt = limiteFim
    }
  }

  return { page, limit, skip, where }
}
