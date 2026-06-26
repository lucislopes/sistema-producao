import { Router } from "express"

import {
  listarPedidos,
  criarPedido,
  atualizarPedido,
} from "../controllers/pedidos.controller.js"

import {
  relatorioPedidosEntregues
} from "../controllers/relatorioPedidosEntregues.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR",  "VENDEDOR_OPERADOR"),
  listarPedidos
)

router.post(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR",  "VENDEDOR_OPERADOR"),
  criarPedido
)

router.get(
  "/relatorio-pedidos-entregues",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioPedidosEntregues
)

router.put(
  "/:id",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  atualizarPedido
)

export default router