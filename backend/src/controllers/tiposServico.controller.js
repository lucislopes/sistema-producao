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

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        error: "Nome do tipo de serviço é obrigatório"
      })
    }

    const nomeTratado = nome.trim()

    const tipoExistente = await prisma.tipoServico.findFirst({
      where: {
        nome: {
          equals: nomeTratado,
          mode: "insensitive"
        }
      }
    })

    if (tipoExistente) {
      return res.status(400).json({
        error: "Já existe um tipo de serviço com este nome"
      })
    }

    const tipo = await prisma.tipoServico.create({
      data: {
        nome: nomeTratado
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

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        error: "Nome do tipo de serviço é obrigatório"
      })
    }

    const nomeTratado = nome.trim()

    const tipoExistente = await prisma.tipoServico.findFirst({
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

    if (tipoExistente) {
      return res.status(400).json({
        error: "Já existe outro tipo de serviço com este nome"
      })
    }

    const tipo = await prisma.tipoServico.update({
      where: {
        id
      },
      data: {
        nome: nomeTratado
      }
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
      where: {
        id
      }
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