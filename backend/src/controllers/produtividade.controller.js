import { prisma } from "../lib/prisma.js"

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
        const inicio = new Date(`${dataInicio}T00:00:00`)
        where.dataFim.gte = inicio
      }

      if (dataFim) {
        const fim = new Date(`${dataFim}T23:59:59`)
        where.dataFim.lte = fim
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