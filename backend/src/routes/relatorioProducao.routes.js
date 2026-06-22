import { Router } from "express"

import {
  relatorioProducao
} from "../controllers/relatorioProducao.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

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

export default router