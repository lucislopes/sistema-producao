import { Router } from "express"

import {
  listarRotas,
  criarRota,
  atualizarRota,
  deletarRota
} from "../controllers/rotasEntrega.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", ),
  listarRotas
)

router.post(
  "/",
  roleMiddleware("ADMIN"),
  criarRota
)

router.put(
  "/:id",
  roleMiddleware("ADMIN"),
  atualizarRota
)

router.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  deletarRota
)

export default router