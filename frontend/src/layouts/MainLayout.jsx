import { Outlet, Link } from "react-router-dom"
import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

export function MainLayout() {
    const { logout, usuario } = useContext(AuthContext)
    const navigate = useNavigate()

  return (

    <div className="flex min-h-screen">

      <aside className="w-64 bg-gray-900 text-white p-4">

        <h1 className="text-2xl font-bold mb-8">
          Produção
        </h1>

        <nav className="flex flex-col gap-3">

          <Link to="/dashboard">
            Dashboard
          </Link>

          <Link to="/clientes">
            Clientes
          </Link>

          <Link to="/funcionarios">
            Funcionários
          </Link>

          <Link to="/pedidos">
            Pedidos
          </Link>

          <Link to="/rotas-entrega">
            Rotas Entrega
          </Link>

          <Link to="/tipos-servico">
            Tipos Serviço
          </Link>

          <Link to="/planos-corte">
            Planos de Corte
          </Link>

          <Link to="/servicos-plano">
            Serviços do Plano
          </Link>

          <Link to="/painel-operador">
            Painel Operador
          </Link>

          <Link to="/kanban">
            Kanban
          </Link>

          <Link to="/expedicao">
            Expedição
          </Link>          

        </nav>
        <div className="mt-10">

            <p className="mb-4 text-sm">
                {usuario?.nome}
            </p>

            <button
                onClick={() => {
                logout()
                navigate("/")
                }}
                className="bg-red-500 px-4 py-2 rounded-lg w-full"
            >
                Sair
            </button>

        </div>

      </aside>

      <main className="flex-1 bg-gray-100 p-6">
        <Outlet />
      </main>

    </div>
  )
}