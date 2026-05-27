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
      alert("Erro ao logar")
    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm"
      >

        <h1 className="text-2xl font-bold mb-6 text-center">
          Sistema Produção
        </h1>

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
          className="w-full bg-blue-600 text-white p-3 rounded-lg"
        >
          Entrar
        </Button>

      </form>

    </div>
  )
}