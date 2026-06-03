import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"
import { ConfirmModal } from "../components/ui/ConfirmModal"
import { IMaskInput } from "react-imask"

export function Clientes() {
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState("")

  const [nome, setNome] = useState("")
  const [documento, setDocumento] = useState("")
  const [telefone, setTelefone] = useState("")
  const [endereco, setEndereco] = useState("")
  const [editandoId, setEditandoId] = useState(null)

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null)

  async function carregarClientes() {
    try {
      const response = await api.get("/clientes", {
        params: { busca }
      })

      setClientes(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    carregarClientes()
  }, [busca])

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      if (editandoId) {
        await api.put(`/clientes/${editandoId}`, {
          nome,
          documento,
          telefone,
          endereco
        })
      } else {
        await api.post("/clientes", {
          nome,
          documento,
          telefone,
          endereco
        })
      }

      limparFormulario()
      carregarClientes()
    } catch (error) {
      console.log(error)
      alert("Erro ao salvar cliente")
    }
  }

  function editarCliente(cliente) {
    setEditandoId(cliente.id)
    setNome(cliente.nome)
    setDocumento(cliente.documento || "")
    setTelefone(cliente.telefone || "")
    setEndereco(cliente.endereco || "")
  }

  function abrirModalExcluir(cliente) {
    setClienteParaExcluir(cliente)
    setModalExcluirAberto(true)
  }

  async function deletarCliente() {
    if (!clienteParaExcluir) return

    try {
      await api.delete(`/clientes/${clienteParaExcluir.id}`)

      setModalExcluirAberto(false)
      setClienteParaExcluir(null)

      carregarClientes()
    } catch (error) {
      console.log(error)
      alert("Erro ao excluir cliente")
    }
  }

  function cancelarExclusao() {
    setModalExcluirAberto(false)
    setClienteParaExcluir(null)
  }

  function limparFormulario() {
    setNome("")
    setDocumento("")
    setTelefone("")
    setEndereco("")
    setEditandoId(null)
  }

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar cliente..."
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
            placeholder="Nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <IMaskInput
            mask={[
              {
                mask: "000.000.000-00"
              },
              {
                mask: "00.000.000/0000-00"
              }
            ]}
            value={documento}
            onAccept={(value) => setDocumento(value)}
            placeholder="CPF/CNPJ"
            className="border p-3 rounded-lg w-full"
          />

          <IMaskInput
            mask="(00) 00000-0000"
            value={telefone}
            onAccept={(value) => setTelefone(value)}
            placeholder="(00) 00000-0000"
            className="border p-3 rounded-lg w-full"
          />

          <Input
            type="text"
            placeholder="Endereço"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="submit">
            {editandoId ? "Atualizar Cliente" : "Salvar Cliente"}
          </Button>

          {editandoId && (
            <Button
              type="button"
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
              <Th>Nome</Th>
              <Th>Documento</Th>
              <Th>Telefone</Th>
              <Th>Endereço</Th>
              <Th>Ações</Th>
            </tr>
          </thead>

          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-t">
                <Td>{cliente.nome}</Td>
                <Td>{cliente.documento || "-"}</Td>
                <Td>{cliente.telefone || "-"}</Td>
                <Td>{cliente.endereco || "-"}</Td>

                <Td>
                  <div className="flex gap-2">
                    <Button onClick={() => editarCliente(cliente)}>
                      Editar
                    </Button>

                    <Button onClick={() => abrirModalExcluir(cliente)}>
                      Excluir
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}

            {clientes.length === 0 && (
              <tr>
                <td className="p-4" colSpan="5">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <ConfirmModal
        open={modalExcluirAberto}
        title="Excluir cliente"
        message={`Deseja excluir o cliente "${clienteParaExcluir?.nome}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={deletarCliente}
        onCancel={cancelarExclusao}
      />
    </div>
  )
}