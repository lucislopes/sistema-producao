import { Router } from "express"

import {
  detalhePedido
} from "../controllers/detalhePedido.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/:id",
  roleMiddleware(
    "ADMIN",
    "VENDEDOR",
    "OPERADOR",
    "VENDEDOR_OPERADOR"
  ),
  detalhePedido
)

export default router