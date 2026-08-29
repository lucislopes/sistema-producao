import axios from "axios"
import {
  iniciarLoading,
  finalizarLoading
} from "./loadingService"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api"
})

//
// REQUEST
//

api.interceptors.request.use((config) => {
  iniciarLoading()
  const token = localStorage.getItem("@token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

//
// RESPONSE
//

api.interceptors.response.use(
  (response) => {
    finalizarLoading()
    return response
  },

  (error) => {
    finalizarLoading()
    console.log("ERRO API:", error)

    //
    // SEM RESPOSTA
    //

    const requisicaoDeLogin = error.config?.url?.includes("/auth/login")
    const validacaoDeSessao = error.config?.url?.includes("/auth/me")

    if (!error.response) {
      if (validacaoDeSessao) {
        return Promise.reject(error)
      }

      alert("Servidor não respondeu.")
      return Promise.reject(error)
    }

    const status = error.response.status

    //
    // 401
    //

    if (status === 401 && !requisicaoDeLogin && !validacaoDeSessao) {
      localStorage.removeItem("@token")
      localStorage.removeItem("@usuario")

      alert("Sessão expirada. Faça login novamente.")

      window.location.href = "/"

      return Promise.reject(error)
    }

    if (status === 429 && !requisicaoDeLogin) {
      alert(error.response?.data?.error || "Muitas solicitações. Tente novamente mais tarde.")
      return Promise.reject(error)
    }

    //
    // 403
    //

    if (status === 403) {
      alert("Você não possui permissão para acessar esta área.")

      return Promise.reject(error)
    }

    //
    // 404
    //

    if (status === 404) {
      alert("Recurso não encontrado.")

      return Promise.reject(error)
    }

    //
    // 500
    //

    if (status >= 500) {
      alert("Erro interno do servidor.")

      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)
