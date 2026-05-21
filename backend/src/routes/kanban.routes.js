import { Router } from "express"

import { obterKanban } from "../controllers/kanban.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR"),
  obterKanban
)

export default router