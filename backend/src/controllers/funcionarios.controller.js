import bcrypt from "bcrypt"

import { prisma } from "../lib/prisma.js"

const ADMIN_SISTEMA_EMAIL = "admin@sistema.com"


//VALIDAR
async function validarFuncionarioProtegido(id) {
  const funcionario = await prisma.funcionario.findUnique({
    where: { id },
    include: { usuario: true }
  })

  if (!funcionario) {
    return {
      erro: true,
      status: 404,
      mensagem: "Funcionário não encontrado"
    }
  }

  if (funcionario.usuario?.email === ADMIN_SISTEMA_EMAIL) {
    return {
      erro: true,
      status: 403,
      mensagem: "Este usuário é protegido e não pode ser alterado."
    }
  }

  return { erro: false, funcionario }
}

// LISTAR
export async function listarFuncionarios(req, res) {
  try {
    const { busca } = req.query

    const funcionarios = await prisma.funcionario.findMany({
      where: {
        AND: [
          {
            usuario: {
              email: {
                not: ADMIN_SISTEMA_EMAIL
              }
            }
          },
          busca
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
            : {}
        ]
      },
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

// CRIAR
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

    if (emailTratado === ADMIN_SISTEMA_EMAIL) {
      return res.status(400).json({
        error: "Este e-mail é reservado para o administrador do sistema."
      })
    }

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

// LISTAR VENDEDORES
// LISTAR VENDEDORES
export async function listarVendedores(req, res) {
  try {
    const vendedores = await prisma.funcionario.findMany({
      where: {
        ativo: true,

        usuario: {
          email: {
            not: ADMIN_SISTEMA_EMAIL
          }
        },

        funcao: {
          in: [
            "VENDEDOR",
            "VENDEDOR_OPERADOR"
          ]
        }
      },

      select: {
        id: true,
        nome: true,
        funcao: true
      },

      orderBy: {
        nome: "asc"
      }
    })

    return res.json(vendedores)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao listar vendedores"
    })
  }
}

// LISTAR OPERADORES
export async function listarOperadores(req, res) {
  try {
    const operadores = await prisma.funcionario.findMany({
      where: {
        ativo: true,

        usuario: {
          email: {
            not: ADMIN_SISTEMA_EMAIL
          }
        },

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


// ATUALIZAR
export async function atualizarFuncionario(req, res) {
  try {
    const { id } = req.params

    const validacao = await validarFuncionarioProtegido(id)

      if (validacao.erro) {
        return res.status(validacao.status).json({
          error: validacao.mensagem
        })
      }

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


// DESATIVAR / EXCLUIR FUNCIONÁRIO
export async function deletarFuncionario(req, res) {
  try {
    const { id } = req.params
    const validacao = await validarFuncionarioProtegido(id)
      if (validacao.erro) {
        return res.status(validacao.status).json({
          error: validacao.mensagem
        })
      }

    const pedidosComoVendedor = await prisma.pedido.count({
      where: {
        vendedorId: id
      }
    })

    const servicosComoOperador = await prisma.servicoPlano.count({
      where: {
        operadorId: id
      }
    })

    const possuiVinculo =
      pedidosComoVendedor > 0 ||
      servicosComoOperador > 0

    if (possuiVinculo) {
      await prisma.funcionario.update({
        where: { id },
        data: { ativo: false }
      })

      return res.json({
        message:
          "Funcionário possui vínculos no sistema e foi apenas desativado."
      })
    }

    await prisma.usuario.deleteMany({
      where: {
        funcionarioId: id
      }
    })

    await prisma.funcionario.delete({
      where: { id }
    })

    return res.json({
      message:
        "Funcionário e usuário excluídos com sucesso."
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao excluir funcionário."
    })
  }
}


// ADMIN ALTERAR SENHA DE FUNCIONÁRIo
export async function alterarSenhaFuncionario(req, res) {
  try {
    const { id } = req.params
    const { novaSenha } = req.body

    if (!novaSenha || novaSenha.trim().length < 6) {
      return res.status(400).json({
        error: "Nova senha deve ter pelo menos 6 caracteres"
      })
    }

    const validacao = await validarFuncionarioProtegido(id)

    if (validacao.erro) {
      return res.status(validacao.status).json({
        error: validacao.mensagem
      })
    }

    const funcionario = validacao.funcionario

    if (!funcionario.usuario) {
      return res.status(404).json({
        error: "Usuário do funcionário não encontrado"
      })
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10)

    await prisma.usuario.update({
      where: {
        id: funcionario.usuario.id
      },
      data: {
        senha: senhaHash
      }
    })

    return res.json({
      message: "Senha alterada com sucesso"
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao alterar senha do funcionário"
    })
  }
}