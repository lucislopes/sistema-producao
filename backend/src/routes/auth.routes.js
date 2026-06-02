import { Router } from "express"

import {
  login,
  alterarMinhaSenha
} from "../controllers/auth.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js"

const router = Router()

router.post("/login", login)

router.get("/teste-minha-senha", (req, res) => {
  return res.json({
    ok: true,
    rota: "/auth/teste-minha-senha"
  })
})

router.patch(
  "/minha-senha",
  authMiddleware,
  alterarMinhaSenha
)

export default router