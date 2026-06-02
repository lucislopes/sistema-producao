import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma.js"

export async function login(req, res) {
  try {
    const { email, senha } = req.body

    const emailTratado = email?.trim().toLowerCase()

    const usuario = await prisma.usuario.findUnique({
      where: {
        email: emailTratado
      },
      include: {
        funcionario: true
      }
    })

    if (!usuario) {
      return res.status(401).json({
        error: "Usuário ou senha inválidos"
      })
    }

    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha
    )

    if (!senhaValida) {
      return res.status(401).json({
        error: "Usuário ou senha inválidos"
      })
    }

    if (!usuario.funcionario?.ativo) {
      return res.status(403).json({
        error: "Usuário inativo"
      })
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        funcionarioId: usuario.funcionario.id,
        funcao: usuario.funcionario.funcao
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    )

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        funcionarioId: usuario.funcionario.id,
        nome: usuario.funcionario.nome,
        email: usuario.email,
        funcao: usuario.funcionario.funcao
      }
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro interno"
    })
  }
}

export async function alterarMinhaSenha(req, res) {
  try {
    const usuarioId = req.user.id

    const {
      senhaAtual,
      novaSenha
    } = req.body

    if (!senhaAtual || !senhaAtual.trim()) {
      return res.status(400).json({
        error: "Senha atual é obrigatória"
      })
    }

    if (!novaSenha || novaSenha.trim().length < 6) {
      return res.status(400).json({
        error: "Nova senha deve ter pelo menos 6 caracteres"
      })
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: usuarioId
      }
    })

    if (!usuario) {
      return res.status(404).json({
        error: "Usuário não encontrado"
      })
    }

    const senhaConfere = await bcrypt.compare(
      senhaAtual,
      usuario.senha
    )

    if (!senhaConfere) {
      return res.status(400).json({
        error: "Senha atual incorreta"
      })
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10)

    await prisma.usuario.update({
      where: {
        id: usuarioId
      },
      data: {
        senha: novaSenhaHash
      }
    })

    return res.json({
      message: "Senha alterada com sucesso"
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      error: "Erro ao alterar senha"
    })
  }
}