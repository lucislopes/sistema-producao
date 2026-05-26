import { Router } from "express"

import { authMiddleware } from "../middlewares/auth.middleware.js"

import {
  buscaGlobal
} from "../controllers/buscaGlobal.controller.js"

const router = Router()

router.use(authMiddleware)

router.get("/", buscaGlobal)

export { router as buscaGlobalRoutes }