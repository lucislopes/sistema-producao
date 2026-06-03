import { Router } from "express"

import {
  listarFuncionarios,
  criarFuncionario,
  atualizarFuncionario,
  listarOperadores,
  alterarSenhaFuncionario,
  deletarFuncionario
} from "../controllers/funcionarios.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/operadores",
  roleMiddleware(
    "ADMIN",
    "VENDEDOR",
    "VENDEDOR_OPERADOR"
  ),
  listarOperadores
)

router.get(
  "/",
  roleMiddleware("ADMIN"),
  listarFuncionarios
)

router.post(
  "/",
  roleMiddleware("ADMIN"),
  criarFuncionario
)

router.put(
  "/:id",
  roleMiddleware("ADMIN"),
  atualizarFuncionario
)

router.delete(
  "/:id",
  roleMiddleware("ADMIN"),
  deletarFuncionario
)

router.patch(
  "/:id/senha",
  roleMiddleware("ADMIN"),
  alterarSenhaFuncionario
)

export default router