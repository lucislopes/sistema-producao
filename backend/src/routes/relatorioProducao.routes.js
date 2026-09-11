import { Router } from "express"

import {
  relatorioProducao,
  relatorioProducaoMensal
} from "../controllers/relatorioProducao.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"


const router = Router()

router.use(authMiddleware)

/*
  RELATÓRIO DE PRODUÇÃO ATUAL
*/
router.get(
  "/",
  roleMiddleware(
    "ADMIN",
    "VENDEDOR",
    "OPERADOR",
    "VENDEDOR_OPERADOR"
  ),
  relatorioProducao
)

/*
  NOVO RELATÓRIO MENSAL DE PRODUÇÃO
*/
router.get(
  "/mensal",
  roleMiddleware(
    "ADMIN",
    "VENDEDOR",
    "OPERADOR",
    "VENDEDOR_OPERADOR"
  ),
  relatorioProducaoMensal
)

export default router