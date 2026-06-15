import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"
import {
  Wrench,
  Save,
  X,
  Pencil,
  Trash2
} from "lucide-react"

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

    if (!nome.trim()) {
      alert("Informe o nome do serviço")
      return
    }

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

    window.scrollTo({ top: 0, behavior: "smooth" })
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
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wrench size={22} className="text-blue-600" />

              <h1 className="text-2xl font-bold text-gray-900">
                Tipos de Serviço
              </h1>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              Cadastre e gerencie os serviços usados nos planos de produção.
            </p>
          </div>

          <div className="w-full lg:w-80">
            <Input
              type="text"
              placeholder="Buscar serviço..."
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
            {editandoId ? "Editar serviço" : "Novo serviço"}
          </h2>

          <p className="text-sm text-gray-500">
            Informe o nome do tipo de serviço.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="Nome do serviço"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
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
            Lista de serviços
          </h2>

          <p className="text-sm text-gray-500">
            {tipos.length} serviço(s) encontrado(s).
          </p>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <Table>
              <thead>
                <tr>
                  <Th>Nome</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>

              <tbody>
                {tipos.map((tipo) => (
                  <tr
                    key={tipo.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <Td>
                      <span className="font-medium text-gray-900">
                        {tipo.nome}
                      </span>
                    </Td>

                    <Td>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="warning"
                          onClick={() => editarTipo(tipo)}
                          className="h-9 px-3 flex items-center gap-1"
                        >
                          <Pencil size={15} />
                          Editar
                        </Button>

                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => excluirTipo(tipo.id)}
                          className="h-9 px-3 flex items-center gap-1"
                        >
                          <Trash2 size={15} />
                          Excluir
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}

                {tipos.length === 0 && (
                  <tr>
                    <td
                      className="p-6 text-center text-gray-500"
                      colSpan="2"
                    >
                      Nenhum tipo de serviço encontrado.
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