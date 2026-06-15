import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"
import { ConfirmModal } from "../components/ui/ConfirmModal"
import { IMaskInput } from "react-imask"
import {
  Search,
  Save,
  X,
  Pencil,
  Trash2,
  Users
} from "lucide-react"

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
      const payload = {
        nome,
        documento,
        telefone,
        endereco
      }

      if (editandoId) {
        await api.put(`/clientes/${editandoId}`, payload)
      } else {
        await api.post("/clientes", payload)
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

    window.scrollTo({ top: 0, behavior: "smooth" })
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
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users size={22} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Clientes
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre, edite e consulte os clientes do sistema.
            </p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
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
            {editandoId ? "Editar cliente" : "Novo cliente"}
          </h2>
          <p className="text-sm text-gray-500">
            Preencha os dados principais do cliente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Input
            type="text"
            placeholder="Nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <IMaskInput
            mask={[
              { mask: "000.000.000-00" },
              { mask: "00.000.000/0000-00" }
            ]}
            value={documento}
            onAccept={(value) => setDocumento(value)}
            placeholder="CPF/CNPJ"
            className="h-11 border border-gray-300 px-3 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <IMaskInput
            mask="(00) 00000-0000"
            value={telefone}
            onAccept={(value) => setTelefone(value)}
            placeholder="Telefone"
            className="h-11 border border-gray-300 px-3 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <Input
            type="text"
            placeholder="Endereço"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" className="flex items-center gap-2">
            <Save size={16} />
            {editandoId ? "Atualizar" : "Salvar"}
          </Button>

          {editandoId && (
            <Button
              type="button"
              onClick={limparFormulario}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700"
            >
              <X size={16} />
              Cancelar
            </Button>
          )}
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Lista de clientes
            </h2>
            <p className="text-sm text-gray-500">
              {clientes.length} cliente(s) encontrado(s).
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
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
                <tr key={cliente.id} className="border-t hover:bg-gray-50">
                  <Td>
                    <span className="font-medium text-gray-900">
                      {cliente.nome}
                    </span>
                  </Td>

                  <Td>{cliente.documento || "-"}</Td>
                  <Td>{cliente.telefone || "-"}</Td>
                  <Td>{cliente.endereco || "-"}</Td>

                  <Td>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => editarCliente(cliente)}
                        className="h-9 px-3 flex items-center gap-1"
                      >
                        <Pencil size={15} />
                        Editar
                      </Button>

                      <Button
                        type="button"
                        onClick={() => abrirModalExcluir(cliente)}
                        className="h-9 px-3 flex items-center gap-1 bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 size={15} />
                        Excluir
                      </Button>
                    </div >
                  </Td>
                </tr>
              ))}

              {clientes.length === 0 && (
                <tr>
                  <td
                    className="p-6 text-center text-gray-500"
                    colSpan="5"
                  >
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          </div>
        </div>
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