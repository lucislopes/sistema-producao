import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"

export function RotasEntrega() {
  const [rotas, setRotas] = useState([])
  const [busca, setBusca] = useState("")
  const [nome, setNome] = useState("")
  const [valorFrete, setValorFrete] = useState("")
  const [editandoId, setEditandoId] = useState(null)

  async function carregarRotas() {
    try {
      const response = await api.get("/rotas-entrega", {
        params: { busca }
      })

      setRotas(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    carregarRotas()
  }, [busca])

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      if (editandoId) {
        await api.put(`/rotas-entrega/${editandoId}`, {
          nome,
          valorFrete
        })
      } else {
        await api.post("/rotas-entrega", {
          nome,
          valorFrete
        })
      }

      limparFormulario()
      carregarRotas()
    } catch (error) {
      console.log(error)
      alert("Erro ao salvar rota")
    }
  }

  function editarRota(rota) {
    setEditandoId(rota.id)
    setNome(rota.nome)
    setValorFrete(rota.valorFrete)
  }

  async function excluirRota(id) {
    const confirmar = confirm("Deseja excluir esta rota?")

    if (!confirmar) return

    try {
      await api.delete(`/rotas-entrega/${id}`)
      carregarRotas()
    } catch (error) {
      console.log(error)
      alert("Erro ao excluir rota")
    }
  }

  function limparFormulario() {
    setNome("")
    setValorFrete("")
    setEditandoId(null)
  }

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar rota..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md mb-8"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="Nome da rota"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <Input
            type="number"
            step="0.01"
            placeholder="Valor do frete"
            value={valorFrete}
            onChange={(e) => setValorFrete(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            type="submit"
          >
            {editandoId ? "Atualizar Rota" : "Salvar Rota"}
          </Button>

          {editandoId && (
            <Button
              type="Button"
              onClick={limparFormulario}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th >Nome</Th>
              <Th >Valor Frete</Th>
              <Th >Ações</Th>
            </tr>
          </thead>

          <tbody>
            {rotas.map((rota) => (
              <tr key={rota.id} className="border-t">
                <td className="p-4">{rota.nome}</td>

                <td className="p-4">
                  R$ {Number(rota.valorFrete).toFixed(2)}
                </td>

                <td className="p-4 flex gap-2">
                  <Button
                    onClick={() => editarRota(rota)}
                  >
                    Editar
                  </Button>

                  <Button
                    onClick={() => excluirRota(rota.id)}
                  >
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}

            {rotas.length === 0 && (
              <tr>
                <td className="p-4" colSpan="3">
                  Nenhuma rota encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}