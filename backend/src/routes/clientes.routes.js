import { Router } from "express"

import {
  listarClientes,
  criarCliente,
  atualizarCliente,
  deletarCliente
} from "../controllers/clientes.controller.js"

import {
    authMiddleware
} from "../middlewares/auth.middleware.js"

import {
  roleMiddleware
} from "../middlewares/role.middleware.js"

const router = Router()
router.use(authMiddleware)
//
//LISTAR
//
router.get("/",roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR"), listarClientes)
//
// CRIAR
//
router.post("/",roleMiddleware("ADMIN", "VENDEDOR"), criarCliente)
//
// EDITAR
//
router.put("/:id",roleMiddleware("ADMIN", "VENDEDOR"), atualizarCliente)
//
// EXCLUIR
//
router.delete("/:id",roleMiddleware("ADMIN"), deletarCliente)

export default router