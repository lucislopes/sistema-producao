import { useContext } from "react"

import {
  Navigate
} from "react-router-dom"

import {
  AuthContext
} from "../contexts/AuthContext"

export function PrivateRoute({ children }) {

  const { autenticado } =
    useContext(AuthContext)

  if (!autenticado) {

    return <Navigate to="/" />
  }

  return children
}