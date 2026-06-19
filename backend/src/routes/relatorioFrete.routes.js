import { Router } from "express"

import { relatorioAuditoriaFrete } from "../controllers/relatorioFrete.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/auditoria",
  roleMiddleware("ADMIN"),
  relatorioAuditoriaFrete
)

export default router