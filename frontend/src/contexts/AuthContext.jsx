import {
  createContext,
  useEffect,
  useState
} from "react"

import { api } from "../services/api"

export const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("@token")
    const user = localStorage.getItem("@usuario")

    if (token && user) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUsuario(JSON.parse(user))
    }
  }, [])

  async function login(email, senha) {
    const response = await api.post("/auth/login", {
      email,
      senha
    })

    const { token, usuario } = response.data

    localStorage.setItem("@token", token)
    localStorage.setItem("@usuario", JSON.stringify(usuario))

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`

    setUsuario(usuario)
  }

  function logout() {
    localStorage.removeItem("@token")
    localStorage.removeItem("@usuario")

    delete api.defaults.headers.common["Authorization"]

    setUsuario(null)
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        autenticado: !!usuario
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}