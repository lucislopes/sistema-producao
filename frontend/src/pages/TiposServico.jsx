import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"

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
    e.prevenTdefault()

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
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar serviço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md mb-8"
      >
        <Input
          type="text"
          placeholder="Nome do serviço"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <div className="mt-4 flex gap-2">
          <Button
            type="submit"
          >
            {editandoId ? "Atualizar Serviço" : "Salvar Serviço"}
          </Button>

          {editandoId && (
            <Button variant="danger"
              type="button"
              onClick={limparFormulario}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <Table >
          <thead >
            <tr>
              <Th>Nome</Th>
              <Th>Ações</Th>
            </tr>
          </thead>

          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo.id} className="border-t">
                <Td>{tipo.nome}</Td>

                <Td >
                  <Button variant="warning"
                    onClick={() => editarTipo(tipo)}
                  >
                    Editar
                  </Button>

                  <Button variant="danger"
                    onClick={() => excluirTipo(tipo.id)}
                  >
                    Excluir
                  </Button>
                </Td>
              </tr>
            ))}

            {tipos.length === 0 && (
              <tr>
                <Td>
                  Nenhum tipo de serviço encontrado.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}