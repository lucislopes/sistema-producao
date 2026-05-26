import { createContext, useContext, useEffect, useState } from "react"
import { registrarLoading } from "../services/loadingService"

const LoadingContext = createContext({})

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    registrarLoading(setLoading)
  }, [])

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}

      {loading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-blue-600 animate-pulse" />
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  return useContext(LoadingContext)
}