import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"
import { lazy, Suspense } from "react"

import { Login } from "./pages/Login"
import { MainLayout } from "./layouts/MainLayout"
import { PrivateRoute } from "./routes/PrivateRoute"

function lazyNamed(importer, nome) {
  return lazy(() => importer().then((modulo) => ({ default: modulo[nome] })))
}

const Dashboard = lazyNamed(() => import("./pages/Dashboard"), "Dashboard")
const Clientes = lazyNamed(() => import("./pages/Clientes"), "Clientes")
const Funcionarios = lazyNamed(() => import("./pages/Funcionarios"), "Funcionarios")
const Pedidos = lazyNamed(() => import("./pages/Pedidos"), "Pedidos")
const RotasEntrega = lazyNamed(() => import("./pages/RotasEntrega"), "RotasEntrega")
const TiposServico = lazyNamed(() => import("./pages/TiposServico"), "TiposServico")
const PlanosCorte = lazyNamed(() => import("./pages/PlanosCorte"), "PlanosCorte")
const ServicosPlano = lazyNamed(() => import("./pages/ServicosPlano"), "ServicosPlano")
const PainelOperador = lazyNamed(() => import("./pages/PainelOperador"), "PainelOperador")
const Kanban = lazyNamed(() => import("./pages/Kanban"), "Kanban")
const Expedicao = lazyNamed(() => import("./pages/Expedicao"), "Expedicao")
const RelatorioExpedicao = lazyNamed(() => import("./pages/RelatorioExpedicao"), "RelatorioExpedicao")
const RelatorioPedidos = lazyNamed(() => import("./pages/RelatorioPedidos"), "RelatorioPedidos")
const DetalhePedido = lazyNamed(() => import("./pages/DetalhePedido"), "DetalhePedido")
const RelatorioProducao = lazyNamed(() => import("./pages/RelatorioProducao"), "RelatorioProducao")
const Alertas = lazyNamed(() => import("./pages/Alertas"), "Alertas")
const ProdutividadeOperadores = lazyNamed(() => import("./pages/ProdutividadeOperadores"), "ProdutividadeOperadores")
const ConfiguracaoEmpresa = lazyNamed(() => import("./pages/ConfiguracaoEmpresa"), "ConfiguracaoEmpresa")
const MinhaSenha = lazyNamed(() => import("./pages/MinhaSenha"), "MinhaSenha")
const DashboardProducao = lazyNamed(() => import("./pages/dashboard/DashboardProducao"), "DashboardProducao")
const DashboardExpedicao = lazyNamed(() => import("./pages/dashboard/DashboardExpedicao"), "DashboardExpedicao")
const DashboardComercial = lazyNamed(() => import("./pages/dashboard/DashboardComercial"), "DashboardComercial")
const RelatorioServicos = lazyNamed(() => import("./pages/RelatorioServicos"), "RelatorioServicos")
const RelatorioPendencias = lazyNamed(() => import("./pages/RelatorioPendencias"), "RelatorioPendencias")
const RomaneioEntrega = lazyNamed(() => import("./pages/RomaneioEntrega"), "RomaneioEntrega")
const RelatorioAuditoriaFrete = lazyNamed(() => import("./pages/RelatorioAuditoriaFrete"), "RelatorioAuditoriaFrete")
const PlanoCorteServico = lazyNamed(() => import("./pages/PlanoCorteServico"), "PlanoCorteServico")
const RelatorioPedidosEntregues = lazyNamed(() => import("./pages/RelatorioPedidosEntregues.jsx"), "RelatorioPedidosEntregues")
const RelatorioConsumoChapas = lazyNamed(() => import("./pages/RelatorioConsumoChapas"), "RelatorioConsumoChapas")
const RelatorioProgramacaoChapas = lazyNamed(() => import("./pages/RelatorioProgramacaoChapas"), "RelatorioProgramacaoChapas")
const RelatorioComercialVendedores = lazyNamed(() => import("./pages/relatoriosNovos/RelatorioComercialVendedores"), "RelatorioComercialVendedores")
const RelatorioPontualidadeEntregas = lazyNamed(() => import("./pages/relatoriosNovos/RelatorioPontualidadeEntregas"), "RelatorioPontualidadeEntregas")
const RelatorioPedidosParados = lazyNamed(() => import("./pages/relatoriosNovos/RelatorioPedidosParados"), "RelatorioPedidosParados")


export default function App() {

  return (

    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Carregando...</div>}>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/clientes"
            element={<Clientes />}
          />

          <Route
            path="/funcionarios"
            element={<Funcionarios />}
          />

          <Route
            path="/pedidos"
            element={<Pedidos />}
          />

          <Route
            path="/plano-corte-servico"
            element={<PlanoCorteServico />}
          />

          <Route
            path="/rotas-entrega"
            element={<RotasEntrega />}
          />

          <Route
            path="/tipos-servico"
            element={<TiposServico />}
          />

          <Route
            path="/planos-corte"
            element={<PlanosCorte />}
          />

          <Route
            path="/servicos-plano"
            element={<ServicosPlano />}
          />

          <Route
            path="/painel-operador"
            element={<PainelOperador />}
          />

          <Route
            path="/kanban"
            element={<Kanban />}
          />
          
          <Route
            path="/expedicao"
            element={<Expedicao />}
          />

          <Route
            path="/relatorio-expedicao"
            element={<RelatorioExpedicao />}
          />
          <Route
            path="/relatorio-pedidos"
            element={<RelatorioPedidos />}
          />

          <Route
            path="/pedidos/:id"
            element={<DetalhePedido />}
          />

          <Route
            path="/relatorio-producao"
            element={<RelatorioProducao />}
          />

          <Route
            path="/alertas"
            element={<Alertas />}
          />

          <Route
            path="/produtividade-operadores"
            element={<ProdutividadeOperadores />}
          />

          <Route
            path="/configuracao-empresa"
            element={<ConfiguracaoEmpresa />}
          />

          <Route path="/minha-senha" element={<MinhaSenha />} />
          <Route path="/dashboard/producao" element={<DashboardProducao />} />
          <Route path="/dashboard/expedicao" element={<DashboardExpedicao />} />
          <Route path="/dashboard/comercial" element={<DashboardComercial />} />
          <Route path="/relatorio-servicos" element={<RelatorioServicos />} />
          <Route path="/relatorio-pendencias" element={<RelatorioPendencias />} />

          <Route
            path="/romaneio-entrega"
            element={<RomaneioEntrega />}
          />

          <Route
            path="/relatorio-auditoria-frete"
            element={<RelatorioAuditoriaFrete />}
          />

          <Route
            path="/relatorio-pedidos-entregues"
            element={<RelatorioPedidosEntregues />}
          />

          <Route
            path="/relatorio-consumo-chapas"
            element={<RelatorioConsumoChapas />}
          />

          <Route
            path="/relatorio-programacao-chapas"
            element={<RelatorioProgramacaoChapas />}
          />

          <Route
            path="/relatorios-novos/comercial-vendedores"
            element={<RelatorioComercialVendedores />}
          />
          <Route
            path="/relatorios-novos/pontualidade-entregas"
            element={<RelatorioPontualidadeEntregas />}
          />
          <Route
            path="/relatorios-novos/pedidos-parados"
            element={<RelatorioPedidosParados />}
          />
          

        </Route>

      </Routes>
      </Suspense>

    </BrowserRouter>
  )
}
