import { Router } from "express"

import {
  listarExpedicao,
  alterarStatusExpedicao
} from "../controllers/expedicao.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  listarExpedicao
)

router.put(
  "/:id/status",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  alterarStatusExpedicao
)

export default router