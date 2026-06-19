import { Router } from "express"

import {
  criarPlanosComServicos,
  listarPlanosComServicosPorPedido,
  atualizarPlanoComServicos
} from "../controllers/planoCorteServico.controller.js"


import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/pedido/:pedidoId",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR", "VENDEDOR_OPERADOR"),
  listarPlanosComServicosPorPedido
)

router.put(
  "/:id",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  atualizarPlanoComServicos
)

router.post(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  criarPlanosComServicos
)

export default router