import { prisma } from "../lib/prisma.js"

function formatarNumeroPedido(pedido) {
  if (
    pedido.origemPedido === "EXTERNO" &&
    pedido.numeroPedidoManual
  ) {
    return pedido.numeroPedidoManual
  }

  return `#${pedido.numeroPedido}`
}

export async function relatorioAuditoriaFrete(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      vendedorId,
      busca
    } = req.query

    const where = {
      freteAlterado: true
    }

    if (vendedorId) {
      where.vendedorId = vendedorId
    }

    if (dataInicio || dataFim) {
      where.createdAt = {}

      if (dataInicio) {
        where.createdAt.gte = new Date(`${dataInicio}T00:00:00`)
      }

      if (dataFim) {
        where.createdAt.lte = new Date(`${dataFim}T23:59:59`)
      }
    }

    if (busca) {
      const texto = String(busca).trim()

      where.OR = [
        {
          numeroPedidoManual: {
            contains: texto,
            mode: "insensitive"
          }
        },
        {
          cliente: {
            nome: {
              contains: texto,
              mode: "insensitive"
            }
          }
        },
        {
          rota: {
            nome: {
              contains: texto,
              mode: "insensitive"
            }
          }
        },
        {
          vendedor: {
            nome: {
              contains: texto,
              mode: "insensitive"
            }
          }
        }
      ]

      const numero = Number(texto)

      if (!Number.isNaN(numero)) {
        where.OR.push({
          numeroPedido: numero
        })
      }
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        cliente: true,
        vendedor: true,
        rota: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const dados = pedidos.map((pedido) => {
      const valorPadrao = Number(pedido.valorFretePadrao || 0)
      const valorCobrado = Number(pedido.valorFreteCobrado || pedido.valorFrete || 0)
      const diferenca = valorCobrado - valorPadrao

      return {
        id: pedido.id,
        numeroPedido: formatarNumeroPedido(pedido),
        cliente: pedido.cliente?.nome || "-",
        vendedor: pedido.vendedor?.nome || "-",
        rota: pedido.rota?.nome || "-",
        dataPedido: pedido.createdAt,
        dataEntrega: pedido.dataEntrega,
        valorFretePadrao: valorPadrao,
        valorFreteCobrado: valorCobrado,
        diferenca,
        motivoAlteracaoFrete: pedido.motivoAlteracaoFrete || "-"
      }
    })

    const resumo = {
      total: dados.length,
      aumentos: dados.filter((item) => item.diferenca > 0).length,
      descontos: dados.filter((item) => item.diferenca < 0).length,
      impactoTotal: dados.reduce((total, item) => total + item.diferenca, 0)
    }

    return res.json({
      resumo,
      dados
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de auditoria de frete"
    })
  }
}