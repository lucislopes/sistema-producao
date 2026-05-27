import axios from "axios"
import {
  iniciarLoading,
  finalizarLoading
} from "./loadingService"

export const api = axios.create({
  baseURL: "http://localhost:3333"
  //baseURL: import.meta.env.VITE_API_URL
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
    console.log("ERRO API:", error)

    //
    // SEM RESPOSTA
    //

    if (!error.response) {
      alert("Servidor não respondeu.")
      return Promise.reject(error)
    }

    const status = error.response.status

    //
    // 401
    //

    if (status === 401) {
      localStorage.removeItem("@token")

      alert("Sessão expirada. Faça login novamente.")

      window.location.href = "/login"

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