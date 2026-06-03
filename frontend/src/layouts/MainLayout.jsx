import { Outlet, NavLink, Link, useNavigate, useLocation } from "react-router-dom"
import { useContext, useEffect, useRef, useState } from "react"

import { AuthContext } from "../contexts/AuthContext"
import { BuscaGlobal } from "../components/BuscaGlobal"

export function MainLayout() {
  const { logout, usuario } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const funcao = usuario?.funcao

  const isAdmin = funcao === "ADMIN"
  const isVendedor = funcao === "VENDEDOR"
  const isOperador = funcao === "OPERADOR"
  const isVendedorOperador = funcao === "VENDEDOR_OPERADOR"

  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function fecharMenu(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuAberto(false)
      }
    }

    document.addEventListener("mousedown", fecharMenu)

    return () => {
      document.removeEventListener("mousedown", fecharMenu)
    }
  }, [])

  function MenuGrupo({ titulo, children }) {
    return (
      <div>
        <p className="text-xs uppercase text-gray-400 font-bold mt-5 mb-2">
          {titulo}
        </p>

        <div className="flex flex-col gap-1">
          {children}
        </div>
      </div>
    )
  }

  function MenuLink({ to, children }) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `
          text-sm px-3 py-2 rounded-lg transition
          ${
            isActive
              ? "bg-gray-800 text-white font-semibold"
              : "text-gray-100 hover:text-white hover:bg-gray-800"
          }
          `
        }
      >
        {children}
      </NavLink>
    )
  }

  function tituloPagina() {
    const path = location.pathname

    if (path.startsWith("/pedidos/")) return "Detalhe do Pedido"

    const titulos = {
      "/dashboard": "Dashboard",
      "/clientes": "Clientes",
      "/pedidos": "Pedidos",
      "/funcionarios": "Funcionários",
      "/rotas-entrega": "Rotas de Entrega",
      "/tipos-servico": "Tipos de Serviço",
      "/planos-corte": "Planos de Corte",
      "/servicos-plano": "Serviços do Plano",
      "/painel-operador": "Painel Operador",
      "/kanban": "Kanban",
      "/expedicao": "Expedição",
      "/relatorio-expedicao": "Relatório de Expedição",
      "/relatorio-pedidos": "Relatório de Pedidos",
      "/relatorio-producao": "Relatório de Produção",
      "/alertas": "Alertas",
      "/produtividade-operadores": "Produtividade",
      "/configuracao-empresa": "Configurações",
      "/minha-senha": "Alterar Senha"
    }

    return titulos[path] || "Sistema"
  }

  function sair() {
    logout()
    navigate("/")
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white p-4 min-h-screen overflow-y-auto sticky top-0 no-print">
        <h1 className="text-2xl font-bold mb-8">
          Produção
        </h1>

        <nav className="flex flex-col">
          <MenuGrupo titulo="Principal">
            <MenuLink to="/dashboard">
              Dashboard
            </MenuLink>
          </MenuGrupo>

          {(isAdmin || isVendedor || isVendedorOperador) && (
            <MenuGrupo titulo="Operação">
              <MenuLink to="/pedidos">
                Pedidos
              </MenuLink>

              <MenuLink to="/planos-corte">
                Planos de Corte
              </MenuLink>

              <MenuLink to="/servicos-plano">
                Serviços do Plano
              </MenuLink>

              <MenuLink to="/expedicao">
                Expedição
              </MenuLink>
            </MenuGrupo>
          )}

          {(isAdmin || isOperador || isVendedorOperador) && (
            <MenuGrupo titulo="Produção">
              <MenuLink to="/painel-operador">
                Painel Operador
              </MenuLink>

              <MenuLink to="/kanban">
                Kanban
              </MenuLink>
            </MenuGrupo>
          )}

          {(isAdmin || isVendedor || isVendedorOperador) && (
            <MenuGrupo titulo="Relatórios">
              <MenuLink to="/relatorio-expedicao">
                Expedição
              </MenuLink>

              <MenuLink to="/relatorio-pedidos">
                Pedidos
              </MenuLink>

              <MenuLink to="/relatorio-producao">
                Produção
              </MenuLink>

              <MenuLink to="/alertas">
                Alertas
              </MenuLink>

              <MenuLink to="/produtividade-operadores">
                Produtividade
              </MenuLink>
            </MenuGrupo>
          )}

          {isAdmin && (
            <MenuGrupo titulo="Cadastros">
              <MenuLink to="/clientes">
                Clientes
              </MenuLink>

              <MenuLink to="/funcionarios">
                Funcionários
              </MenuLink>

              <MenuLink to="/rotas-entrega">
                Rotas de Entrega
              </MenuLink>

              <MenuLink to="/tipos-servico">
                Tipos de Serviço
              </MenuLink>
            </MenuGrupo>
          )}

          {isAdmin && (
            <MenuGrupo titulo="Sistema">
              <MenuLink to="/configuracao-empresa">
                Configurações
              </MenuLink>
            </MenuGrupo>
          )}
        </nav>

        <div className="mt-10 border-t border-gray-700 pt-4">
          <p className="mb-1 text-sm font-semibold">
            {usuario?.nome}
          </p>

          <p className="mb-4 text-xs text-gray-400">
            {usuario?.funcao}
          </p>

          <div className="flex flex-col gap-2">
            <NavLink
              to="/minha-senha"
              className={({ isActive }) =>
                `
                text-sm px-3 py-2 rounded-lg transition
                ${
                  isActive
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-100 hover:text-white hover:bg-gray-800"
                }
                `
              }
            >
              Alterar Senha
            </NavLink>

            <button
              type="button"
              className="text-left text-sm text-gray-100 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition"
              onClick={sair}
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <div className="bg-white rounded-2xl shadow-sm border px-4 py-3 mb-6 flex items-center gap-4 no-print">
          <h1 className="text-2xl font-bold whitespace-nowrap">
            {tituloPagina()}
          </h1>

          <div className="flex-1" />

          <div className="w-[380px]">
            <BuscaGlobal />
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuAberto(!menuAberto)}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-800 transition"
            >
              ⚡ Ações
            </button>

            {menuAberto && (
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
                <Link
                  to="/pedidos"
                  className="block px-4 py-3 hover:bg-gray-100 text-sm"
                  onClick={() => setMenuAberto(false)}
                >
                  Pedidos
                </Link>

                <Link
                  to="/expedicao"
                  className="block px-4 py-3 hover:bg-gray-100 text-sm"
                  onClick={() => setMenuAberto(false)}
                >
                  Expedição
                </Link>

                <Link
                  to="/kanban"
                  className="block px-4 py-3 hover:bg-gray-100 text-sm"
                  onClick={() => setMenuAberto(false)}
                >
                  Kanban
                </Link>

                <Link
                  to="/alertas"
                  className="block px-4 py-3 hover:bg-gray-100 text-sm"
                  onClick={() => setMenuAberto(false)}
                >
                  Alertas
                </Link>

                <Link
                  to="/relatorio-pedidos"
                  className="block px-4 py-3 hover:bg-gray-100 text-sm"
                  onClick={() => setMenuAberto(false)}
                >
                  Relatório de Pedidos
                </Link>

                <Link
                  to="/relatorio-expedicao"
                  className="block px-4 py-3 hover:bg-gray-100 text-sm"
                  onClick={() => setMenuAberto(false)}
                >
                  Relatório de Expedição
                </Link>
              </div>
            )}
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  )
}