import { Router } from "express"

import {
  listarHistoricoPedido
} from "../controllers/historicoPedido.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/:pedidoId",
  roleMiddleware(
    "ADMIN",
    "VENDEDOR",
    "OPERADOR",
    "VENDEDOR_OPERADOR"
  ),
  listarHistoricoPedido
)

export default router