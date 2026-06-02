import { useEffect, useState } from "react"
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

  async function carregarFuncionarios() {
    try {
      const response = await api.get("/funcionarios", {
        params: { busca }
      })

      setFuncionarios(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    carregarFuncionarios()
  }, [busca])

  async function handleSubmit(e) {
    e.preventDefault()

    try {
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
    } catch (error) {
      console.log(error)
      alert("Erro ao salvar funcionário")
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

  async function toggleAtivo(funcionario) {
    try {
      await api.put(`/funcionarios/${funcionario.id}`, {
        nome: funcionario.nome,
        telefone: funcionario.telefone,
        funcao: funcionario.funcao,
        ativo: !funcionario.ativo
      })

      carregarFuncionarios()
    } catch (error) {
      console.log(error)
      alert("Erro ao alterar status do funcionário")
    }
  }

    async function redefinirSenha(funcionario) {
    const novaSenha = prompt(
      `Nova senha para ${funcionario.nome}`
    )

    if (!novaSenha) return

    try {
      await api.patch(
        `/funcionarios/${funcionario.id}/senha`,
        {
          novaSenha
        }
      )

      alert("Senha alterada com sucesso.")
    } catch (error) {
      console.log(error)

      alert(
        error?.response?.data?.error ||
        "Erro ao alterar senha."
      )
    }
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
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar funcionário..."
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
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          <Select
            value={funcao}
            onChange={(e) => setFuncao(e.target.value)}
          >
            <option value="OPERADOR">Operador</option>
            <option value="VENDEDOR">Vendedor</option>
            <option value="VENDEDOR_OPERADOR">Vendedor / Operador</option>
            <option value="ADMIN">Admin</option>
          </Select>

          <Input
            type="email"
            placeholder="Email"
            value={email}
            disabled={!!editandoId}
            onChange={(e) => setEmail(e.target.value)}
          />

          {!editandoId && (
            <Input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="submit">
            {editandoId ? "Atualizar Funcionário" : "Salvar Funcionário"}
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
              <Th>Telefone</Th>
              <Th>Função</Th>
              <Th>Email</Th>
              <Th>Ativo</Th>
              <Th>Ações</Th>
            </tr>
          </thead>

          <tbody>
            {funcionarios.map((funcionario) => (
              <tr key={funcionario.id} className="border-t">
                <Td>{funcionario.nome}</Td>
                <Td>{funcionario.telefone || "-"}</Td>
                <Td>{funcionario.funcao}</Td>
                <Td>{funcionario.usuario?.email || "-"}</Td>
                <Td>{funcionario.ativo ? "Sim" : "Não"}</Td>

                <Td>
                  <div className="flex gap-2">
                    <Button onClick={() => editarFuncionario(funcionario)}>
                      Editar
                    </Button>

                    <Button onClick={() => toggleAtivo(funcionario)}>
                      {funcionario.ativo ? "Desativar" : "Ativar"}
                    </Button>

                  <Button
                    onClick={() => redefinirSenha(funcionario)}
                  >
                    Resetar Senha
                  </Button>

                  </div>
                </Td>
              </tr>
            ))}

            {funcionarios.length === 0 && (
              <tr>
                <td className="p-4" colSpan="6">
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}