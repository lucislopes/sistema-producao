import { Router } from "express"

import {
  listarTiposServico,
  criarTipoServico,
  atualizarTipoServico,
  deletarTipoServico
} from "../controllers/tiposServico.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR"),
  listarTiposServico
)

router.post(
  "/",
  roleMiddleware("ADMIN"),
  criarTipoServico
)

router.put(
  "/:id",
  roleMiddleware("ADMIN"),
  atualizarTipoServico
)

router.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  deletarTipoServico
)

export default router