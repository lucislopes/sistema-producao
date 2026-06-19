import { prisma } from "../lib/prisma.js"

export async function podeEditarPedido(pedidoId, user) {
  if (!user) return false

  if (user.funcao === "ADMIN") {
    return true
  }

  if (
    user.funcao !== "VENDEDOR" &&
    user.funcao !== "VENDEDOR_OPERADOR"
  ) {
    return false
  }

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    select: {
      id: true,
      vendedorId: true
    }
  })

  if (!pedido) return false

  return pedido.vendedorId === user.funcionarioId
}

export async function podeEditarPlano(planoId, user) {
  if (!user) return false

  if (user.funcao === "ADMIN") {
    return true
  }

  if (
    user.funcao !== "VENDEDOR" &&
    user.funcao !== "VENDEDOR_OPERADOR"
  ) {
    return false
  }

  const plano = await prisma.planoCorte.findUnique({
    where: { id: planoId },
    select: {
      id: true,
      pedido: {
        select: {
          id: true,
          vendedorId: true
        }
      }
    }
  })

  if (!plano) return false

  return plano.pedido.vendedorId === user.funcionarioId
}