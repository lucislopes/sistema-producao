import {
  createContext,
  useEffect,
  useState
} from "react"

import { api } from "../services/api"

export const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const user = localStorage.getItem("@usuario")
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  })
  const [carregandoSessao, setCarregandoSessao] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("@token")
    if (!token) {
      setCarregandoSessao(false)
      return
    }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`

    api.get("/auth/me")
      .then((response) => {
        const usuarioAtual = response.data.usuario
        localStorage.setItem("@usuario", JSON.stringify(usuarioAtual))
        setUsuario(usuarioAtual)
      })
      .catch(() => {
        localStorage.removeItem("@token")
        localStorage.removeItem("@usuario")
        delete api.defaults.headers.common["Authorization"]
        setUsuario(null)
      })
      .finally(() => setCarregandoSessao(false))
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
    setCarregandoSessao(false)
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
        autenticado: !!usuario,
        carregandoSessao
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
