import { Router } from "express"

import {
  relatorioExpedicao
} from "../controllers/relatorioExpedicao.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioExpedicao
)

export default router