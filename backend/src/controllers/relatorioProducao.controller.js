import { prisma } from "../lib/prisma.js"

function criarDataLocal(dataTexto, fimDoDia = false) {
  if (!dataTexto) return null

  const [ano, mes, dia] = dataTexto.split("-").map(Number)

  return new Date(
    ano,
    mes - 1,
    dia,
    fimDoDia ? 23 : 0,
    fimDoDia ? 59 : 0,
    fimDoDia ? 59 : 0,
    fimDoDia ? 999 : 0
  )
}

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

    const campoData =
      status === "CONCLUIDO"
        ? "dataFim"
        : status === "INICIADO"
          ? "dataInicio"
          : "createdAt"

    if (dataInicio || dataFim) {
      where[campoData] = {}

      if (dataInicio) {
        where[campoData].gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        where[campoData].lte = criarDataLocal(dataFim, true)
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
        {
          plano: {
            pedido: {
              numeroPedidoManual: {
                contains: busca,
                mode: "insensitive"
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

    const orderBy =
      campoData === "dataFim"
        ? [{ dataFim: "desc" }]
        : campoData === "dataInicio"
          ? [{ dataInicio: "desc" }]
          : [{ createdAt: "desc" }]

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

        orderBy,

        skip,
        take: limite
      }),

      prisma.servicoPlano.count({
        where
      })
    ])

    return res.json({
      campoData,
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