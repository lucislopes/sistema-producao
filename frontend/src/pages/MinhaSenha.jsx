import { useState } from "react"
import { api } from "../services/api"

import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"

export function MinhaSenha() {
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (novaSenha !== confirmacao) {
      return alert("A confirmação da senha não confere.")
    }

    try {
      setSalvando(true)

      await api.patch("/auth/minha-senha", {
        senhaAtual,
        novaSenha
      })

      alert("Senha alterada com sucesso.")

      setSenhaAtual("")
      setNovaSenha("")
      setConfirmacao("")
    } catch (error) {
      console.log(error)

      alert(
        error?.response?.data?.error ||
        "Erro ao alterar senha."
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md"
      >
        <h2 className="text-xl font-bold mb-6">
          Alterar Senha
        </h2>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Senha atual"
            value={senhaAtual}
            onChange={(e) =>
              setSenhaAtual(e.target.value)
            }
          />

          <Input
            type="password"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) =>
              setNovaSenha(e.target.value)
            }
          />

          <Input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmacao}
            onChange={(e) =>
              setConfirmacao(e.target.value)
            }
          />
        </div>

        <div className="mt-6">
          <Button
            type="submit"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : "Alterar Senha"}
          </Button>
        </div>
      </form>
    </div>
  )
}