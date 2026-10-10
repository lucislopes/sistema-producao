import { useContext } from "react"

import {
  Navigate, useLocation
} from "react-router-dom"

import {
  AuthContext
} from "../contexts/AuthContext"

export function PrivateRoute({ children, roles, sitePermission }) {
  const location=useLocation()

  const { autenticado, carregandoSessao, usuario } =
    useContext(AuthContext)

  if (carregandoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Validando sessão...
      </div>
    )
  }

  if (!autenticado) {

    return <Navigate to={location.pathname.startsWith("/empresa")?"/empresa/login":"/"} />
  }

  const inicio='/empresa'
  if(usuario?.somenteSite && !location.pathname.startsWith('/empresa') && !location.pathname.startsWith('/site/') && location.pathname!=='/minha-senha') return <Navigate to={inicio} replace />
  if(sitePermission && usuario?.funcao!=='ADMIN' && !usuario?.permissoesSite?.includes(sitePermission))return <p className="p-6">Sem permissão para esta área.</p>
  if (roles && !roles.includes(usuario?.funcao)) return usuario?.somenteSite?<p className="p-6">Sem permissão para esta área.</p>:<Navigate to="/dashboard" replace />
  return children
}
