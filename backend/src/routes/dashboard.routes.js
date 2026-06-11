import { Router } from "express"

import {
  obterDashboard
} from "../controllers/dashboard.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR", "VENDEDOR_OPERADOR"),
  obterDashboard
)

export default router