import { Router } from "express"
import { obterModoTV } from "../controllers/modoTV.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.get("/", authMiddleware, roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR", "VENDEDOR_OPERADOR"), obterModoTV)

export default router
