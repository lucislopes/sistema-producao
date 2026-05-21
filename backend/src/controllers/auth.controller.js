import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma.js"

export async function login(req, res) {
  try {
    const { email, senha } = req.body

    const usuario = await prisma.usuario.findUnique({
      where: {
        email
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

    if (!usuario.funcionario.ativo) {
    return res.status(403).json({
        error: "Usuário inativo"
    })
    }

    const token = jwt.sign(
      {
        id: usuario.id,
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