import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"

export function ConfiguracaoEmpresa() {
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [endereco, setEndereco] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
  const [cnpj, setCnpj] = useState("")

  async function carregarConfiguracao() {
    try {
      const response = await api.get("/configuracao-empresa")

      setNome(response.data.nome || "")
      setTelefone(response.data.telefone || "")
      setEmail(response.data.email || "")
      setEndereco(response.data.endereco || "")
      setCidade(response.data.cidade || "")
      setEstado(response.data.estado || "")
      setCnpj(response.data.cnpj || "")
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar configuração da empresa")
    }
  }

  async function salvarConfiguracao(e) {
    e.preventDefault()

    try {
      await api.put("/configuracao-empresa", {
        nome,
        telefone,
        email,
        endereco,
        cidade,
        estado,
        cnpj
      })

      alert("Configuração salva com sucesso")
    } catch (error) {
      console.log(error)
      alert("Erro ao salvar configuração")
    }
  }

  useEffect(() => {
    carregarConfiguracao()
  }, [])

  return (
    <div>
      <form
        onSubmit={salvarConfiguracao}
        className="bg-white rounded-2xl shadow-md p-6"
      >
        <h2 className="text-xl font-bold mb-4">
          Dados da Empresa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder="Nome da empresa"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <Input
            type="text"
            placeholder="CNPJ"

            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Telefone"

            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          <Input
            type="email"
            placeholder="E-mail"

            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Endereço"
            className="border p-3 rounded-lg md:col-span-2"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Cidade"

            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Estado"

            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Salvar Configuração
        </button>

        <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-bold mb-4">
            Dados Cadastrados
        </h2>

        <div className="bg-gray-50 border rounded-2xl p-5">
            <p>
            <strong>Empresa:</strong> {nome || "-"}
            </p>

            <p>
            <strong>CNPJ:</strong> {cnpj || "-"}
            </p>

            <p>
            <strong>Telefone:</strong> {telefone || "-"}
            </p>

            <p>
            <strong>E-mail:</strong> {email || "-"}
            </p>

            <p>
            <strong>Endereço:</strong> {endereco || "-"}
            </p>

            <p>
            <strong>Cidade/UF:</strong> {cidade || "-"} / {estado || "-"}
            </p>
        </div>
        </div>
        

      </form>
    </div>
  )
}