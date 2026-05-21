import { prisma } from "../lib/prisma.js"

export async function recalcularStatusPedido(pedidoId) {

  //
  // BUSCA PLANOS
  //

  const planos = await prisma.planoCorte.findMany({
    where: {
      pedidoId
    },

    include: {
      servicos: true
    }
  })

  //
  // TODOS SERVIÇOS
  //

  const servicos = planos.flatMap(
    (plano) => plano.servicos
  )

  //
  // SEM SERVIÇOS
  //

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

  //
  // TODOS CONCLUÍDOS
  //

  const todosConcluidos = servicos.every(
    (s) => s.status === "CONCLUIDO"
  )

  if (todosConcluidos) {

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

  //
  // AGUARDANDO EXTERNO
  //

  const aguardandoExterno = servicos.some(
    (s) => s.status === "PAUSADO"
  )

  if (aguardandoExterno) {

    await prisma.pedido.update({
      where: {
        id: pedidoId
      },

      data: {
        status: "AGUARDANDO_EXTERNO"
      }
    })

    return
  }

  //
  // PRODUÇÃO
  //

  await prisma.pedido.update({
    where: {
      id: pedidoId
    },

    data: {
      status: "EM_PRODUCAO"
    }
  })
}