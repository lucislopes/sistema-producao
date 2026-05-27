import { Router } from "express"

import {
  obterConfiguracaoEmpresa,
  salvarConfiguracaoEmpresa
} from "../controllers/configuracaoEmpresa.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { roleMiddleware } from "../middlewares/role.middleware.js"

const router = Router()

router.use(authMiddleware)

router.get(
  "/",
  roleMiddleware("ADMIN"),
  obterConfiguracaoEmpresa
)

router.put(
  "/",
  roleMiddleware("ADMIN"),
  salvarConfiguracaoEmpresa
)

export default router