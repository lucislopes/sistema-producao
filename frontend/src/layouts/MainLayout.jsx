import {
  Outlet,
  NavLink,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom"
import {
  useContext,
  useEffect,
  useRef,
  useState
} from "react"

import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Scissors,
  ListChecks,
  Truck,
  Factory,
  Columns3,
  BarChart3,
  FileText,
  Bell,
  Users,
  UserCog,
  MapPinned,
  Wrench,
  Settings,
  KeyRound,
  LogOut,
  ChevronDown,
  ChevronRight,
  Zap,
  TriangleAlert,
  DollarSign
} from "lucide-react"

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
  const [gruposAbertos, setGruposAbertos] = useState({
    Principal: true,
    Dashboards: false,
    Operação: true,
    Produção: true,
    Relatórios: false,
    Cadastros: false,
    Sistema: false
  })

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

  function alternarGrupo(titulo) {
    setGruposAbertos((atual) => ({
      ...atual,
      [titulo]: !atual[titulo]
    }))
  }

  function MenuGrupo({ titulo, children }) {
    const aberto = gruposAbertos[titulo]

    return (
      <div>
        <button
          type="button"
          onClick={() => alternarGrupo(titulo)}
          className="
            w-full flex items-center justify-between
            text-xs uppercase text-gray-400 font-bold
            mt-5 mb-2 hover:text-gray-200 transition
          "
        >
          <span>{titulo}</span>

          {aberto ? (
            <ChevronDown size={15} />
          ) : (
            <ChevronRight size={15} />
          )}
        </button>

        {aberto && (
          <div className="flex flex-col gap-1">
            {children}
          </div>
        )}
      </div>
    )
  }

  function MenuLink({ to, icon: Icon, children }) {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `
          text-sm px-3 py-2 rounded-lg transition
          flex items-center gap-2
          ${
            isActive
              ? "bg-gray-800 text-white font-semibold"
              : "text-gray-100 hover:text-white hover:bg-gray-800"
          }
          `
        }
      >
        {Icon && <Icon size={17} />}
        <span>{children}</span>
      </NavLink>
    )
  }

  function tituloPagina() {
    const path = location.pathname

    if (path.startsWith("/pedidos/")) return "Detalhe do Pedido"

    const titulos = {
      "/dashboard": "Dashboard",
      "/dashboard/producao": "Dashboard Produção",
      "/dashboard/expedicao": "Dashboard Expedição",
      "/dashboard/comercial": "Dashboard Comercial",
      "/clientes": "Clientes",
      "/pedidos": "Pedidos",
      "/funcionarios": "Funcionários",
      "/rotas-entrega": "Rotas de Entrega",
      "/tipos-servico": "Tipos de Serviço",
      "/planos-corte": "Planos de Corte",
      "/plano-corte-servico": "Planos de Corte e Serviços",
      "/servicos-plano": "Serviços do Plano",
      "/painel-operador": "Painel Operador",
      "/kanban": "Kanban",
      "/expedicao": "Expedição",
      "/relatorio-expedicao": "Relatório de Expedição",
      "/romaneio-entrega": "Romaneio de Entrega",
      "/relatorio-pedidos": "Relatório de Pedidos",
      "/relatorio-producao": "Relatório de Produção",
      "/alertas": "Alertas",
      "/produtividade-operadores": "Produtividade",
      "/configuracao-empresa": "Configurações",
      "/minha-senha": "Alterar Senha",
      "/relatorio-auditoria-frete": "Auditoria de Frete"
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
        <h1 className="text-2xl font-bold mb-6">
          Produção
        </h1>

        <nav className="flex flex-col">
          <MenuGrupo titulo="Principal">
            <MenuLink to="/dashboard" icon={LayoutDashboard}>
              Dashboard
            </MenuLink>
          </MenuGrupo>

        {/*
          {(isAdmin || isVendedor || isVendedorOperador) && (
            <MenuGrupo titulo="Dashboards">
              <MenuLink to="/dashboard/producao" icon={Factory}>
                Produção
              </MenuLink>

              <MenuLink to="/dashboard/expedicao" icon={Truck}>
                Expedição
              </MenuLink>

              <MenuLink to="/dashboard/comercial" icon={BarChart3}>
                Comercial
              </MenuLink>
            </MenuGrupo>
          )}
        */}

          {(isAdmin || isVendedor || isVendedorOperador || isOperador) && (
            <MenuGrupo titulo="Operação">
              {(isAdmin || isVendedor || isVendedorOperador) && (
                <>
                  <MenuLink to="/pedidos" icon={ShoppingCart}>
                    Pedidos
                  </MenuLink>

                  {/*
                  <MenuLink to="/planos-corte" icon={Scissors}>
                   Planos de Corte
                  </MenuLink>
                  */}

                  <MenuLink to="/plano-corte-servico" icon={Scissors}>
                    Planos de Corte e Serviços
                  </MenuLink>
                </>
              )}
            {/*
              <MenuLink to="/servicos-plano" icon={ListChecks}>
                Serviços do Plano
              </MenuLink>
            */}
              {(isAdmin || isVendedor || isVendedorOperador)  && (
                <MenuLink to="/expedicao" icon={Truck}>
                  Expedição
                </MenuLink>
              )}
            </MenuGrupo>
          )}

          {(isAdmin || isOperador || isVendedorOperador) && (
            <MenuGrupo titulo="Produção">
              {/*
              <MenuLink to="/painel-operador" icon={Factory}>
                Painel Operador
              </MenuLink>
              */}

              <MenuLink to="/kanban" icon={Columns3}>
                Kanban
              </MenuLink>
            </MenuGrupo>
          )}

          {(isAdmin || isVendedor || isVendedorOperador || isOperador) && (
            <MenuGrupo titulo="Relatórios">
              {(isAdmin || isVendedor || isVendedorOperador) && (
                <>
                  <MenuLink to="/relatorio-expedicao" icon={FileText}>
                    Expedição
                  </MenuLink>

                  <MenuLink to="/romaneio-entrega" icon={Truck}>
                    Romaneio de Entrega
                  </MenuLink>

                  <MenuLink to="/relatorio-pedidos" icon={ClipboardList}>
                    Pedidos
                  </MenuLink>
                </>
              )}

              <MenuLink to="/alertas" icon={Bell}>
                Alertas
              </MenuLink>

              {(isAdmin || isVendedorOperador) && (
                <>
                  <MenuLink to="/relatorio-producao" icon={BarChart3}>
                    Produção
                  </MenuLink>

                  <MenuLink to="/produtividade-operadores" icon={Users}>
                    Produtividade
                  </MenuLink>
                </>
              )}

              {isAdmin && (
                <MenuLink to="/relatorio-auditoria-frete" icon={DollarSign}>
                  Auditoria de Frete
                </MenuLink>
              )}

              <MenuLink to="/relatorio-servicos" icon={ListChecks}>
                Serviços
              </MenuLink>

              <MenuLink to="/relatorio-pendencias" icon={TriangleAlert}>
                Pendências
              </MenuLink>
            </MenuGrupo>
          )}

          {isAdmin && (
            <MenuGrupo titulo="Cadastros">
              <MenuLink to="/clientes" icon={Users}>
                Clientes
              </MenuLink>

              <MenuLink to="/funcionarios" icon={UserCog}>
                Funcionários
              </MenuLink>

              <MenuLink to="/rotas-entrega" icon={MapPinned}>
                Rotas de Entrega
              </MenuLink>

              <MenuLink to="/tipos-servico" icon={Wrench}>
                Tipos de Serviço
              </MenuLink>
            </MenuGrupo>
          )}

          {isAdmin && (
            <MenuGrupo titulo="Sistema">
              <MenuLink to="/configuracao-empresa" icon={Settings}>
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
                flex items-center gap-2
                ${
                  isActive
                    ? "bg-gray-800 text-white font-semibold"
                    : "text-gray-100 hover:text-white hover:bg-gray-800"
                }
                `
              }
            >
              <KeyRound size={17} />
              Alterar Senha
            </NavLink>

            <button
              type="button"
              className="text-left text-sm text-gray-100 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg transition flex items-center gap-2"
              onClick={sair}
            >
              <LogOut size={17} />
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
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-800 transition flex items-center gap-2"
            >
              <Zap size={16} />
              Ações
            </button>

            {menuAberto && (
              <div className="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-lg z-50 overflow-hidden">
                {(isAdmin || isVendedor || isVendedorOperador) && (
                  <>
                    <Link
                      to="/pedidos"
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-sm"
                      onClick={() => setMenuAberto(false)}
                    >
                      <ShoppingCart size={16} />
                      Pedidos
                    </Link>

                    <Link
                      to="/plano-corte-servico"
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-sm"
                      onClick={() => setMenuAberto(false)}
                    >
                      <Scissors size={16} />
                      Planos de Corte
                    </Link>
                  </>
                )}

                {(isAdmin || isOperador || isVendedorOperador) && (
                  <Link
                    to="/kanban"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-sm"
                    onClick={() => setMenuAberto(false)}
                  >
                    <Columns3 size={16} />
                    Kanban
                  </Link>
                )}

                {isAdmin && (
                  <>
                    <Link
                      to="/expedicao"
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-sm"
                      onClick={() => setMenuAberto(false)}
                    >
                      <Truck size={16} />
                      Expedição
                    </Link>

                    <Link
                      to="/romaneio-entrega"
                      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-sm"
                      onClick={() => setMenuAberto(false)}
                    >
                      <Truck size={16} />
                      Romaneio de Entrega
                    </Link>
                  </>
                )}

                <Link
                  to="/alertas"
                  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-sm"
                  onClick={() => setMenuAberto(false)}
                >
                  <Bell size={16} />
                  Alertas
                </Link>

                {(isAdmin || isVendedor || isVendedorOperador) && (
                  <Link
                    to="/relatorio-pedidos"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-sm"
                    onClick={() => setMenuAberto(false)}
                  >
                    <ClipboardList size={16} />
                    Relatório de Pedidos
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  )
}