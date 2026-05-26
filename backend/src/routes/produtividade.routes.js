import { Router } from "express"

import {
  produtividadeOperadores
} from "../controllers/produtividade.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/operadores",
  roleMiddleware(
    "ADMIN",
    "VENDEDOR",
    "VENDEDOR_OPERADOR"
  ),
  produtividadeOperadores
)

export default router