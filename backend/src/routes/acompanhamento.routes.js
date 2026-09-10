import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { criarConsultaAcompanhamento, criarLimitadorConsulta } from "../utils/acompanhamento.js"

const router = Router()
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("X-Robots-Tag", "noindex, nofollow")
  next()
})
// POST mantém o documento fora da URL; esta operação executa apenas leituras.
router.post("/consultar", criarLimitadorConsulta(), criarConsultaAcompanhamento(prisma))
export default router
