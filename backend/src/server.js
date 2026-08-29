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
import relatoriosNovosRoutes from "./routes/relatoriosNovos.routes.js"
import modoTVRoutes from "./routes/modoTV.routes.js"
import { securityHeaders } from "./middlewares/security.middleware.js"
import { errorMiddleware, rotaNaoEncontrada } from "./middlewares/error.middleware.js"




dotenv.config()

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado")
}

const app = express()

app.set("trust proxy", 1)
app.disable("x-powered-by")
app.use(securityHeaders)

const origensPermitidas = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origem) => origem.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || origensPermitidas.length === 0 || origensPermitidas.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error("Origem não permitida pelo CORS"))
  }
}))
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
app.use("/relatorios-novos", relatoriosNovosRoutes)
app.use("/modo-tv", modoTVRoutes)

app.get("/", (req, res) => {
  return res.json({
    message: "API funcionando"
  })
})

const port = Number(process.env.PORT) || 3333

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`)
})

app.get("/health", (req, res) => {
  return res.json({ status: "ok" })
})

app.use(rotaNaoEncontrada)
app.use(errorMiddleware)
