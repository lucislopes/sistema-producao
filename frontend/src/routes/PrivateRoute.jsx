import { useContext } from "react"

import {
  Navigate
} from "react-router-dom"

import {
  AuthContext
} from "../contexts/AuthContext"

export function PrivateRoute({ children }) {

  const { autenticado, carregandoSessao } =
    useContext(AuthContext)

  if (carregandoSessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Validando sessão...
      </div>
    )
  }

  if (!autenticado) {

    return <Navigate to="/" />
  }

  return children
}
