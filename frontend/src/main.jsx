import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import App from "./App"

import { LoadingProvider } from "./contexts/LoadingContext"
import { AuthProvider } from "./contexts/AuthContext"

import "./index.css"
import "./App.css"

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <AuthProvider>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </AuthProvider>
  </StrictMode>
)