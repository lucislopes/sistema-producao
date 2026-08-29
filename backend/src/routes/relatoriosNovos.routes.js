import { Router } from "express"
import { relatorioAuditoriaCadastro, relatorioCarteiraPedidos, relatorioComercialVendedores, relatorioGerencialClientes, relatorioPedidosParados, relatorioPontualidadeEntregas } from "../controllers/relatoriosNovos.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)
router.get(
  "/auditoria-cadastro",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioAuditoriaCadastro
)
router.get(
  "/carteira-pedidos",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioCarteiraPedidos
)
router.get(
  "/clientes",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioGerencialClientes
)
router.get(
  "/comercial-vendedores",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioComercialVendedores
)
router.get(
  "/pedidos-parados",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioPedidosParados
)
router.get(
  "/pontualidade-entregas",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  relatorioPontualidadeEntregas
)

export default router
