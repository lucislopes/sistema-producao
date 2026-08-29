import { Router } from "express"
import { relatorioComercialVendedores, relatorioPontualidadeEntregas } from "../controllers/relatoriosNovos.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)
router.get(
  "/comercial-vendedores",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioComercialVendedores
)
router.get(
  "/pontualidade-entregas",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioPontualidadeEntregas
)

export default router
