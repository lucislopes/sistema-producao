import { useEffect, useState } from "react"
import { api } from "../services/api"

export function TiposServico() {
  const [tipos, setTipos] = useState([])
  const [busca, setBusca] = useState("")
  const [nome, setNome] = useState("")
  const [editandoId, setEditandoId] = useState(null)

  async function carregarTipos() {
    try {
      const response = await api.get("/tipos-servico", {
        params: { busca }
      })

      setTipos(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    carregarTipos()
  }, [busca])

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      if (editandoId) {
        await api.put(`/tipos-servico/${editandoId}`, {
          nome
        })
      } else {
        await api.post("/tipos-servico", {
          nome
        })
      }

      limparFormulario()
      carregarTipos()
    } catch (error) {
      console.log(error)
      alert("Erro ao salvar tipo de serviço")
    }
  }

  function editarTipo(tipo) {
    setEditandoId(tipo.id)
    setNome(tipo.nome)
  }

  async function excluirTipo(id) {
    const confirmar = confirm("Deseja excluir este tipo de serviço?")

    if (!confirmar) return

    try {
      await api.delete(`/tipos-servico/${id}`)
      carregarTipos()
    } catch (error) {
      console.log(error)
      alert("Erro ao excluir tipo de serviço")
    }
  }

  function limparFormulario() {
    setNome("")
    setEditandoId(null)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Tipos de Serviço
      </h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar serviço..."
          className="border p-3 rounded-lg w-full"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md mb-8"
      >
        <input
          type="text"
          placeholder="Nome do serviço"
          className="border p-3 rounded-lg w-full"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            {editandoId ? "Atualizar Serviço" : "Salvar Serviço"}
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
              <th className="text-left p-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="border-t">
                <td className="p-4">{tipo.nome}</td>

                <td className="p-4 flex gap-2">
                  <button
                    onClick={() => editarTipo(tipo)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => excluirTipo(tipo.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}

            {tipos.length === 0 && (
              <tr>
                <td className="p-4" colSpan="2">
                  Nenhum tipo de serviço encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}