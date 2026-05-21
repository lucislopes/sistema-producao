import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import authRoutes from "./routes/auth.routes.js"
import clientesRoutes from "./routes/clientes.routes.js"
import funcionariosRoutes from "./routes/funcionarios.routes.js"
import rotasEntregaRoutes from "./routes/rotasEntrega.routes.js"
import tiposServicoRoutes from "./routes/tiposServico.routes.js"
import pedidosRoutes from "./routes/pedidos.routes.js"
import planosCorteRoutes from "./routes/planosCorte.routes.js"
import servicosPlanoRoutes from "./routes/servicosPlano.routes.js"
import kanbanRoutes from "./routes/kanban.routes.js"
import expedicaoRoutes from "./routes/expedicao.routes.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use("/auth", authRoutes)
app.use("/clientes", clientesRoutes)
app.use("/funcionarios", funcionariosRoutes)
app.use("/rotas-entrega", rotasEntregaRoutes)
app.use("/tipos-servico", tiposServicoRoutes)
app.use("/pedidos", pedidosRoutes)
app.use("/planos-corte", planosCorteRoutes)
app.use("/servicos-plano", servicosPlanoRoutes)
app.use("/kanban", kanbanRoutes)
app.use("/expedicao", expedicaoRoutes)

app.get("/", (req, res) => {
  return res.json({
    message: "API funcionando"
  })
})

app.listen(3333, () => {
  console.log("Servidor rodando na porta 3333")
})