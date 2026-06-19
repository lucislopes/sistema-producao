import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Button } from "../components/ui/Button"
import { BadgeStatus } from "../components/ui/BadgeStatus"

import {
  Save,
  ClipboardList,
  Package,
  Ruler,
  ShoppingCart,
  Scissors,
  Layers,
  Drill,
  Cog
} from "lucide-react"

export function PlanoCorteServico() {
  const [pedidos, setPedidos] = useState([])
  const [tiposServico, setTiposServico] = useState([])
  const [operadores, setOperadores] = useState([])  

  const [planosCadastrados, setPlanosCadastrados] = useState([])

  const [pedidoId, setPedidoId] = useState("")
  const [numeroPlano, setNumeroPlano] = useState("")
  const [quantidadeChapas, setQuantidadeChapas] = useState("")
  const [medidaEncabecamento, setMedidaEncabecamento] = useState("")
  const [compraExterna, setCompraExterna] = useState(false)
  const [observacoes, setObservacoes] = useState("")
  const [servicosSelecionados, setServicosSelecionados] = useState({})

  const [editandoId, setEditandoId] = useState(null)

  const [searchParams] = useSearchParams()
  const pedidoIdUrl = searchParams.get("pedidoId")

  async function carregarDados() {
    try {
      const [pedidosRes, tiposRes, operadoresRes] = await Promise.all([
        api.get("/pedidos", {
          params: { page: 1, limit: 100, somenteAtivos: true }
        }),
        api.get("/tipos-servico"),
        api.get("/funcionarios/operadores")
      ])
    
    const pedidosCarregados = pedidosRes.data.dados || pedidosRes.data

    const pedidosComProducao = pedidosCarregados.filter(
    (pedido) => pedido.tipoPedido !== "DIRETO_ENTREGA"
    )

    setPedidos(pedidosComProducao)

      setTiposServico(tiposRes.data.dados || tiposRes.data)
      setOperadores(operadoresRes.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar dados")
    }
  }

  async function carregarPlanosComServicos(idPedido) {
    if (!idPedido) {
      setPlanosCadastrados([])
      return
    }

    try {
      const response = await api.get(
        `/plano-corte-servico/pedido/${idPedido}`
      )

      setPlanosCadastrados(response.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar planos e serviços")
    }
  }

  useEffect(() => {
    async function carregarInicial() {
      await carregarDados()

      if (pedidoIdUrl) {
        setPedidoId(pedidoIdUrl)
      }
    }

    carregarInicial()
  }, [])

  useEffect(() => {
    carregarPlanosComServicos(pedidoId)
  }, [pedidoId])

  function alternarServico(tipoServicoId) {
    setServicosSelecionados((atual) => {
      const novo = { ...atual }

      if (novo[tipoServicoId]) {
        delete novo[tipoServicoId]
      } else {
        novo[tipoServicoId] = {
          tipoServicoId,
          operadorId: "",
          observacoes: ""
        }
      }

      return novo
    })
  }

  function alterarObservacaoServico(tipoServicoId, observacoes) {
    setServicosSelecionados((atual) => ({
      ...atual,
      [tipoServicoId]: {
        ...atual[tipoServicoId],
        tipoServicoId,
        observacoes
      }
    }))
  }

  function alterarOperadorServico(tipoServicoId, operadorId) {
    setServicosSelecionados((atual) => ({
      ...atual,
      [tipoServicoId]: {
        ...atual[tipoServicoId],
        tipoServicoId,
        operadorId
      }
    }))
  }

    function limparFormulario() {
        setEditandoId(null)
        setNumeroPlano("")
        setQuantidadeChapas("")
        setMedidaEncabecamento("")
        setCompraExterna(false)
        setObservacoes("")
        setServicosSelecionados({})
    }

  async function handleSubmit(e) {
    e.preventDefault()

    const servicos = Object.values(servicosSelecionados)

    if (servicos.length === 0) {
      alert("Selecione pelo menos um serviço")
      return
    }

    const dados = {
      pedidoId,
      numeroPlano,
      quantidadeChapas,
      medidaEncabecamento,
      compraExterna,
      observacoes,
      servicos
    }

    try {
      if (editandoId) {
        await api.put(`/plano-corte-servico/${editandoId}`, dados)
        } else {
        await api.post("/plano-corte-servico", dados)
        }

      alert("Planos e serviços criados com sucesso")
      limparFormulario()
      await carregarPlanosComServicos(pedidoId)
    } catch (error) {
      console.log(error)

      const mensagem =
        error.response?.data?.error ||
        "Erro ao salvar planos e serviços"

      alert(mensagem)
    }
  }

  const pedidoSelecionado = pedidos.find(
    (pedido) => pedido.id === pedidoId
  )

  function editarPlano(plano) {
    setEditandoId(plano.id)
    setNumeroPlano(plano.numeroPlano)
    setQuantidadeChapas(plano.quantidadeChapas)
    setMedidaEncabecamento(plano.medidaEncabecamento || "")
    setCompraExterna(plano.compraExterna)
    setObservacoes(plano.observacoes || "")

    const servicosMapeados = {}

    plano.servicos.forEach((servico) => {
        servicosMapeados[servico.tipoServicoId] = {
          tipoServicoId: servico.tipoServicoId,
          operadorId: servico.operadorId || "",
          observacoes: servico.observacoes || ""
        }
    })

    setServicosSelecionados(servicosMapeados)

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    })

    }

    function iconeServico(nome) {
    const nomeLower = nome.toLowerCase()

    if (nomeLower.includes("corte")) return <Scissors size={16} />
    if (nomeLower.includes("encabe")) return <Layers size={16} />
    if (nomeLower.includes("fura")) return <Drill size={16} />
    if (nomeLower.includes("usin")) return <Cog size={16} />

    return <Package size={16} />
    }

    function formatarData(data) {
  if (!data) return "Sem data"

  return new Date(data).toLocaleDateString("pt-BR")
}

function statusPedidoTexto(status) {
  const mapa = {
    ABERTO: "Aberto",
    EM_SEPARACAO: "Em Separação",
    EM_PRODUCAO: "Em Produção",
    CONCLUIDO: "Concluído",
    PRONTO_ENTREGA: "Pronto Entrega",
    SAIU_ENTREGA: "Saiu Entrega",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado"
  }

  return mapa[status] || status
}

const totalChapasPlanos = planosCadastrados.reduce(
  (total, plano) => total + Number(plano.quantidadeChapas || 0),
  0
)

function podeEditarPlanoTela(plano) {
    const usuario = JSON.parse(localStorage.getItem("@usuario") || "{}")

    if (usuario.funcao === "ADMIN") {
      return true
    }

    if (
      usuario.funcao === "VENDEDOR" ||
      usuario.funcao === "VENDEDOR_OPERADOR"
    ) {
      return plano.pedido?.vendedorId === usuario.funcionarioId
    }

    return false
  }

  const usuarioLogado = JSON.parse(localStorage.getItem("@usuario") || "{}")
  const isAdmin = usuarioLogado.funcao === "ADMIN"

  return (
    <div>
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList size={24} className="text-blue-600" />

          <div>
            <h1 className="text-2xl font-bold">
              {editandoId ? "Editar Plano + Serviços" : "Plano de Corte + Serviços"}
            </h1>

            <p className="text-sm text-gray-600">
              Cadastro rápido de vários planos com serviços em uma única tela.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Pedido *
              </label>

              <Select
                value={pedidoId}
                onChange={(e) => {
                  setPedidoId(e.target.value)
                  limparFormulario()
                }}
                required
              >
                <option value="">Selecione o pedido</option>

                {pedidos.map((pedido) => (
                  <option key={pedido.id} value={pedido.id}>
                    Pedido {pedido.origemPedido === "EXTERNO" &&
                    pedido.numeroPedidoManual
                      ? pedido.numeroPedidoManual
                      : `#${pedido.numeroPedido}`} - {pedido.cliente?.nome}
                  </option>
                ))}
              </Select>
            </div>

            {pedidoSelecionado && (
                <div className="md:col-span-2 mt-2 flex flex-wrap items-center gap-6 text-sm text-gray-700">
                    <div>
                    <strong>Cliente:</strong>{" "}
                    {pedidoSelecionado.cliente?.nome || "-"}
                    </div>

                    <div>
                    <strong>Status:</strong>{" "}
                    <span className="ml-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {statusPedidoTexto(pedidoSelecionado.status)}
                    </span>
                    </div>

                    <div>
                    <strong>Entrega:</strong>{" "}
                    {formatarData(pedidoSelecionado.dataEntrega)}
                    </div>

                    <div>
                    <strong>Chapas:</strong>{" "}
                    {pedidoSelecionado.totalChapas || totalChapasPlanos || "-"}
                    </div>

                    <div>
                      <strong>Vendedor:</strong>{" "}
                      {pedidoSelecionado.vendedor?.nome || "-"}
                    </div>
                </div>
                )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Número do Plano *
              </label>

              <Input
                placeholder="Ex: 1 ou 1/2/3"
                value={numeroPlano}
                onChange={(e) => setNumeroPlano(e.target.value)}
                required
              />

              <p className="text-xs text-gray-500 mt-1">
                Para vários planos juntos, use barra. Ex: 1/2/3.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Quantidade de Chapas *
              </label>

              <Input
                type="number"
                placeholder="Ex: 10"
                value={quantidadeChapas}
                onChange={(e) => setQuantidadeChapas(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Medida de Encabeçamento
              </label>

              <Input
                placeholder="Ex: 3mm"
                value={medidaEncabecamento}
                onChange={(e) => setMedidaEncabecamento(e.target.value)}
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Compra Externa
              </label>

              <label className="flex items-center gap-2 h-[46px] border border-gray-300 rounded-lg px-3">
                <input
                  type="checkbox"
                  checked={compraExterna}
                  onChange={(e) => setCompraExterna(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />

                <span className="text-sm font-medium text-gray-700">
                  Possui compra externa
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Observações do Plano
              </label>

              <textarea
                className="w-full border border-gray-300 p-3 rounded-lg resize-none"
                rows={2}
                placeholder="Observações do plano..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold mb-3">
                Serviços do Plano
            </h2>

            <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                    <th className="w-[260px] px-4 py-3 text-left font-semibold text-gray-700">
                        Serviço
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Observação
                    </th>

                    {isAdmin && (
                      <th className="w-[260px] px-4 py-3 text-left font-semibold text-gray-700">
                        Operador
                      </th>
                    )}
                    </tr>
                </thead>

                <tbody>
                    {tiposServico.map((tipo) => {
                    const selecionado = servicosSelecionados[tipo.id]

                    return (
                        <tr
                        key={tipo.id}
                        className="border-t border-gray-100"
                        >
                        <td className="px-4 py-3 align-top">
                            <label className="flex items-center gap-3 font-medium text-gray-800">
                            <input
                                type="checkbox"
                                checked={Boolean(selecionado)}
                                onChange={() => alternarServico(tipo.id)}
                                className="h-4 w-4 accent-blue-600"
                            />

                            <div className="flex items-center gap-2">
                            {iconeServico(tipo.nome)}
                            {tipo.nome}
                            </div>
                            </label>
                        </td>

                        <td className="px-4 py-3">
                            <textarea
                            rows={1}
                            placeholder={`Observação para ${tipo.nome}`}
                            disabled={!selecionado}
                            className={`
                                w-full resize-none rounded-lg border p-2 text-sm
                                ${
                                selecionado
                                    ? "border-gray-300 bg-white"
                                    : "border-gray-200 bg-gray-100 text-gray-400"
                                }
                            `}
                            value={selecionado?.observacoes || ""}
                            onChange={(e) =>
                                alterarObservacaoServico(
                                tipo.id,
                                e.target.value
                                )
                            }
                            />
                        </td>

                        {isAdmin && (
                          <td className="px-4 py-3">
                            <Select
                              value={selecionado?.operadorId || ""}
                              disabled={!selecionado}
                              onChange={(e) =>
                                alterarOperadorServico(tipo.id, e.target.value)
                              }
                            >
                              <option value="">Sem operador</option>

                              {operadores.map((operador) => (
                                <option key={operador.id} value={operador.id}>
                                  {operador.nome}
                                </option>
                              ))}
                            </Select>
                          </td>
                        )}
                        </tr>
                    )
                    })}

                    {tiposServico.length === 0 && (
                    <tr>
                        <td
                        colSpan="2"
                        className="px-4 py-6 text-center text-gray-500"
                        >
                        Nenhum tipo de serviço cadastrado.
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
            </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              className="flex items-center gap-2 px-6 py-3"
            >
              <Save size={16} />
              Salvar Planos e Serviços
            </Button>
          </div>
        </form>
      </div>

      {pedidoId && (
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold mb-4">
            Planos e Serviços Cadastrados
          </h2>

         {planosCadastrados.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhum plano cadastrado para este pedido.
            </p>
          )}

          <div className="space-y-4">
            {planosCadastrados.map((plano) => (
              <div
                key={plano.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                    <strong className="text-lg">
                        Plano {plano.numeroPlano}
                    </strong>

                    <p className="mt-1 text-sm text-gray-600">
                        {plano.quantidadeChapas} chapa(s)
                        {plano.medidaEncabecamento
                        ? ` • Encabeçamento: ${plano.medidaEncabecamento}`
                        : ""}
                        {plano.compraExterna ? " • Compra externa" : ""}
                    </p>
                    </div>

                    {podeEditarPlanoTela(plano) ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => editarPlano(plano)}
                    >
                      Editar
                    </Button>
                  ) : (
                    <span className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800">
                      Bloqueado: vendedor responsável {plano.pedido?.vendedor?.nome || "-"}
                    </span>
                  )}
                </div>

                {plano.observacoes && (
                    <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    <strong>Obs. do plano:</strong>{" "}
                    {plano.observacoes}
                    </div>
                )}

                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                            Serviço
                        </th>

                        <th className="w-[130px] px-3 py-2 text-left font-semibold text-gray-700">
                            Status
                        </th>

                        <th className="px-3 py-2 text-left font-semibold text-gray-700">
                            Observação
                        </th>

                        <th className="w-[180px] px-3 py-2 text-left font-semibold text-gray-700">
                            Operador
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {plano.servicos.map((servico) => (
                        <tr
                            key={servico.id}
                            className="border-t border-gray-100"
                        >
                            <td className="px-3 py-2 font-medium">
                            {servico.tipoServico?.nome}
                            </td>

                            <td className="px-3 py-2">
                                <BadgeStatus status={servico.status} />
                            </td>

                            <td className="px-3 py-2 text-gray-600">
                            {servico.observacoes || "-"}
                            </td>

                            <td className="px-3 py-2 text-gray-600">
                            {servico.operador?.nome || "-"}
                            </td>

                        </tr>
                        ))}

                        {plano.servicos.length === 0 && (
                        <tr>
                            <td
                            colSpan="4"
                            className="px-3 py-4 text-center text-gray-500"
                            >
                            Nenhum serviço neste plano.
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}