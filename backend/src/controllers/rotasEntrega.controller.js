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

    const rota = await prisma.rotaEntrega.create({
      data: {
        nome,
        valorFrete: Number(valorFrete)
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

    const rota = await prisma.rotaEntrega.update({
      where: { id },
      data: {
        nome,
        valorFrete: Number(valorFrete)
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
      where: { id }
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