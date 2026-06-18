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
      where.dataFim = {}

      if (dataInicio) {
        where.dataFim.gte = criarDataLocal(dataInicio, false)
      }

      if (dataFim) {
        where.dataFim.lte = criarDataLocal(dataFim, true)
      }
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
          cancelados: 0
        }
      }

      mapa[operadorId].total += 1

      if (servico.status === "ABERTO") mapa[operadorId].abertos += 1
      if (servico.status === "INICIADO") mapa[operadorId].iniciados += 1
      if (servico.status === "CONCLUIDO") mapa[operadorId].concluidos += 1
      if (servico.status === "CANCELADO") mapa[operadorId].cancelados += 1
    })

    const resultado = Object.values(mapa).sort(
      (a, b) => b.concluidos - a.concluidos
    )

    return res.json(resultado)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao carregar produtividade"
    })
  }
}