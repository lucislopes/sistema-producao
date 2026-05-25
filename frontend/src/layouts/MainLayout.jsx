import { Outlet, Link, useNavigate } from "react-router-dom"
import { useContext } from "react"

import { AuthContext } from "../contexts/AuthContext"

export function MainLayout() {

  const { logout, usuario } = useContext(AuthContext)

  const navigate = useNavigate()

  const funcao = usuario?.funcao

  const isAdmin =
    funcao === "ADMIN"

  const isVendedor =
    funcao === "VENDEDOR"

  const isOperador =
    funcao === "OPERADOR"

  const isVendedorOperador =
    funcao === "VENDEDOR_OPERADOR"

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

          {(isAdmin || isVendedor || isVendedorOperador) && (
            <>

              <Link to="/clientes">
                Clientes
              </Link>

              <Link to="/pedidos">
                Pedidos
              </Link>

              <Link to="/planos-corte">
                Planos de Corte
              </Link>

              <Link to="/servicos-plano">
                Serviços do Plano
              </Link>

              <Link to="/expedicao">
                Expedição
              </Link>

              <Link to="/relatorio-expedicao">
                Relatório Expedição
              </Link>

            </>
          )}

          {(isAdmin || isOperador || isVendedorOperador) && (
            <>

              <Link to="/painel-operador">
                Painel Operador
              </Link>

              <Link to="/kanban">
                Kanban
              </Link>

            </>
          )}

          {isAdmin && (
            <>

              <Link to="/funcionarios">
                Funcionários
              </Link>

              <Link to="/rotas-entrega">
                Rotas Entrega
              </Link>

              <Link to="/tipos-servico">
                Tipos Serviço
              </Link>

            </>
          )}

        </nav>

        <div className="mt-10 border-t border-gray-700 pt-4">

          <p className="mb-1 text-sm">
            {usuario?.nome}
          </p>

          <p className="mb-4 text-xs text-gray-400">
            {usuario?.funcao}
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