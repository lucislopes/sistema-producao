import { Router } from "express"

import {
  login,
  alterarMinhaSenha,
  usuarioAtual
} from "../controllers/auth.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"
import { limitarLogin } from "../middlewares/security.middleware.js"

const router = Router()

router.post("/login", limitarLogin, login)
router.get("/me", authMiddleware, usuarioAtual)

router.patch(
  "/minha-senha",
  authMiddleware,
  alterarMinhaSenha
)

export default router
