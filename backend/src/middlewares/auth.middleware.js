import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma.js"
import { rotaSomenteSite } from '../utils/siteMarketing.js'

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        error: "Token não informado"
      })
    }

    const [scheme, token] = authHeader.split(" ")

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        error: "Token mal formatado"
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: { funcionario: true }
    })

    if (!usuario || !usuario.funcionario?.ativo) {
      return res.status(401).json({ error: "Usuário inativo ou não encontrado" })
    }

    req.user = {
      ...decoded,
      funcionarioId: usuario.funcionario.id,
      funcao: usuario.funcionario.funcao
      ,permissoesSite: usuario.permissoesSite, somenteSite: usuario.somenteSite
    }

    if(usuario.somenteSite && !rotaSomenteSite(req.originalUrl.split('?')[0],usuario.permissoesSite)) return res.status(403).json({error:'Este usuário possui acesso somente ao site.'})
    next()

  } catch (error) {
    return res.status(401).json({
      error: "Token inválido"
    })
  }
}
