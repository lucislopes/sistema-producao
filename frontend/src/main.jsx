import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import App from "./App"

import { LoadingProvider } from "./contexts/LoadingContext"
import { AuthProvider } from "./contexts/AuthContext"
import { NotificationProvider } from "./contexts/NotificationContext"

import "./index.css"
import "./App.css"

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>
)
