import { prisma } from "../lib/prisma.js"

export async function registrarHistoricoPedido({
  pedidoId,
  usuarioId,
  tipo,
  descricao
}) {
  await prisma.historicoPedido.create({
    data: {
      pedidoId,
      usuarioId: usuarioId || null,
      tipo,
      descricao
    }
  })
}