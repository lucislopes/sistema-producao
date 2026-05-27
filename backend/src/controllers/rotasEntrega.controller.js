import { prisma } from "../lib/prisma.js"

export async function listarRotas(req, res) {
  try {
    const { busca } = req.query

    const rotas = await prisma.rotaEntrega.findMany({
      where: busca
        ? {
            nome: {
              contains: busca,
              mode: "insensitive"
            }
          }
        : {},
      orderBy: {
        nome: "asc"
      }
    })

    return res.json(rotas)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar rotas"
    })
  }
}

export async function criarRota(req, res) {
  try {
    const { nome, valorFrete } = req.body

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        error: "Nome da rota é obrigatório"
      })
    }

    const nomeTratado = nome.trim()
    const valorFreteTratado = Number(valorFrete || 0)

    if (Number.isNaN(valorFreteTratado) || valorFreteTratado < 0) {
      return res.status(400).json({
        error: "Valor do frete inválido"
      })
    }

    const rotaExistente = await prisma.rotaEntrega.findFirst({
      where: {
        nome: {
          equals: nomeTratado,
          mode: "insensitive"
        }
      }
    })

    if (rotaExistente) {
      return res.status(400).json({
        error: "Já existe uma rota com este nome"
      })
    }

    const rota = await prisma.rotaEntrega.create({
      data: {
        nome: nomeTratado,
        valorFrete: valorFreteTratado
      }
    })

    return res.status(201).json(rota)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao criar rota"
    })
  }
}

export async function atualizarRota(req, res) {
  try {
    const { id } = req.params
    const { nome, valorFrete } = req.body

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        error: "Nome da rota é obrigatório"
      })
    }

    const nomeTratado = nome.trim()
    const valorFreteTratado = Number(valorFrete || 0)

    if (Number.isNaN(valorFreteTratado) || valorFreteTratado < 0) {
      return res.status(400).json({
        error: "Valor do frete inválido"
      })
    }

    const rotaExistente = await prisma.rotaEntrega.findFirst({
      where: {
        nome: {
          equals: nomeTratado,
          mode: "insensitive"
        },
        id: {
          not: id
        }
      }
    })

    if (rotaExistente) {
      return res.status(400).json({
        error: "Já existe outra rota com este nome"
      })
    }

    const rota = await prisma.rotaEntrega.update({
      where: {
        id
      },
      data: {
        nome: nomeTratado,
        valorFrete: valorFreteTratado
      }
    })

    return res.json(rota)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao atualizar rota"
    })
  }
}

export async function deletarRota(req, res) {
  try {
    const { id } = req.params

    await prisma.rotaEntrega.delete({
      where: {
        id
      }
    })

    return res.json({
      message: "Rota excluída"
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao excluir rota"
    })
  }
}