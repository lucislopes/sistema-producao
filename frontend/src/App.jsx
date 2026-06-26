import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"

import { Login } from "./pages/Login"
import { Dashboard } from "./pages/Dashboard"
import { Clientes } from "./pages/Clientes"
import { Funcionarios } from "./pages/Funcionarios"
import { Pedidos } from "./pages/Pedidos"
import { MainLayout } from "./layouts/MainLayout"
import { PrivateRoute } from "./routes/PrivateRoute"
import { RotasEntrega } from "./pages/RotasEntrega"
import { TiposServico } from "./pages/TiposServico"
import { PlanosCorte } from "./pages/PlanosCorte"
import { ServicosPlano } from "./pages/ServicosPlano"
import { PainelOperador } from "./pages/PainelOperador"
import { Kanban } from "./pages/Kanban"
import { Expedicao } from "./pages/Expedicao"
import { RelatorioExpedicao } from "./pages/RelatorioExpedicao"
import { RelatorioPedidos } from "./pages/RelatorioPedidos"
import { DetalhePedido } from "./pages/DetalhePedido"
import { RelatorioProducao } from "./pages/RelatorioProducao"
import { Alertas } from "./pages/Alertas"
import { ProdutividadeOperadores } from "./pages/ProdutividadeOperadores"
import { ConfiguracaoEmpresa } from "./pages/ConfiguracaoEmpresa"
import { MinhaSenha } from "./pages/MinhaSenha"
import { DashboardProducao } from "./pages/dashboard/DashboardProducao"
import { DashboardExpedicao } from "./pages/dashboard/DashboardExpedicao"
import { DashboardComercial } from "./pages/dashboard/DashboardComercial"
import { RelatorioServicos } from "./pages/RelatorioServicos"
import { RelatorioPendencias } from "./pages/RelatorioPendencias"
import { RomaneioEntrega } from "./pages/RomaneioEntrega"
import { RelatorioAuditoriaFrete } from "./pages/RelatorioAuditoriaFrete"
import { PlanoCorteServico } from "./pages/PlanoCorteServico"
import { RelatorioPedidosEntregues } from "./pages/RelatorioPedidosEntregues.jsx"


export default function App() {

  return (

    <BrowserRouter>

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
          

        </Route>

      </Routes>

    </BrowserRouter>
  )
}