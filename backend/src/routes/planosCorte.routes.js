import { Router } from "express"

import {
  listarPlanosPorPedido,
  criarPlanoCorte,
  atualizarPlanoCorte,
  deletarPlanoCorte
} from "../controllers/planosCorte.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/pedido/:pedidoId",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR", "VENDEDOR_OPERADOR"),
  listarPlanosPorPedido
)

router.post(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  criarPlanoCorte
)

router.put(
  "/:id",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  atualizarPlanoCorte
)

router.delete(
  "/:id",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  deletarPlanoCorte
)

export default router