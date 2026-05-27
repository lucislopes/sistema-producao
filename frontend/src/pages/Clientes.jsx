import {
  useEffect,
  useState
} from "react"

import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"
import { Modal } from "../components/ui/Modal"
import { ConfirmModal } from "../components/ui/ConfirmModal"


export function Clientes() {

  const [clientes, setClientes] = useState([])

  const [nome, setNome] = useState("")
  const [documento, setDocumento] = useState("")
  const [telefone, setTelefone] = useState("")
  const [endereco, setEndereco] = useState("")
  const [editandoId, setEditandoId] = useState(null)

  const [busca, setBusca] = useState("")
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null)

  async function carregarClientes() {

    try {

      const response = await api.get("/clientes", {
        params: {
            busca}
        }
       )
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

        await api.put(
            `/clientes/${editandoId}`,
            {
            nome,
            documento,
            telefone,
            endereco
            }
        )

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

        alert("Erro")
    }
    }

    function editarCliente(cliente) {

      setEditandoId(cliente.id)

      setNome(cliente.nome)
      setDocumento(cliente.documento)
      setTelefone(cliente.telefone)
      setEndereco(cliente.endereco)
      }

      function limparFormulario() {
        setNome("")
        setDocumento("")
        setTelefone("")
        setEndereco("")

        setEditandoId(null)
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
            alert("Erro ao excluir")
          }
        }
  return (

    <div>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-2xl shadow-md mb-8"
      >
        <div className="grid grid-cols-2 gap-4">

          <Input
            type="text"
            placeholder="Nome"
            required
            value={nome}
            onChange={(e) =>
              setNome(e.target.value)
            }
          />

          <Input
            type="text"
            placeholder="CPF/CNPJ"
            value={documento}
            onChange={(e) =>
              setDocumento(e.target.value)
            }
          />

          <Input
            type="text"
            placeholder="Telefone"
            value={telefone}
            onChange={(e) =>
              setTelefone(e.target.value)
            }
          />

          <Input
            type="text"
            placeholder="Endereço"
            value={endereco}
            onChange={(e) =>
              setEndereco(e.target.value)
            }
          />

        </div>

        <Button
          type="submit"
        >
          Salvar Cliente
        </Button>

      </form>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="my-2">
        <Input
            type="text"
            placeholder="Buscar cliente..."

            value={busca}

            onChange={(e) =>
            setBusca(e.target.value)
            }
        />

        </div>

        <Table>

          <thead>

            <tr>

              <Th>
                Nome
              </Th>

              <Th>
                Documento
              </Th>

              <Th>
                Telefone
              </Th>

              <Th>
                Ações
              </Th>

            </tr>

          </thead>

          <tbody>

            {clientes.map((cliente) => (

              <tr
                key={cliente.id}
                className="border-t"
              >

                <td className="px-4 py-2">
                  <div className="flex gap-2">
                  {cliente.nome}
                  </div>
                </td>

                <td className="px-4 py-2">
                  <div className="flex gap-2">
                  {cliente.documento}
                  </div>
                </td>

                <td className="px-4 py-2">
                  <div className="flex gap-2">
                  {cliente.telefone}
                  </div>
                </td>

                <td className="px-4 py-2">
                   <div className="flex gap-2">

                    <Button variant="warning"
                    onClick={() => editarCliente(cliente)}
                    >
                    Editar
                    </Button>

                  <Button
                    variant="danger"
                    onClick={() => {
                      setClienteParaExcluir(cliente)
                      setModalExcluirAberto(true)
                    }}
                  >
                    Excluir
                  </Button>
                  </div>

                </td>

              </tr>

            ))}

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
          onCancel={() => {
            setModalExcluirAberto(false)
            setClienteParaExcluir(null)
          }}
        />


    </div>
  
  )
}