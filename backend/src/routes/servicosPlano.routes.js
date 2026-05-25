import { Router } from "express"

import {
  listarServicosPorPlano,
  criarServicoPlano,
  atualizarServicoPlano,
  deletarServicoPlano,
  listarServicosDisponiveis,
  listarMeusServicos,
  assumirServico,
  alterarStatusServico
} from "../controllers/servicosPlano.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/disponiveis",
  roleMiddleware("OPERADOR", "ADMIN", "VENDEDOR_OPERADOR"),
  listarServicosDisponiveis
)

router.get(
  "/meus",
  roleMiddleware("OPERADOR", "ADMIN", "VENDEDOR_OPERADOR"),
  listarMeusServicos
)

router.put(
  "/assumir/:id",
  roleMiddleware("OPERADOR", "ADMIN", "VENDEDOR_OPERADOR"),
  assumirServico
)

router.put(
  "/status/:id",
  roleMiddleware("OPERADOR", "ADMIN", "VENDEDOR_OPERADOR"),
  alterarStatusServico
)

router.get(
  "/plano/:planoId",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR", "VENDEDOR_OPERADOR"),
  listarServicosPorPlano
)

router.post(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  criarServicoPlano
)

router.put(
  "/:id",
  roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"),
  atualizarServicoPlano
)

router.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  deletarServicoPlano
)

export default router