import { useEffect, useState } from "react"
import { api } from "../services/api"

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
      <h1 className="text-3xl font-bold mb-6">
        Rotas de Entrega
      </h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar rota..."
          className="border p-3 rounded-lg w-full"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md mb-8"
      >
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nome da rota"
            className="border p-3 rounded-lg"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            type="number"
            step="0.01"
            placeholder="Valor do frete"
            className="border p-3 rounded-lg"
            value={valorFrete}
            onChange={(e) => setValorFrete(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            {editandoId ? "Atualizar Rota" : "Salvar Rota"}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={limparFormulario}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-left p-4">Nome</th>
              <th className="text-left p-4">Valor Frete</th>
              <th className="text-left p-4">Ações</th>
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
                  <button
                    onClick={() => editarRota(rota)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => excluirRota(rota.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Excluir
                  </button>
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
        </table>
      </div>
    </div>
  )
}