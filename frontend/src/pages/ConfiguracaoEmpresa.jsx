import { useEffect, useRef, useState } from "react"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"
import { Button } from "../components/ui/Button"
import { IMaskInput } from "react-imask"
import {
  Building2,
  Save,
  Image as ImageIcon,
  Upload,
  Trash2
} from "lucide-react"

export function ConfiguracaoEmpresa() {
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [endereco, setEndereco] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  const inputLogoRef = useRef(null)

  const estadosBrasil = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
    "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
    "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ]

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
      setLogoUrl(response.data.logoUrl || "")
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
        cnpj,
        logoUrl
      })

      alert("Configuração salva com sucesso")
      carregarConfiguracao()
    } catch (error) {
      console.log(error)
      alert("Erro ao salvar configuração")
    }
  }

  function selecionarLogo() {
    inputLogoRef.current?.click()
  }

  function carregarLogo(e) {
    const arquivo = e.target.files?.[0]

    if (!arquivo) return

    const tiposPermitidos = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/webp"
    ]

    if (!tiposPermitidos.includes(arquivo.type)) {
      alert("Selecione uma imagem PNG, JPG, JPEG, SVG ou WEBP.")
      return
    }

    const tamanhoMaximo = 2 * 1024 * 1024

    if (arquivo.size > tamanhoMaximo) {
      alert("A logo deve ter no máximo 2 MB.")
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setLogoUrl(reader.result)
    }

    reader.readAsDataURL(arquivo)
  }

  function removerLogo() {
    const confirmar = confirm("Deseja remover a logo da empresa?")

    if (!confirmar) return

    setLogoUrl("")

    if (inputLogoRef.current) {
      inputLogoRef.current.value = ""
    }
  }

  useEffect(() => {
    carregarConfiguracao()
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2">
          <Building2 size={22} className="text-blue-600" />

          <h1 className="text-2xl font-bold text-gray-900">
            Configurações
          </h1>
        </div>

        <p className="text-sm text-gray-500 mt-1">
          Configure os dados da empresa usados nos relatórios e impressões.
        </p>
      </div>

      <form
        onSubmit={salvarConfiguracao}
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5"
      >
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-800">
            Dados da Empresa
          </h2>

          <p className="text-sm text-gray-500">
            Essas informações serão exibidas nos cabeçalhos de impressão.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon size={18} className="text-gray-600" />

              <h3 className="font-semibold text-gray-800">
                Logo da Empresa
              </h3>
            </div>

            <div className="h-40 bg-white border border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo da empresa"
                  className="max-h-full max-w-full object-contain p-2"
                />
              ) : (
                <span className="text-sm text-gray-400 text-center px-4">
                  Nenhuma logo cadastrada
                </span>
              )}
            </div>

            <input
              ref={inputLogoRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp"
              onChange={carregarLogo}
              className="hidden"
            />

            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                onClick={selecionarLogo}
                className="h-10 px-4 flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                Selecionar Logo
              </Button>

              {logoUrl && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={removerLogo}
                  className="h-10 px-4 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Remover Logo
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Formatos aceitos: PNG, JPG, SVG ou WEBP. Tamanho máximo: 2 MB.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 content-start">
            <Input
              type="text"
              placeholder="Nome da empresa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />

            <IMaskInput
              mask="00.000.000/0000-00"
              value={cnpj}
              onAccept={(value) => setCnpj(value)}
              placeholder="CNPJ"
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
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              type="text"
              placeholder="Endereço"
              className="md:col-span-2"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />

            <Input
              type="text"
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />

            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="h-11 border border-gray-300 px-3 rounded-lg w-full bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione o Estado</option>

              {estadosBrasil.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          type="submit"
          className="mt-5 h-11 px-6 flex items-center gap-2"
        >
          <Save size={16} />
          Salvar Configuração
        </Button>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Prévia dos dados cadastrados
          </h2>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="w-36 h-24 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo da empresa"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs text-gray-400">
                    Sem logo
                  </span>
                )}
              </div>

              <div className="space-y-1 text-sm">
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
          </div>
        </div>
      </form>
    </div>
  )
}