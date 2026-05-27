import { prisma } from "../lib/prisma.js"

export async function recalcularStatusPedido(pedidoId) {
  const planos = await prisma.planoCorte.findMany({
    where: {
      pedidoId
    },
    include: {
      servicos: true
    }
  })

  const servicos = planos.flatMap(
    (plano) => plano.servicos
  )

  if (servicos.length === 0) {
    await prisma.pedido.update({
      where: {
        id: pedidoId
      },
      data: {
        status: "ABERTO"
      }
    })

    return
  }

  const todosCancelados = servicos.every(
    (s) => s.status === "CANCELADO"
  )

  if (todosCancelados) {
    await prisma.pedido.update({
      where: {
        id: pedidoId
      },
      data: {
        status: "CANCELADO"
      }
    })

    return
  }

  const todosConcluidosOuFinalizados = servicos.every(
    (s) =>
      s.status === "CONCLUIDO" ||
      s.status === "FINALIZADO"
  )

  if (todosConcluidosOuFinalizados) {
    await prisma.pedido.update({
      where: {
        id: pedidoId
      },
      data: {
        status: "CONCLUIDO"
      }
    })

    return
  }

  const algumIniciado = servicos.some(
    (s) =>
      s.status === "INICIADO" ||
      s.status === "EM_SEPARACAO" ||
      s.status === "CONCLUIDO" ||
      s.status === "FINALIZADO"
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
      status: "ABERTO"
    }
  })
}