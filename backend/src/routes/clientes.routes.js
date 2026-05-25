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
router.get("/",roleMiddleware("ADMIN", "VENDEDOR", "OPERADOR",  "VENDEDOR_OPERADOR"), listarClientes)
//
// CRIAR
//
router.post("/",roleMiddleware("ADMIN", "VENDEDOR",  "VENDEDOR_OPERADOR"), criarCliente)
//
// EDITAR
//
router.put("/:id",roleMiddleware("ADMIN", "VENDEDOR", "VENDEDOR_OPERADOR"), atualizarCliente)
//
// EXCLUIR
//
router.delete("/:id",roleMiddleware("ADMIN"), deletarCliente)

export default router