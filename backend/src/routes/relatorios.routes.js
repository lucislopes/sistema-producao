import { Router } from "express"
import { relatorioServicos } from "../controllers/relatorios.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { relatorioPendencias } from "../controllers/relatorios.controller.js"

const router = Router()

router.get("/servicos", authMiddleware, relatorioServicos)
router.get("/pendencias", authMiddleware, relatorioPendencias)

export default router