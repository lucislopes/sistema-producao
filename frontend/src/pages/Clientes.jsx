import {
  useEffect,
  useState
} from "react"

import { api } from "../services/api"

export function Clientes() {

  const [clientes, setClientes] = useState([])

  const [nome, setNome] = useState("")
  const [documento, setDocumento] = useState("")
  const [telefone, setTelefone] = useState("")
  const [endereco, setEndereco] = useState("")
  const [editandoId, setEditandoId] = useState(null)

  const [busca, setBusca] = useState("")

  async function carregarClientes() {

    try {

      const response = await api.get("/clientes", {
        param:{
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

  async function deletarCliente(id) {

    const confirmar =
      confirm("Deseja excluir?")

    if (!confirmar) return

    try {

      await api.delete(`/clientes/${id}`)

      carregarClientes()

    } catch (error) {

      console.log(error)

      alert("Erro ao excluir")
    }
  }

  return (

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Clientes
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md mb-8"
      >

        <div className="grid grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Nome"
            className="border p-3 rounded-lg"
            value={nome}
            onChange={(e) =>
              setNome(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="CPF/CNPJ"
            className="border p-3 rounded-lg"
            value={documento}
            onChange={(e) =>
              setDocumento(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Telefone"
            className="border p-3 rounded-lg"
            value={telefone}
            onChange={(e) =>
              setTelefone(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Endereço"
            className="border p-3 rounded-lg"
            value={endereco}
            onChange={(e) =>
              setEndereco(e.target.value)
            }
          />

        </div>

        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Salvar Cliente
        </button>

      </form>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="my-2">
        <input
            type="text"
            placeholder="Buscar cliente..."
            className="border p-3 rounded-lg w-full"

            value={busca}

            onChange={(e) =>
            setBusca(e.target.value)
            }
        />

        </div>

        <table className="w-full">

          <thead className="bg-gray-200">

            <tr>

              <th className="text-left p-4">
                Nome
              </th>

              <th className="text-left p-4">
                Documento
              </th>

              <th className="text-left p-4">
                Telefone
              </th>

              <th className="text-left p-4">
                Ações
              </th>

            </tr>

          </thead>

          <tbody>

            {clientes.map((cliente) => (

              <tr
                key={cliente.id}
                className="border-t"
              >

                <td className="p-4">
                  {cliente.nome}
                </td>

                <td className="p-4">
                  {cliente.documento}
                </td>

                <td className="p-4">
                  {cliente.telefone}
                </td>

                <td className="p-4">

                    <button
                    onClick={() => editarCliente(cliente)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg mr-2"
                    >
                    Editar
                    </button>

                  <button
                    onClick={() =>
                      deletarCliente(cliente.id)
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Excluir
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}