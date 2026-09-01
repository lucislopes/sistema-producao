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

    const [servicos, total, servicosResumo] = await Promise.all([
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
      }),

      prisma.servicoPlano.findMany({
        where,
        select: {
          status: true,
          dataInicio: true,
          dataFim: true,
          tipoServico: { select: { id: true, nome: true } },
          operador: { select: { id: true, nome: true } }
        }
      })
    ])

    return res.json({
      campoData,
      dados: servicos,
      resumo: montarResumo(servicosResumo),
      paginacao: {
        total,
        page: paginaAtual,
        limit: limite,
        totalPages: Math.max(1, Math.ceil(total / limite))
      }
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao gerar relatório de produção"
    })
  }
}

function calcularDuracaoMinutos(inicio, fim) {
  if (!inicio || !fim) return 0
  const diferenca = new Date(fim) - new Date(inicio)
  return diferenca > 0 ? Math.round(diferenca / 60000) : 0
}

function montarResumo(servicos) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)
  const porServicoMap = new Map()
  const porOperadorMap = new Map()
  let tempoTotal = 0
  let concluidosComTempo = 0

  servicos.forEach((servico) => {
    const tipoId = servico.tipoServico?.id || "sem-tipo"
    const itemTipo = porServicoMap.get(tipoId) || {
      id: tipoId,
      nome: servico.tipoServico?.nome || "Sem tipo",
      total: 0,
      abertos: 0,
      producao: 0,
      concluidos: 0,
      cancelados: 0,
      tempoTotal: 0,
      concluidosComTempo: 0
    }
    itemTipo.total += 1
    if (servico.status === "ABERTO") itemTipo.abertos += 1
    if (servico.status === "INICIADO") itemTipo.producao += 1
    if (servico.status === "CONCLUIDO") itemTipo.concluidos += 1
    if (servico.status === "CANCELADO") itemTipo.cancelados += 1

    const duracao = servico.status === "CONCLUIDO"
      ? calcularDuracaoMinutos(servico.dataInicio, servico.dataFim)
      : 0
    if (duracao > 0) {
      itemTipo.tempoTotal += duracao
      itemTipo.concluidosComTempo += 1
      tempoTotal += duracao
      concluidosComTempo += 1
    }
    porServicoMap.set(tipoId, itemTipo)

    if (servico.operador?.id) {
      const operador = porOperadorMap.get(servico.operador.id) || {
        id: servico.operador.id,
        nome: servico.operador.nome,
        concluidos: 0
      }
      if (servico.status === "CONCLUIDO") operador.concluidos += 1
      porOperadorMap.set(servico.operador.id, operador)
    }
  })

  const porServico = [...porServicoMap.values()]
    .map(({ tempoTotal: totalTempo, concluidosComTempo: totalComTempo, ...item }) => ({
      ...item,
      tempoMedio: totalComTempo > 0 ? Math.round(totalTempo / totalComTempo) : 0
    }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome))
  const operadores = [...porOperadorMap.values()]
  const operadorDestaque = operadores
    .filter((item) => item.concluidos > 0)
    .sort((a, b) => b.concluidos - a.concluidos || a.nome.localeCompare(b.nome))[0] || null

  return {
    total: servicos.length,
    abertos: servicos.filter((item) => item.status === "ABERTO").length,
    iniciados: servicos.filter((item) => item.status === "INICIADO").length,
    concluidos: servicos.filter((item) => item.status === "CONCLUIDO").length,
    cancelados: servicos.filter((item) => item.status === "CANCELADO").length,
    producaoHoje: servicos.filter((item) =>
      item.status === "CONCLUIDO" && item.dataFim >= hoje && item.dataFim < amanha
    ).length,
    tempoMedio: concluidosComTempo > 0 ? Math.round(tempoTotal / concluidosComTempo) : 0,
    operadoresEnvolvidos: operadores.length,
    porServico,
    servicoMaisExecutado: porServico[0] || null,
    operadorDestaque
  }
}
