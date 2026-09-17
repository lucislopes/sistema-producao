export const camposLimites = ["limiteFretesEmpresaDia", "limiteFretesClienteDia", "limiteChapasDia"]

export function normalizarLimites(body) {
  return Object.fromEntries(camposLimites.filter(campo => body[campo] !== undefined).map(campo => {
    const valor = body[campo]
    if (valor === null || valor === "") return [campo, null]
    if (!["number", "string"].includes(typeof valor) || !/^\d+$/.test(String(valor)) || !Number.isSafeInteger(Number(valor)) || Number(valor) > 2147483647) {
      throw new Error("Os limites devem ser números inteiros não negativos. Deixe em branco para desativar.")
    }
    return [campo, Number(valor)]
  }))
}

export function erroLimite(message) {
  return Object.assign(new Error(message), { statusCode: 409 })
}

// Um lock transacional compartilhado entre pedidos, planos e configuração.
// ReadCommitted garante uma nova leitura depois de aguardar outro salvamento.
export async function bloquearAgenda(tx) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(731905)::text`
}

export function diaEntrega(data) {
  return data ? new Date(data).toISOString().slice(0, 10) : null
}

export async function validarLimitesPedido(tx, pedido, anterior = null, chapasNovas = null) {
  if (pedido.status === "CANCELADO") return
  const config = await tx.configuracaoEmpresa.findFirst()
  if (!config) return
  const limiteFrete = pedido.responsavelFrete === "EMPRESA" ? config.limiteFretesEmpresaDia : config.limiteFretesClienteDia
  const temFrete = pedido.tipoEntrega === "ENTREGA_EMPRESA"
  const temProducao = pedido.tipoPedido === "COM_PRODUCAO"
  if (!pedido.dataEntrega) {
    if ((temFrete && limiteFrete != null) || (temProducao && config.limiteChapasDia != null)) {
      throw erroLimite("Informe a data prevista de entrega para verificar os limites diários.")
    }
    return
  }
  const dia = diaEntrega(pedido.dataEntrega)
  const inicio = new Date(`${dia}T00:00:00.000Z`)
  const fim = new Date(inicio.getTime() + 86400000)
  const where = { status: { not: "CANCELADO" }, dataEntrega: { gte: inicio, lt: fim }, ...(pedido.id ? { id: { not: pedido.id } } : {}) }
  const mesmoDia = anterior?.status !== "CANCELADO" && diaEntrega(anterior?.dataEntrega) === dia
  if (temFrete && limiteFrete != null && !(mesmoDia && anterior?.tipoEntrega === pedido.tipoEntrega && anterior?.responsavelFrete === pedido.responsavelFrete)) {
    const usados = await tx.pedido.count({ where: { ...where, tipoEntrega: "ENTREGA_EMPRESA", responsavelFrete: pedido.responsavelFrete } })
    if (usados + 1 > limiteFrete) throw erroLimite(`Limite de fretes ${pedido.responsavelFrete === "EMPRESA" ? "da loja" : "do cliente"} em ${dia.split("-").reverse().join("/")}: ${usados} registrados, limite ${limiteFrete}. Escolha outra data.`)
  }
  if (temProducao && config.limiteChapasDia != null) {
    const planos = pedido.id ? await tx.planoCorte.aggregate({ where: { pedidoId: pedido.id }, _sum: { quantidadeChapas: true } }) : null
    const antigas = Number(planos?._sum.quantidadeChapas || 0)
    const novas = chapasNovas ?? antigas
    if (mesmoDia && anterior?.tipoPedido === "COM_PRODUCAO" && novas <= antigas) return
    const total = await tx.planoCorte.aggregate({ where: { pedido: { ...where, tipoPedido: "COM_PRODUCAO" } }, _sum: { quantidadeChapas: true } })
    const usados = Number(total._sum.quantidadeChapas || 0)
    if (usados + novas > config.limiteChapasDia || (novas === 0 && usados >= config.limiteChapasDia)) {
      throw erroLimite(`Limite de chapas em ${dia.split("-").reverse().join("/")}: ${usados} em outros pedidos + ${novas} neste pedido; limite ${config.limiteChapasDia}. Escolha outra data ou reduza a quantidade.`)
    }
  }
}

export async function salvarPedidoComLimites(prisma, operacao, args) {
  return prisma.$transaction(async tx => {
    await bloquearAgenda(tx)
    const anterior = operacao === "update" ? await tx.pedido.findUnique({ where: args.where }) : null
    const dados = Object.fromEntries(Object.entries(args.data).filter(([, valor]) => valor !== undefined))
    await validarLimitesPedido(tx, { tipoPedido: "COM_PRODUCAO", ...anterior, ...dados }, anterior)
    return tx.pedido[operacao](args)
  }, { isolationLevel: "ReadCommitted" })
}

export async function validarLimitesPlano(tx, pedidoId, quantidadeChapas, planoId = null) {
  const pedido = await tx.pedido.findUnique({ where: { id: pedidoId } })
  if (!pedido || ["CANCELADO", "ENTREGUE"].includes(pedido.status) || pedido.tipoPedido !== "COM_PRODUCAO") {
    throw erroLimite("O pedido não permite incluir ou alterar planos de corte.")
  }
  const soma = await tx.planoCorte.aggregate({ where: { pedidoId, ...(planoId ? { id: { not: planoId } } : {}) }, _sum: { quantidadeChapas: true } })
  await validarLimitesPedido(tx, pedido, pedido, Number(soma._sum.quantidadeChapas || 0) + Number(quantidadeChapas))
}
