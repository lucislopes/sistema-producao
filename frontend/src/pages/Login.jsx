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
  const [erro, setErro] = useState("")
  const [entrando, setEntrando] = useState(false)

  async function handleLogin(e) {

    e.preventDefault()
    setErro("")
    setEntrando(true)

    try {

      await login(email, senha)
      navigate("/dashboard")

    } catch (error) {
      console.log(error)
      setErro(error.response?.data?.error || "Não foi possível realizar o login")
    } finally {
      setEntrando(false)
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
            aria-label="Email"
            autoComplete="username"
            required
            aria-invalid={Boolean(erro)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Senha"
            aria-label="Senha"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(erro)}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {erro}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            loading={entrando}
          >
            {entrando ? "Entrando..." : "Entrar"}
          </Button>
        </div>

        <a href="/acompanhar" className="mt-6 block text-center text-sm font-medium text-emerald-700 underline">Sou cliente: acompanhar meu pedido</a>
      </form>

    </div>
  )
}
