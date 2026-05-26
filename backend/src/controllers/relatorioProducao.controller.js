import { prisma } from "../lib/prisma.js"

export async function relatorioProducao(req, res) {
  try {
    const {
      dataInicio,
      dataFim,
      operadorId,
      tipoServicoId,
      status,
      busca,
      page = 1,
      limit = 50
    } = req.query

    const paginaAtual = Number(page) || 1
    const limite = Number(limit) || 50
    const skip = (paginaAtual - 1) * limite

    const where = {}

    if (status) {
      where.status = status
    }

    if (operadorId) {
      where.operadorId = operadorId
    }

    if (tipoServicoId) {
      where.tipoServicoId = tipoServicoId
    }

    if (dataInicio || dataFim) {
      where.createdAt = {}

      if (dataInicio) {
        const inicio = new Date(dataInicio)
        inicio.setHours(0, 0, 0, 0)
        where.createdAt.gte = inicio
      }

      if (dataFim) {
        const fim = new Date(dataFim)
        fim.setHours(23, 59, 59, 999)
        where.createdAt.lte = fim
      }
    }

    if (busca) {
      where.OR = [
        {
          plano: {
            pedido: {
              cliente: {
                nome: {
                  contains: busca,
                  mode: "insensitive"
                }
              }
            }
          }
        },
        ...(Number(busca)
          ? [
              {
                plano: {
                  pedido: {
                    numeroPedido: Number(busca)
                  }
                }
              }
            ]
          : [])
      ]
    }

    const [servicos, total] = await Promise.all([
      prisma.servicoPlano.findMany({
        where,

        include: {
          tipoServico: true,
          operador: true,
          plano: {
            include: {
              pedido: {
                include: {
                  cliente: true
                }
              }
            }
          }
        },

        orderBy: [
          { createdAt: "desc" }
        ],

        skip,
        take: limite
      }),

      prisma.servicoPlano.count({
        where
      })
    ])

    return res.json({
      dados: servicos,
      paginacao: {
        total,
        page: paginaAtual,
        limit: limite,
        totalPages: Math.ceil(total / limite)
      }
    })

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de produção"
    })
  }
}