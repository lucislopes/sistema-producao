import { Router } from "express"
import { prisma } from "../lib/prisma.js"
import { criarConsultaAcompanhamento, criarLimitadorConsulta, resumoSite } from "../utils/acompanhamento.js"

const router = Router()
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("X-Robots-Tag", "noindex, nofollow")
  next()
})
// POST mantém o documento fora da URL; esta operação executa apenas leituras.
router.post("/consultar", criarLimitadorConsulta(), criarConsultaAcompanhamento(prisma))
router.post('/consultar-site', criarLimitadorConsulta(), (req,res,next) => {
  if (typeof req.body?.documento !== 'string' || !/^(?:\d{11}|\d{14})$/.test(req.body.documento)) return res.status(404).json({error:'Não foi possível localizar o pedido com os dados informados.'});
  next();
}, criarConsultaAcompanhamento(prisma, resumoSite))
export default router
