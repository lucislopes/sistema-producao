import bcrypt from "bcrypt"

import { prisma } from "../lib/prisma.js"

//
// LISTAR
//

export async function listarFuncionarios(req, res) {

  try {

    const { busca } = req.query

    const funcionarios =
      await prisma.funcionario.findMany({

        where: busca
          ? {
              nome: {
                contains: busca,
                mode: "insensitive"
              }
            }
          : {},

        include: {
          usuario: true
        },

        orderBy: {
          nome: "asc"
        }
      })

    return res.json(funcionarios)

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar funcionários"
    })
  }
}

//
// CRIAR
//

export async function criarFuncionario(req, res) {

  try {

    const {
      nome,
      telefone,
      funcao,
      email,
      senha
    } = req.body

    const senhaHash =
      await bcrypt.hash(senha, 10)

    const funcionario =
      await prisma.funcionario.create({

        data: {

          nome,
          telefone,
          funcao,

          usuario: {

            create: {
              email,
              senha: senhaHash
            }
          }
        },

        include: {
          usuario: true
        }
      })

    return res.status(201).json(funcionario)

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      error: "Erro ao criar funcionário"
    })
  }
}

export async function listarOperadores(req, res) {
  try {

    const operadores = await prisma.funcionario.findMany({

      where: {
        ativo: true,

        funcao: {
          in: [
            "OPERADOR",
            "VENDEDOR_OPERADOR"
          ]
        }
      },

      orderBy: {
        nome: "asc"
      }

    })

    return res.json(operadores)

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar operadores"
    })
  }
}

//
// ATUALIZAR
//

export async function atualizarFuncionario(req, res) {

  try {

    const { id } = req.params

    const {
      nome,
      telefone,
      funcao,
      ativo
    } = req.body

    const funcionario =
      await prisma.funcionario.update({

        where: {
          id
        },

        data: {
          nome,
          telefone,
          funcao,
          ativo
        }
      })

    return res.json(funcionario)

  } catch (error) {

    console.log(error)

    return res.status(500).json({
      error: "Erro ao atualizar funcionário"
    })
  }
}