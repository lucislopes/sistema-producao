import { prisma } from "../lib/prisma.js"

export function determinarStatusPedido(pedido, servicos, opcoes = {}) {
  const { permitirReabrirExpedicao = false } = opcoes

  if (!pedido) return null

  if (["SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(pedido.status)) {
    return null
  }

  if (pedido.status === "PRONTO_ENTREGA" && !permitirReabrirExpedicao) {
    return null
  }

  if (servicos.length === 0) return "EM_SEPARACAO"

  if (servicos.every((servico) => servico.status === "CONCLUIDO")) {
    return "PRONTO_ENTREGA"
  }

  if (servicos.some((servico) => ["ABERTO", "INICIADO"].includes(servico.status))) {
    return "EM_PRODUCAO"
  }

  return "EM_SEPARACAO"
}

export async function recalcularStatusPedido(pedidoId, opcoes = {}) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId }
  })

  if (!pedido) return

  if (["SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(pedido.status)) return

  if (pedido.status === "PRONTO_ENTREGA" && !opcoes.permitirReabrirExpedicao) return

  const planos = await prisma.planoCorte.findMany({
    where: { pedidoId },
    include: { servicos: true }
  })

  const servicos = planos.flatMap((plano) => plano.servicos)
  const novoStatus = determinarStatusPedido(pedido, servicos, opcoes)

  if (!novoStatus || novoStatus === pedido.status) return

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { status: novoStatus }
  })
}
