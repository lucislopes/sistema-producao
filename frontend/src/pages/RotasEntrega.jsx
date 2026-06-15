import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"
import {
  MapPinned,
  Save,
  X,
  Pencil,
  Trash2
} from "lucide-react"

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

    window.scrollTo({ top: 0, behavior: "smooth" })
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
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MapPinned size={22} className="text-blue-600" />

              <h1 className="text-2xl font-bold text-gray-900">
                Rotas de Entrega
              </h1>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              Cadastre e gerencie as rotas e valores de frete.
            </p>
          </div>

          <div className="w-full lg:w-80">
            <Input
              type="text"
              placeholder="Buscar rota..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5"
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {editandoId ? "Editar rota" : "Nova rota"}
          </h2>

          <p className="text-sm text-gray-500">
            Informe os dados da rota e o valor do frete.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="submit"
            className="h-11 px-6 flex items-center gap-2"
          >
            <Save size={16} />
            {editandoId ? "Atualizar" : "Salvar"}
          </Button>

          {editandoId && (
            <Button
              type="button"
              onClick={limparFormulario}
              className="h-11 px-6 bg-gray-600 hover:bg-gray-700 flex items-center gap-2"
            >
              <X size={16} />
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Lista de rotas
          </h2>

          <p className="text-sm text-gray-500">
            {rotas.length} rota(s) encontrada(s).
          </p>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <Table>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Valor Frete</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {rotas.map((rota) => (
                  <tr
                    key={rota.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <Td>
                      <span className="font-medium text-gray-900">
                        {rota.nome}
                      </span>
                    </Td>

                    <Td>
                      <span className="font-medium text-green-700">
                        R$ {Number(rota.valorFrete).toFixed(2)}
                      </span>
                    </Td>

                    <Td>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => editarRota(rota)}
                          className="h-9 px-3 flex items-center gap-1"
                        >
                          <Pencil size={15} />
                          Editar
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => excluirRota(rota.id)}
                          className="h-9 px-3 flex items-center gap-1"
                        >
                          <Trash2 size={15} />
                          Excluir
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}

                {rotas.length === 0 && (
                  <tr>
                    <td
                      className="p-6 text-center text-gray-500"
                      colSpan="3"
                    >
                      Nenhuma rota encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}