import { prisma } from "../lib/prisma.js"

export async function listarTiposServico(req, res) {
  try {
    const { busca } = req.query

    const tipos = await prisma.tipoServico.findMany({
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

    return res.json(tipos)

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar tipos de serviço"
    })
  }
}

export async function criarTipoServico(req, res) {
  try {
    const { nome } = req.body

    const tipo = await prisma.tipoServico.create({
      data: {
        nome
      }
    })

    return res.status(201).json(tipo)

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao criar tipo de serviço"
    })
  }
}

export async function atualizarTipoServico(req, res) {
  try {
    const { id } = req.params
    const { nome } = req.body

    const tipo = await prisma.tipoServico.update({
      where: { id },
      data: { nome }
    })

    return res.json(tipo)

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao atualizar tipo de serviço"
    })
  }
}

export async function deletarTipoServico(req, res) {
  try {
    const { id } = req.params

    await prisma.tipoServico.delete({
      where: { id }
    })

    return res.json({
      message: "Tipo de serviço excluído"
    })

  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao excluir tipo de serviço"
    })
  }
}