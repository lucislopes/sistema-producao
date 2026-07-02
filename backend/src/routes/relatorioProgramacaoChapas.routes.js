import { Router } from "express"

import {
  relatorioProgramacaoChapas
} from "../controllers/relatorioProgramacaoChapas.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioProgramacaoChapas
)

export default router