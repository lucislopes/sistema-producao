import { Router } from "express"

import {
  relatorioConsumoChapas
} from "../controllers/relatorioConsumoChapas.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "VENDEDOR_OPERADOR"),
  relatorioConsumoChapas
)

export default router