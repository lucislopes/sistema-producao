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

export async function produtividadeOperadores(req, res) {
  try {
    const { dataInicio, dataFim } = req.query

    const where = {
      operadorId: {
        not: null
      }
    }

    if (dataInicio || dataFim) {
      const intervalo = {}

      if (dataInicio) {
        intervalo.gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        intervalo.lte = criarDataLocal(dataFim, true)
      }

      where.OR = [
        { status: "CONCLUIDO", dataFim: intervalo },
        { status: "INICIADO", dataInicio: intervalo },
        { status: { in: ["ABERTO", "CANCELADO"] }, createdAt: intervalo }
      ]
    }

    const servicos = await prisma.servicoPlano.findMany({
      where,
      include: {
        operador: true
      }
    })

    const mapa = {}

    servicos.forEach((servico) => {
      const operadorId = servico.operadorId
      const operadorNome = servico.operador?.nome || "Sem nome"

      if (!mapa[operadorId]) {
        mapa[operadorId] = {
          operadorId,
          operador: operadorNome,
          total: 0,
          abertos: 0,
          iniciados: 0,
          concluidos: 0,
          cancelados: 0,
          tempoTotalMinutos: 0,
          concluidosComTempo: 0
        }
      }

      mapa[operadorId].total += 1

      if (servico.status === "ABERTO") mapa[operadorId].abertos += 1
      if (servico.status === "INICIADO") mapa[operadorId].iniciados += 1
      if (servico.status === "CONCLUIDO") mapa[operadorId].concluidos += 1
      if (servico.status === "CANCELADO") mapa[operadorId].cancelados += 1

      if (
        servico.status === "CONCLUIDO" &&
        servico.dataInicio &&
        servico.dataFim
      ) {
        const minutos = Math.round(
          (new Date(servico.dataFim) - new Date(servico.dataInicio)) / 60000
        )

        if (minutos >= 0) {
          mapa[operadorId].tempoTotalMinutos += minutos
          mapa[operadorId].concluidosComTempo += 1
        }
      }
    })

    const resultado = Object.values(mapa)
      .map(({ tempoTotalMinutos, concluidosComTempo, ...item }) => ({
        ...item,
        taxaConclusao: item.total > 0
          ? Math.round((item.concluidos / item.total) * 100)
          : 0,
        tempoMedioMinutos: concluidosComTempo > 0
          ? Math.round(tempoTotalMinutos / concluidosComTempo)
          : 0
      }))
      .sort((a, b) =>
        b.concluidos - a.concluidos ||
        b.taxaConclusao - a.taxaConclusao ||
        a.operador.localeCompare(b.operador, "pt-BR")
      )

    return res.json(resultado)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar produtividade"
    })
  }
}
