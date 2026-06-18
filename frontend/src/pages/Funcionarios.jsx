import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { IMaskInput } from "react-imask"

import {
  Save,
  X,
  Pencil,
  Trash2,
  KeyRound,
  UserCheck,
  UserX,
  UserCog
} from "lucide-react"

export function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState([])
  const [busca, setBusca] = useState("")
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [funcao, setFuncao] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarInativos, setMostrarInativos] = useState(false)

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

    async function excluirFuncionario(funcionario) {
    const confirmar = confirm(
      `Deseja excluir ${funcionario.nome}?\n\n` +
      `Se houver pedidos vinculados, ele será apenas desativado.`
    )

    if (!confirmar) return

    try {
      const response = await api.delete(
        `/funcionarios/${funcionario.id}`
      )

      alert(response.data.message)
      carregarFuncionarios()
    } catch (error) {
      console.log(error)

      alert(
        error?.response?.data?.error ||
        "Erro ao excluir funcionário."
      )
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
    setFuncao("")
    setEmail("")
    setSenha("")
    setEditandoId(null)
  }


  return (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCog size={22} className="text-blue-600" />

            <h1 className="text-2xl font-bold text-gray-900">
              Funcionários
            </h1>
          </div>
        </div>

        <div className="relative w-full lg:w-80">
          <Input
            type="text"
            placeholder="Buscar funcionário..."
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
          {editandoId ? "Editar funcionário" : "Novo funcionário"}
        </h2>
        <p className="text-sm text-gray-500">
          Preencha os dados principais do funcionário.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <IMaskInput
          mask="(00) 00000-0000"
          value={telefone}
          onAccept={(value) => setTelefone(value)}
          placeholder="Telefone"
          className="h-11 border border-gray-300 px-3 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <Select
          value={funcao}
          onChange={(e) => setFuncao(e.target.value)}
        >
          <option value="">Selecione a função</option>
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
          autoComplete="new-email"
          onChange={(e) => setEmail(e.target.value)}
        />

        {!editandoId && (
          <Input
            type="password"
            placeholder="Senha"
            value={senha}
            autoComplete="new-password"
            onChange={(e) => setSenha(e.target.value)}
          />
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="submit" className="h-11 px-6 flex items-center gap-2">
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
      <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Lista de funcionários
          </h2>
          <p className="text-sm text-gray-500">
            {
              funcionarios.filter(
                (funcionario) =>
                  funcionario.usuario?.email !== "admin@sistema.com" &&
                  (mostrarInativos || funcionario.ativo)
              ).length
            } funcionário(s) encontrado(s).
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            checked={mostrarInativos}
            onChange={(e) => setMostrarInativos(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Mostrar desativados
        </label>
      </div>

      <div className="p-5">
        <div className="overflow-x-auto border border-gray-200 rounded-xl">
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
              {funcionarios
                .filter(
                  (funcionario) =>
                    mostrarInativos || funcionario.ativo
                )
                .map((funcionario) => {
                  const emailFuncionario = funcionario.usuario?.email
                  const isAdminSistema = emailFuncionario === "admin@sistema.com"

                  if (isAdminSistema) return null

                  return (
                    <tr
                      key={funcionario.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <Td>
                        <span className="font-medium text-gray-900">
                          {funcionario.nome}
                        </span>
                      </Td>

                      <Td>{funcionario.telefone || "-"}</Td>

                      <Td>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {funcionario.funcao}
                        </span>
                      </Td>

                      <Td>{funcionario.usuario?.email || "-"}</Td>

                      <Td>
                        <span
                          className={
                            funcionario.ativo
                              ? "inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                              : "inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                          }
                        >
                          {funcionario.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </Td>

                      <Td>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            onClick={() => editarFuncionario(funcionario)}
                            className="h-9 px-3 flex items-center gap-1"
                          >
                            <Pencil size={15} />
                            Editar
                          </Button>

                          <Button
                            type="button"
                            variant={funcionario.ativo ? "warning" : "success"}
                            onClick={() => toggleAtivo(funcionario)}
                            className="h-9 px-3 flex items-center gap-1"
                          >
                            {funcionario.ativo ? (
                              <>
                                <UserX size={15} />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck size={15} />
                                Ativar
                              </>
                            )}
                          </Button>

                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => excluirFuncionario(funcionario)}
                            className="h-9 px-3 flex items-center gap-1"
                          >
                            <Trash2 size={15} />
                            Excluir
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => redefinirSenha(funcionario)}
                            className="h-9 px-3 flex items-center gap-1"
                          >
                            <KeyRound size={15} />
                            Resetar
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}

              {funcionarios.filter(
                (funcionario) => mostrarInativos || funcionario.ativo
              ).length === 0 && (
                <tr>
                  <td
                    className="p-6 text-center text-gray-500"
                    colSpan="6"
                  >
                    Nenhum funcionário encontrado.
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