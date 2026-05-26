import { Router } from "express"

import {
  relatorioPedidos
} from "../controllers/relatorioPedidos.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware(
    "ADMIN",
    "VENDEDOR",
    "VENDEDOR_OPERADOR"
  ),
  relatorioPedidos
)

export default router