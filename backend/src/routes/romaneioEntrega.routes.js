import { Router } from "express"

import {
  romaneioEntrega
} from "../controllers/romaneioEntrega.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware(
    "ADMIN",
    "VENDEDOR",
    "VENDEDOR_OPERADOR"
  ),
  romaneioEntrega
)

export default router