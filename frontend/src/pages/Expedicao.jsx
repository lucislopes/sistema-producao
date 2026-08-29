import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Button } from "../components/ui/Button"
import { ConfirmModal } from "../components/ui/ConfirmModal"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackState"
import { Link } from "react-router-dom"
import { Eye, PackageCheck, TriangleAlert, Truck } from "lucide-react"

export function Expedicao() {
  const [pedidos, setPedidos] = useState([])
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [filtroRota, setFiltroRota] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [pedidoParaFinalizar, setPedidoParaFinalizar] = useState(null)
  const [alterandoId, setAlterandoId] = useState(null)

  async function carregarPedidos({ silencioso = false } = {}) {
    if (!silencioso) setCarregando(true)

    try {
      const response = await api.get("/expedicao")
      setPedidos(response.data)
      setErro(false)

    } catch (error) {
      console.log(error)
      if (!silencioso) setErro(true)
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }

  useEffect(() => {
    carregarPedidos()
    const interval = setInterval(() => {
      if (!document.hidden) carregarPedidos({ silencioso: true })
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  async function alterarStatus(id, status) {
    if (alterandoId) return
    setAlterandoId(id)

    try {
      await api.put(`/expedicao/${id}/status`, {
        status
      })

      await carregarPedidos({ silencioso: true })
      setPedidoParaFinalizar(null)
    } catch (error) {
      console.log(error)
      alert(error?.response?.data?.error || "Erro ao alterar status")
    } finally {
      setAlterandoId(null)
    }
  }

  function formatarData(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-")

    return `${dia}/${mes}/${ano}`
  }

  function obterNumeroPedido(pedido) {
    if (
      pedido?.origemPedido === "EXTERNO" &&
      pedido?.numeroPedidoManual
    ) {
      return pedido.numeroPedidoManual
    }

    return `#${pedido?.numeroPedido}`
  }

  function obterSituacaoPrazo(dataEntrega) {
    if (!dataEntrega) {
      return {
        texto: "Sem data",
        classe: "bg-gray-100 text-gray-700 border-gray-300"
      }
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const dataTexto = String(dataEntrega).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-").map(Number)

    const entrega = new Date(ano, mes - 1, dia)
    entrega.setHours(0, 0, 0, 0)

    if (entrega < hoje) {
      return {
        texto: "Atrasado",
        classe: "bg-red-100 text-red-700 border-red-400"
      }
    }

    if (entrega.getTime() === hoje.getTime()) {
      return {
        texto: "Último dia",
        classe: "bg-yellow-100 text-yellow-700 border-yellow-400"
      }
    }

    return {
      texto: "No prazo",
      classe: "bg-green-100 text-green-700 border-green-400"
    }
  }

  function obterStatusExpedicao(pedido) {
    if (
      pedido.status === "PRONTO_ENTREGA" &&
      pedido.tipoPedido === "DIRETO_ENTREGA"
    ) {
      return {
        texto: "Pronto Entrega - Chapa Inteira",
        classe: "bg-green-100 text-green-700 border-green-400"
      }
    }

    return obterStatus(pedido.status)
  }

  function obterClasseCard(dataEntrega) {
    const situacao = obterSituacaoPrazo(dataEntrega)

    if (situacao.texto === "Atrasado") {
      return "border-gray-200 border-l-red-500 bg-white"
    }

    if (situacao.texto === "Último dia") {
      return "border-gray-200 border-l-yellow-500 bg-white"
    }

    if (situacao.texto === "No prazo") {
      return "border-gray-200 border-l-green-500 bg-white"
    }

    return "border-gray-200 border-l-gray-400 bg-white"
  }

  const usuarioLogado = JSON.parse(localStorage.getItem("@usuario") || "{}")
  const podeAlterarExpedicao =
    usuarioLogado.funcao === "ADMIN" ||
    usuarioLogado.funcao === "VENDEDOR_OPERADOR"

  function obterStatus(status) {
    const statusMap = {
      PRONTO_ENTREGA: {
        texto: "Pronto Entrega",
        classe: "bg-blue-100 text-blue-700 border-blue-400"
      },
      ENTREGUE: {
        texto: "Entregue",
        classe: "bg-green-100 text-green-700 border-green-400"
      },
      SAIU_ENTREGA: {
        texto: "Saiu para Entrega",
        classe: "bg-purple-100 text-purple-700 border-purple-300"
      }
    }

    return statusMap[status] || {
      texto: status,
      classe: "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const textoBusca = busca.toLowerCase()

    const numeroPedidoTexto = String(
      pedido.origemPedido === "EXTERNO"
        ? pedido.numeroPedidoManual || ""
        : pedido.numeroPedido || ""
    ).toLowerCase()

    const bateBusca =
      numeroPedidoTexto.includes(textoBusca) ||
      pedido.cliente?.nome?.toLowerCase().includes(textoBusca)

    const bateStatus =
      filtroStatus === "" || pedido.status === filtroStatus

    const bateRota =
      filtroRota === "" || pedido.rotaId === filtroRota

    return bateBusca && bateStatus && bateRota
  })

  const rotasUnicas = Array.from(
    new Map(
      pedidos
        .filter((pedido) => pedido.rota)
        .map((pedido) => [pedido.rota.id, pedido.rota])
    ).values()
  )

  const totalAtrasados = pedidos.filter(
    (pedido) => obterSituacaoPrazo(pedido.dataEntrega).texto === "Atrasado"
  ).length

  const filtrosAtivos = Boolean(busca || filtroStatus || filtroRota)

  function obterQuantidadeChapas(pedido) {
  if (pedido.tipoPedido === "DIRETO_ENTREGA") {
    return Number(pedido.quantidadeChapasDiretoEntrega || 0)
  }

  return pedido.planos?.reduce(
    (total, plano) => total + Number(plano.quantidadeChapas || 0),
    0
  ) || 0
}

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Na expedição</p><strong className="text-2xl text-gray-900">{pedidos.length}</strong></div>
            <Truck className="text-blue-600" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-red-700">Atrasados</p><strong className="text-2xl text-red-900">{totalAtrasados}</strong></div>
            <TriangleAlert className="text-red-600" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-green-700">Resultados exibidos</p><strong className="text-2xl text-green-900">{pedidosFiltrados.length}</strong></div>
            <PackageCheck className="text-green-600" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            type="text"
            placeholder="Buscar pedido ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <Select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="PRONTO_ENTREGA">Pronto Entrega</option>
            <option value="SAIU_ENTREGA">Saiu Entrega</option>
          </Select>

          <Select
            value={filtroRota}
            onChange={(e) => setFiltroRota(e.target.value)}
          >
            <option value="">Todas as rotas</option>

            {rotasUnicas.map((rota) => (
              <option key={rota.id} value={rota.id}>
                {rota.nome}
              </option>
            ))}
          </Select>

          <Button
            type="button"
            variant="dangerSoft"
            disabled={!filtrosAtivos}
            onClick={() => {
              setBusca("")
              setFiltroStatus("")
              setFiltroRota("")
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </div>

      {carregando ? (
        <LoadingState mensagem="Carregando pedidos da expedição..." />
      ) : erro ? (
        <ErrorState onRetry={() => carregarPedidos()} />
      ) : (
      <div className="grid grid-cols-1 gap-4">
        {pedidosFiltrados.map((pedido) => {
          const situacaoPrazo = obterSituacaoPrazo(pedido.dataEntrega)
          const statusInfo = obterStatusExpedicao(pedido)

          return (
            <div
              key={pedido.id}
              className={`rounded-2xl border border-l-4 p-4 shadow-sm transition-shadow hover:shadow-md ${obterClasseCard(pedido.dataEntrega)}`}
            >
              <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold">
                      Pedido {obterNumeroPedido(pedido)}
                    </h2>

                    <span className={`text-xs px-3 py-1 rounded-full border ${statusInfo.classe}`}>
                      {statusInfo.texto}
                    </span>

                    <span className={`text-xs px-3 py-1 rounded-full border ${situacaoPrazo.classe}`}>
                      {situacaoPrazo.texto}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-gray-700">
                    <div>
                      <span className="block text-xs text-gray-500">Cliente</span>
                      <strong>{pedido.cliente?.nome || "-"}</strong>
                    </div>

                    <div>
                      <span className="block text-xs text-gray-500">Data Pedido</span>
                      <strong>{formatarData(pedido.dataPedido || pedido.createdAt)}</strong>
                    </div>

                    <div>
                      <span className="block text-xs text-gray-500">Entrega</span>
                      <strong>{formatarData(pedido.dataEntrega)}</strong>
                    </div>

                    <div>
                      <span className="block text-xs text-gray-500">Chapas</span>
                      <strong>{obterQuantidadeChapas(pedido)}</strong>
                    </div>

                    <div>
                      <span className="block text-xs text-gray-500">Tipo</span>
                      <strong>
                        {pedido.tipoEntrega === "CLIENTE_RETIRA"
                          ? "Cliente Retira"
                          : "Empresa Entrega"}
                      </strong>
                    </div>

                    {pedido.tipoEntrega === "ENTREGA_EMPRESA" && (
                      <>
                        <div>
                          <span className="block text-xs text-gray-500">Rota</span>
                          <strong>{pedido.rota?.nome || "-"}</strong>
                        </div>

                        <div>
                          <span className="block text-xs text-gray-500">Recebedor</span>
                          <strong>{pedido.nomeRecebedor || "-"}</strong>
                        </div>

                        <div>
                          <span className="block text-xs text-gray-500">Contato</span>
                          <strong>{pedido.contatoRecebedor || "-"}</strong>
                        </div>

                        <div className="md:col-span-4">
                          <span className="block text-xs text-gray-500">Endereço</span>
                          <strong>{pedido.enderecoEntrega || "-"}</strong>
                        </div>
                      </>
                    )}
                </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row xl:min-w-[190px] xl:flex-col">
                  <Link
                    to={`/pedidos/${pedido.id}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Eye size={16} aria-hidden="true" />
                    Ver pedido
                  </Link>
                  {!podeAlterarExpedicao && (
                    <span className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800 text-center">
                      Somente consulta
                    </span>
                  )}

                  {podeAlterarExpedicao &&
                    ["CONCLUIDO", "PRONTO_ENTREGA"].includes(pedido.status) && (
                      <Button
                        variant="success"
                        loading={alterandoId === pedido.id}
                        onClick={() => setPedidoParaFinalizar(pedido)}
                      >
                        Finalizar entrega
                      </Button>
                    )}
                </div>
              </div>
            </div>
          )
        })}

        {pedidosFiltrados.length === 0 && (
          <EmptyState
            titulo="Nenhum pedido na expedição"
            descricao={filtrosAtivos ? "Altere ou limpe os filtros para ver outros pedidos." : "Os pedidos prontos aparecerão aqui."}
          />
        )}
      </div>
      )}

      <ConfirmModal
        open={Boolean(pedidoParaFinalizar)}
        title="Finalizar entrega"
        message={`Confirma que o pedido ${obterNumeroPedido(pedidoParaFinalizar)} foi entregue?`}
        confirmText="Confirmar entrega"
        variant="success"
        onCancel={() => setPedidoParaFinalizar(null)}
        onConfirm={() => alterarStatus(pedidoParaFinalizar.id, "ENTREGUE")}
      />
    </div>
  )
}
