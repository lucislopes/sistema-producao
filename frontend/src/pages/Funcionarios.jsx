import {
  useEffect,
  useState
} from "react"

import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"

export function Funcionarios() {

  const [funcionarios, setFuncionarios] = useState([])
  const [busca, setBusca] = useState("")
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [funcao, setFuncao] = useState("OPERADOR")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
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
    e.prevenTdefault()

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
    setEditandoId(null)
  }

  return (

    <div className="max-w-7xl mx-auto">

      <h1 className="text-3xl font-bold mb-6">
        Funcionários
      </h1>

      <div className="mb-4">

        <Input
          type="text"
          placeholder="Buscar..."
          value={busca}

          onChange={(e) =>
            setBusca(e.target.value)
          }
        />

      </div>

      <form
        onSubmit={handleSubmit}
        //className="bg-white p-6 rounded-2xl shadow-md mb-8"
        className="bg-white p-4 rounded-2xl shadow-sm border mb-6"
      >

        <div 
          //className="grid grid-cols-2 gap-4">
          className="grid grid-cols-2 gap-3">

          <Input
            type="text"
            placeholder="Nome"
            value={nome}

            onChange={(e) =>
              setNome(e.target.value)
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

          <Select
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

            <option value="VENDEDOR_OPERADOR">
              Vendedor / Operador
            </option>

            <option value="ADMIN">
              Admin
            </option>

          </Select>

          <Input
            type="email"
            placeholder="Email"
            value={email}

            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <Input
            type="password"
            placeholder="Senha"
            value={senha}

            onChange={(e) =>
              setSenha(e.target.value)
            }
          />

        </div>
        <div className="mt-4 flex gap-2"></div>
        <Button
        type="submit"
        >
        {editandoId
            ? "Atualizar Funcionário"
            : "Salvar Funcionário"}
        </Button>

      </form>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>
                Nome
              </Th>
              <Th>

                Função
              </Th>

              <Th>
                Email
              </Th>

              <Th>
                Ativo
              </Th>

              <Th>
                Ações
              </Th>

            </tr>

          </thead>

          <tbody>

            {funcionarios.map((funcionario) => (

              <tr
                key={funcionario.id}
                className="border-t"
              >

                <Td className="px-4 py-2">
                  <div className="flex gap-2">
                  {funcionario.nome}
                  </div>
                </Td>

                <Td className="px-4 py-2">
                  <div className="flex gap-2">
                  {funcionario.funcao}
                  </div>
                </Td>

                <Td className="px-4 py-2">
                  <div className="flex gap-2">
                  {funcionario.usuario?.email}
                  </div>
                </Td>

                <Td className="px-4 py-2">
                  <div className="flex gap-2">
                  {funcionario.ativo
                    ? "Sim"
                    : "Não"}
                    </div>
                </Td>
                <Td className="px-4 py-2">
                  <div className="flex gap-2">
                <Button variant="warning"
                    onClick={() => editarFuncionario(funcionario)}
                    className="bg-yellow-500 text-white px-3 h-8 rounded-lg text-sm"
                >
                    Editar
                </Button>

                <Button
                  variant={
                    funcionario.ativo
                      ? "danger"
                      : "success"
                  }
                  onClick={() => toggleAtivo(funcionario)}
                  className="h-8 text-sm px-3"
                >
                  {funcionario.ativo
                    ? "Desativar"
                    : "Ativar"}
                </Button>
                </div>
                </Td>

              </tr>

            ))}

          </tbody>

        </Table>

      </div>

    </div>
  )
}