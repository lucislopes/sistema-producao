import { useContext, useState } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export function Login() {

  const { login } = useContext(AuthContext)
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")

  async function handleLogin(e) {

    e.preventDefault()

    try {

      await login(email, senha)
      alert("Login realizado")
      navigate("/dashboard")

    } catch (error) {
      console.log(error)
      alert(error.response?.data?.error || "Não foi possível realizar o login")
    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm"
      >

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Sistema Produção
          </h1>

          <p className="text-gray-500 mt-2">
            Gestão de Pedidos e Produção
          </p>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <Button
            type="submit"
            className="w-full"
          >
            Entrar
          </Button>
        </div>

      </form>

    </div>
  )
}
