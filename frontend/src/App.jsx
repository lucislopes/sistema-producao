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



        </Route>

      </Routes>

    </BrowserRouter>
  )
}