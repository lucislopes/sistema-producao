import { Router } from "express"

import {
  listarPedidos,
  criarPedido,
  atualizarPedido
} from "../controllers/pedidos.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR"),
  listarPedidos
)

router.post(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR"),
  criarPedido
)

router.put(
  "/:id",
  roleMiddleware("ADMIN", "VENDEDOR"),
  atualizarPedido
)

export default router