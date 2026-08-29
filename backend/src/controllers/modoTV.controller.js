import { prisma } from "../lib/prisma.js"
import { consolidarModoTV } from "../utils/modoTV.js"

export async function obterModoTV(req, res) {
  try {
    const statusAtivos = ["ABERTO", "EM_SEPARACAO", "EM_PRODUCAO", "PRONTO_ENTREGA", "SAIU_ENTREGA"]
    const [servicos, pedidosAtivos] = await Promise.all([prisma.servicoPlano.findMany({
      where: {
        plano: { pedido: { status: { notIn: ["ENTREGUE", "CANCELADO"] } } },
        status: { not: "CANCELADO" }
      },
      select: {
        id: true,
        status: true,
        operadorId: true,
        dataFim: true,
        tipoServico: { select: { nome: true } },
        operador: { select: { nome: true } },
        plano: {
          select: {
            id: true,
            numeroPlano: true,
            quantidadeChapas: true,
            pedido: {
              select: {
                id: true,
                numeroPedido: true,
                numeroPedidoManual: true,
                origemPedido: true,
                status: true,
                dataEntrega: true,
                cliente: { select: { nome: true } }
              }
            }
          }
        }
      }
    }), prisma.pedido.findMany({
      where: { status: { in: statusAtivos } },
      select: { id: true, status: true, dataEntrega: true }
    })])

    return res.json({ ...consolidarModoTV(servicos, { pedidosAtivos }), atualizadoEm: new Date() })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Erro ao carregar o modo TV" })
  }
}
