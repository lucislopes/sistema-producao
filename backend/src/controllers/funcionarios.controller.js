import bcrypt from "bcrypt"

import { prisma } from "../lib/prisma.js"

//
// LISTAR
//

export async function listarFuncionarios(req, res) {
  try {
    const { busca } = req.query

    const funcionarios = await prisma.funcionario.findMany({
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
                usuario: {
                  email: {
                    contains: busca,
                    mode: "insensitive"
                  }
                }
              }
            ]
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

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        error: "Nome do funcionário é obrigatório"
      })
    }

    if (!funcao || !funcao.trim()) {
      return res.status(400).json({
        error: "Função do funcionário é obrigatória"
      })
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: "E-mail do usuário é obrigatório"
      })
    }

    if (!senha || !senha.trim()) {
      return res.status(400).json({
        error: "Senha do usuário é obrigatória"
      })
    }

    const nomeTratado = nome.trim()
    const emailTratado = email.trim().toLowerCase()

    const usuarioExistente = await prisma.usuario.findUnique({
      where: {
        email: emailTratado
      }
    })

    if (usuarioExistente) {
      return res.status(400).json({
        error: "Já existe um usuário com este e-mail"
      })
    }

    const funcionarioExistente = await prisma.funcionario.findFirst({
      where: {
        nome: {
          equals: nomeTratado,
          mode: "insensitive"
        }
      }
    })

    if (funcionarioExistente) {
      return res.status(400).json({
        error: "Já existe um funcionário com este nome"
      })
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const funcionario = await prisma.funcionario.create({
      data: {
        nome: nomeTratado,
        telefone,
        funcao,

        usuario: {
          create: {
            email: emailTratado,
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

//
// LISTAR OPERADORES
//

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

    if (!nome || !nome.trim()) {
      return res.status(400).json({
        error: "Nome do funcionário é obrigatório"
      })
    }

    if (!funcao || !funcao.trim()) {
      return res.status(400).json({
        error: "Função do funcionário é obrigatória"
      })
    }

    const nomeTratado = nome.trim()

    const funcionarioExistente = await prisma.funcionario.findFirst({
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

    if (funcionarioExistente) {
      return res.status(400).json({
        error: "Já existe outro funcionário com este nome"
      })
    }

    const funcionario = await prisma.funcionario.update({
      where: {
        id
      },

      data: {
        nome: nomeTratado,
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