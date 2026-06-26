import { Router } from "express"

import {
  relatorioServicos,
  relatorioPendencias
} from "../controllers/relatorios.controller.js"

import {
  relatorioPedidosEntregues
} from "../controllers/relatorioPedidosEntregues.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.get("/servicos", authMiddleware, relatorioServicos)

router.get("/pendencias", authMiddleware, relatorioPendencias)

router.get(
  "/relatorio-pedidos-entregues",
  authMiddleware,
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioPedidosEntregues
)

export default router