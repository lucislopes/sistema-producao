import { prisma } from "../lib/prisma.js"

export async function recalcularStatusPedido(pedidoId) {
  const pedido = await prisma.pedido.findUnique({
    where: {
      id: pedidoId
    }
  })

  if (!pedido) return

  if (["PRONTO_ENTREGA", "SAIU_ENTREGA", "ENTREGUE", "CANCELADO"].includes(pedido.status)) {
    return
  }

  const planos = await prisma.planoCorte.findMany({
    where: {
      pedidoId
    },
    include: {
      servicos: true
    }
  })

  const servicos = planos.flatMap((plano) => plano.servicos)

  if (servicos.length === 0) {
    await prisma.pedido.update({
      where: {
        id: pedidoId
      },
      data: {
        status: "EM_SEPARACAO"
      }
    })

    return
  }

  const todosConcluidos = servicos.every(
    (servico) => servico.status === "CONCLUIDO"
  )

  if (todosConcluidos) {
    await prisma.pedido.update({
      where: {
        id: pedidoId
      },
      data: {
        status: "PRONTO_ENTREGA"
      }
    })

    return
  }

  const algumIniciado = servicos.some(
    (servico) => servico.status === "INICIADO"
  )

  if (algumIniciado) {
    await prisma.pedido.update({
      where: {
        id: pedidoId
      },
      data: {
        status: "EM_PRODUCAO"
      }
    })

    return
  }

  await prisma.pedido.update({
    where: {
      id: pedidoId
    },
    data: {
      status: "EM_SEPARACAO"
    }
  })
}