import { prisma } from "../lib/prisma.js"

//
// LISTAR
//

export async function listarClientes(req, res) {
    try{
        const {busca} = req.query

        const clientes = await prisma.cliente.findMany({
            where: busca
            ?{
                nome: {
                    contains: busca,
                    mode: "insensitive"
                }
            }
            :{},
            orderBy: {
                nome: "asc"
            }
        })

        return res.json(clientes)

    } catch (erro) {
        console.log(error)
        return res.status(500).json({
            error: "Erro ao listar clientes"
        })
    }

  const clientes = await prisma.cliente.findMany({
    orderBy: {
      nome: "asc"
    }
  })

  return res.json(clientes)
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

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        documento,
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

    const cliente = await prisma.cliente.update({
      where: {
        id
      },
      data: {
        nome,
        documento,
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