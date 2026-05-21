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
  "/plano/:planoId",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR"),
  listarServicosPorPlano
)

router.post(
  "/",
  roleMiddleware("ADMIN", "VENDEDOR"),
  criarServicoPlano
)

router.put(
  "/:id",
  roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR"),
  atualizarServicoPlano
)

router.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  deletarServicoPlano
)

//
// OPERADOR
//

router.get(
  "/disponiveis",
  roleMiddleware("OPERADOR", "ADMIN"),
  listarServicosDisponiveis
)

router.get(
  "/meus",
  roleMiddleware("OPERADOR", "ADMIN"),
  listarMeusServicos
)

router.put(
  "/assumir/:id",
  roleMiddleware("OPERADOR", "ADMIN"),
  assumirServico
)

router.put(
  "/status/:id",
  roleMiddleware("OPERADOR", "ADMIN"),
  alterarStatusServico
)

export default router