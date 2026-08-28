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
import dashboardRoutes from "./routes/dashboard.routes.js"
import relatorioExpedicaoRoutes from "./routes/relatorioExpedicao.routes.js"
import historicoPedidoRoutes from "./routes/historicoPedido.routes.js"
import relatorioPedidosRoutes from "./routes/relatorioPedidos.routes.js"
import detalhePedidoRoutes from "./routes/detalhePedido.routes.js"
import relatorioProducaoRoutes from "./routes/relatorioProducao.routes.js"
import alertasRoutes from "./routes/alertas.routes.js"
import produtividadeRoutes from "./routes/produtividade.routes.js"
import { buscaGlobalRoutes } from "./routes/buscaGlobal.routes.js"
import configuracaoEmpresaRoutes from "./routes/configuracaoEmpresa.routes.js"
import relatoriosRoutes from "./routes/relatorios.routes.js"
import romaneioEntregaRoutes from "./routes/romaneioEntrega.routes.js"
import relatorioFreteRoutes from "./routes/relatorioFrete.routes.js"
import planoCorteServicoRoutes from "./routes/planoCorteServico.routes.js"
import relatorioConsumoChapasRoutes from "./routes/relatorioConsumoChapas.routes.js"
import relatorioProgramacaoChapasRoutes from "./routes/relatorioProgramacaoChapas.routes.js"




dotenv.config()
const app = express()

app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
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
app.use("/dashboard", dashboardRoutes)
app.use("/relatorio-expedicao", relatorioExpedicaoRoutes)
app.use("/historico-pedido", historicoPedidoRoutes)
app.use("/relatorio-pedidos", relatorioPedidosRoutes)
app.use("/detalhe-pedido", detalhePedidoRoutes)
app.use("/relatorio-producao", relatorioProducaoRoutes)
app.use("/alertas", alertasRoutes)
app.use("/produtividade", produtividadeRoutes)
app.use("/busca-global", buscaGlobalRoutes)
app.use("/configuracao-empresa", configuracaoEmpresaRoutes)
app.use("/relatorios", relatoriosRoutes)
app.use("/romaneio-entrega", romaneioEntregaRoutes)
app.use("/relatorio-frete", relatorioFreteRoutes)
app.use("/plano-corte-servico", planoCorteServicoRoutes)
app.use("/relatorios", relatoriosRoutes)
app.use("/relatorio-consumo-chapas", relatorioConsumoChapasRoutes)
app.use("/relatorio-programacao-chapas", relatorioProgramacaoChapasRoutes)

app.get("/", (req, res) => {
  return res.json({
    message: "API funcionando"
  })
})

const port = Number(process.env.PORT) || 3333

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})
