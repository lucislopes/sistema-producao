import {
  useEffect,
  useState
} from "react"

import { api } from "../services/api"

export function Funcionarios() {

  const [funcionarios, setFuncionarios] =
    useState([])

  const [busca, setBusca] =
    useState("")

  const [nome, setNome] =
    useState("")

  const [telefone, setTelefone] =
    useState("")

  const [funcao, setFuncao] =
    useState("OPERADOR")

  const [email, setEmail] =
    useState("")

  const [senha, setSenha] =
    useState("")

  const [editandoId, setEditandoId] = useState(null)

    async function toggleAtivo(funcionario) {
    await api.put(`/funcionarios/${funcionario.id}`, {
        nome: funcionario.nome,
        telefone: funcionario.telefone,
        funcao: funcionario.funcao,
        ativo: !funcionario.ativo
    })

    carregarFuncionarios()
    }

  async function carregarFuncionarios() {

    try {

      const response =
        await api.get("/funcionarios", {
          params: {
            busca
          }
        })

      setFuncionarios(response.data)

    } catch (error) {

      console.log(error)
    }
  }

  function editarFuncionario(funcionario) {
    setEditandoId(funcionario.id)
    setNome(funcionario.nome)
    setTelefone(funcionario.telefone || "")
    setFuncao(funcionario.funcao)
    setEmail(funcionario.usuario?.email || "")
    setSenha("")
    }

  useEffect(() => {

    carregarFuncionarios()

  }, [busca])

  async function handleSubmit(e) {
    e.preventDefault()

    if (editandoId) {
        await api.put(`/funcionarios/${editandoId}`, {
        nome,
        telefone,
        funcao,
        ativo: true
        })
    } else {
        await api.post("/funcionarios", {
        nome,
        telefone,
        funcao,
        email,
        senha
        })
    }

    limparFormulario()
    carregarFuncionarios()
    }

  function limparFormulario() {

    setNome("")
    setTelefone("")
    setFuncao("OPERADOR")
    setEmail("")
    setSenha("")
    setEditando(null)
  }

  return (

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Funcionários
      </h1>

      <div className="mb-4">

        <input
          type="text"
          placeholder="Buscar..."
          className="border p-3 rounded-lg w-full"

          value={busca}

          onChange={(e) =>
            setBusca(e.target.value)
          }
        />

      </div>

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
            placeholder="Telefone"
            className="border p-3 rounded-lg"

            value={telefone}

            onChange={(e) =>
              setTelefone(e.target.value)
            }
          />

          <select
            className="border p-3 rounded-lg"

            value={funcao}

            onChange={(e) =>
              setFuncao(e.target.value)
            }
          >

            <option value="OPERADOR">
              Operador
            </option>

            <option value="VENDEDOR">
              Vendedor
            </option>

            <option value="ADMIN">
              Admin
            </option>

          </select>

          <input
            type="email"
            placeholder="Email"
            className="border p-3 rounded-lg"

            value={email}

            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Senha"
            className="border p-3 rounded-lg"

            value={senha}

            onChange={(e) =>
              setSenha(e.target.value)
            }
          />

        </div>

        <button
        type="submit"
        className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
        {editandoId
            ? "Atualizar Funcionário"
            : "Salvar Funcionário"}
        </button>

      </form>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-200">

            <tr>

              <th className="text-left p-4">
                Nome
              </th>

              <th className="text-left p-4">
                Função
              </th>

              <th className="text-left p-4">
                Email
              </th>

              <th className="text-left p-4">
                Ativo
              </th>

              <th className="text-left p-4">Ações</th>

            </tr>

          </thead>

          <tbody>

            {funcionarios.map((funcionario) => (

              <tr
                key={funcionario.id}
                className="border-t"
              >

                <td className="p-4">
                  {funcionario.nome}
                </td>

                <td className="p-4">
                  {funcionario.funcao}
                </td>

                <td className="p-4">
                  {funcionario.usuario?.email}
                </td>

                <td className="p-4">
                  {funcionario.ativo
                    ? "Sim"
                    : "Não"}
                </td>
                <td className="p-4 flex gap-2">
                <button
                    onClick={() => editarFuncionario(funcionario)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                >
                    Editar
                </button>

                <button
                    onClick={() => toggleAtivo(funcionario)}
                    className={`text-white px-4 py-2 rounded-lg ${
                    funcionario.ativo ? "bg-red-500" : "bg-green-600"
                    }`}
                >
                    {funcionario.ativo ? "Desativar" : "Ativar"}
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