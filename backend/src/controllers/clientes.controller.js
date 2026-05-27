import { prisma } from "../lib/prisma.js"

//
// LISTAR
//

export async function listarClientes(req, res) {
  try {
    const { busca } = req.query

    const clientes = await prisma.cliente.findMany({
      where: busca
        ? {
            OR: [
              {
                nome: {
                  contains: busca,
                  mode: "insensitive"
                }
              },
              {
                documento: {
                  contains: busca,
                  mode: "insensitive"
                }
              }
            ]
          }
        : {},
      orderBy: {
        nome: "asc"
      },
      take: 20
    })

    return res.json(clientes)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar clientes"
    })
  }
}

//
// CRIAR
//

export async function criarCliente(req, res) {
  try {
    const {
      nome,
      documento,
      telefone,
      endereco
    } = req.body

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        error: "Nome do cliente é obrigatório"
      })
    }

    const nomeTratado = nome.trim()
    const documentoTratado = documento?.trim() || null

    if (documentoTratado) {
      const clienteDocumentoExistente =
        await prisma.cliente.findFirst({
          where: {
            documento: documentoTratado
          }
        })

      if (clienteDocumentoExistente) {
        return res.status(400).json({
          error: "Já existe um cliente com este documento"
        })
      }
    }

    const clienteNomeDocumentoExistente =
      await prisma.cliente.findFirst({
        where: {
          nome: {
            equals: nomeTratado,
            mode: "insensitive"
          },
          documento: documentoTratado
        }
      })

    if (clienteNomeDocumentoExistente) {
      return res.status(400).json({
        error: "Já existe um cliente com este nome e documento"
      })
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: nomeTratado,
        documento: documentoTratado,
        telefone,
        endereco
      }
    })

    return res.status(201).json(cliente)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao criar cliente"
    })
  }
}

//
// ATUALIZAR
//

export async function atualizarCliente(req, res) {
  try {
    const { id } = req.params

    const {
      nome,
      documento,
      telefone,
      endereco
    } = req.body

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        error: "Nome do cliente é obrigatório"
      })
    }

    const nomeTratado = nome.trim()
    const documentoTratado = documento?.trim() || null

    if (documentoTratado) {
      const clienteDocumentoExistente =
        await prisma.cliente.findFirst({
          where: {
            documento: documentoTratado,
            id: {
              not: id
            }
          }
        })

      if (clienteDocumentoExistente) {
        return res.status(400).json({
          error: "Já existe outro cliente com este documento"
        })
      }
    }

    const clienteNomeDocumentoExistente =
      await prisma.cliente.findFirst({
        where: {
          nome: {
            equals: nomeTratado,
            mode: "insensitive"
          },
          documento: documentoTratado,
          id: {
            not: id
          }
        }
      })

    if (clienteNomeDocumentoExistente) {
      return res.status(400).json({
        error: "Já existe outro cliente com este nome e documento"
      })
    }

    const cliente = await prisma.cliente.update({
      where: {
        id
      },
      data: {
        nome: nomeTratado,
        documento: documentoTratado,
        telefone,
        endereco
      }
    })

    return res.json(cliente)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao atualizar cliente"
    })
  }
}

//
// DELETAR
//

export async function deletarCliente(req, res) {
  try {
    const { id } = req.params

    await prisma.cliente.delete({
      where: {
        id
      }
    })

    return res.json({
      message: "Cliente deletado"
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao deletar cliente"
    })
  }
}