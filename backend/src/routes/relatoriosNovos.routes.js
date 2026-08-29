import { Router } from "express"
import { relatorioComercialVendedores } from "../controllers/relatoriosNovos.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)
router.get(
  "/comercial-vendedores",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioComercialVendedores
)

export default router
