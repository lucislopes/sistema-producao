import { prisma } from "../lib/prisma.js"

export async function recalcularStatusPedido(pedidoId, opcoes = {}) {
  const { permitirReabrirExpedicao = false } = opcoes

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId }
  })

  if (!pedido) return

  if (
    ["SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(pedido.status)
  ) {
    return
  }

  if (
    pedido.status === "PRONTO_ENTREGA" &&
    !permitirReabrirExpedicao
  ) {
    return
  }

  const planos = await prisma.planoCorte.findMany({
    where: { pedidoId },
    include: { servicos: true }
  })

  const servicos = planos.flatMap((plano) => plano.servicos)

  if (servicos.length === 0) {
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { status: "EM_SEPARACAO" }
    })
    return
  }

  const todosConcluidos = servicos.every(
    (servico) => servico.status === "CONCLUIDO"
  )

  if (todosConcluidos) {
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { status: "PRONTO_ENTREGA" }
    })
    return
  }

  const existeServicoPendenteOuIniciado = servicos.some((servico) =>
    ["ABERTO", "INICIADO"].includes(servico.status)
  )

  if (existeServicoPendenteOuIniciado) {
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { status: "EM_PRODUCAO" }
    })
    return
  }

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { status: "EM_SEPARACAO" }
  })
}