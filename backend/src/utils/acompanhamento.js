export const statusPublicos = {
  ABERTO: "Pedido recebido", EM_SEPARACAO: "Em separação",
  EM_PRODUCAO: "Em produção", CONCLUIDO: "Produção concluída",
  PRONTO_ENTREGA: "Pronto para entrega ou retirada", SAIU_ENTREGA: "Saiu para entrega",
  ENTREGUE: "Entregue", CANCELADO: "Cancelado"
}

export function documentoConfere(documento, prefixo) {
  const digitos = String(documento || "").replace(/\D/g, "")
  return [11, 14].includes(digitos.length) && /^\d{5}$/.test(prefixo) && digitos.startsWith(prefixo)
}

export function consultaPublica(body) {
  if (!body || typeof body.documento !== "string" || !/^\d{5}$/.test(body.documento)) return null
  if (typeof body.pedidoId === "string" && /^[a-z0-9]{20,40}$/.test(body.pedidoId)) {
    return { id: body.pedidoId }
  }
  if (body.pedidoId) return null
  if (typeof body.numero !== "string") return null
  const numero = body.numero.trim().replace(/^#/, "")
  if (!numero || numero.length > 80) return null
  const interno = /^\d+$/.test(numero) && Number(numero) > 0 && Number(numero) <= 2147483647
  return { OR: [
    { origemPedido: "EXTERNO", numeroPedidoManual: numero },
    ...(interno ? [{ numeroPedido: Number(numero), origemPedido: "INTERNO" }] : [])
  ] }
}

export function resumoPublico(pedido) {
  const historico = pedido.historicos.map((item) => ({
    data: item.createdAt,
    tipo: item.tipo,
    descricao: item.descricao,
    usuario: item.usuario?.funcionario?.nome || null
  }))
  return {
    numero: pedido.origemPedido === "EXTERNO" ? pedido.numeroPedidoManual : String(pedido.numeroPedido),
    status: statusPublicos[pedido.status] || "Em acompanhamento",
    dataEntrega: pedido.dataEntrega,
    tipoEntrega: pedido.tipoEntrega === "CLIENTE_RETIRA" ? "Retirada pelo cliente" : "Entrega pela empresa",
    historico
  }
}

// Limites por IP e por pedido; memória limitada, sem gravar no banco.
export function criarLimitadorConsulta({ agora = Date.now, limite = 15, capacidade = 10000 } = {}) {
  const registros = new Map()
  return (req, res, next) => {
    const tempo = agora()
    for (const [chave, registro] of registros) if (registro.ate <= tempo) registros.delete(chave)
    const alvo = consultaPublica(req.body)
    const chaves = [`ip:${req.ip || req.socket?.remoteAddress}`]
    if (alvo) chaves.push(`pedido:${JSON.stringify(alvo)}`)
    if (registros.size + chaves.filter((chave) => !registros.has(chave)).length > capacidade ||
      chaves.some((chave) => (registros.get(chave)?.total || 0) >= limite)) {
      res.setHeader("Retry-After", "900")
      return res.status(429).json({ error: "Muitas consultas. Aguarde 15 minutos e tente novamente." })
    }
    for (const chave of chaves) {
      const registro = registros.get(chave) || { total: 0, ate: tempo + 15 * 60 * 1000 }
      registro.total++
      registros.set(chave, registro)
    }
    next()
  }
}

export function criarConsultaAcompanhamento(prisma) {
  return async (req, res) => {
    const where = consultaPublica(req.body)
    const naoEncontrado = () => res.status(404).json({ error: "Não foi possível localizar o pedido com os dados informados." })
    if (!where) return naoEncontrado()
    try {
      const candidatos = await prisma.pedido.findMany({
        where, take: 3, select: { id: true, cliente: { select: { documento: true } } }
      })
      const encontrados = candidatos.filter((pedido) => documentoConfere(pedido.cliente?.documento, req.body.documento))
      if (encontrados.length !== 1) return naoEncontrado()
      const pedido = await prisma.pedido.findUnique({
        where: { id: encontrados[0].id },
        select: {
          numeroPedido: true, numeroPedidoManual: true, origemPedido: true,
          status: true, dataEntrega: true, tipoEntrega: true,
          historicos: {
            select: {
              tipo: true, descricao: true, createdAt: true,
              usuario: { select: { funcionario: { select: { nome: true } } } }
            },
            orderBy: { createdAt: "desc" }
          }
        }
      })
      return pedido ? res.json(resumoPublico(pedido)) : naoEncontrado()
    } catch {
      return res.status(500).json({ error: "Não foi possível consultar agora. Tente novamente mais tarde." })
    }
  }
}
