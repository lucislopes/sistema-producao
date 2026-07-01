import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"

export function Expedicao() {
  const [pedidos, setPedidos] = useState([])
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [filtroRota, setFiltroRota] = useState("")

  async function carregarPedidos() {
    try {
      const response = await api.get("/expedicao")
      setPedidos(response.data)

    } catch (error) {
      console.log(error)
      alert("Erro ao carregar expedição")
    }
  }

  useEffect(() => {
    carregarPedidos()
    const interval = setInterval(() => {
      carregarPedidos()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  async function alterarStatus(id, status) {
    try {
      await api.put(`/expedicao/${id}/status`, {
        status
      })

      carregarPedidos()
    } catch (error) {
      console.log(error)
      alert("Erro ao alterar status")
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
      return "border-red-500 bg-red-50"
    }

    if (situacao.texto === "Último dia") {
      return "border-yellow-500 bg-yellow-50"
    }

    if (situacao.texto === "No prazo") {
      return "border-green-400 bg-white"
    }

    return "border-gray-300 bg-white"
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
    <div>
      <div className="bg-white p-4 rounded-2xl shadow-md mb-6">
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

          <button
            type="button"
            onClick={() => {
              setBusca("")
              setFiltroStatus("")
              setFiltroRota("")
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pedidosFiltrados.map((pedido) => {
          const situacaoPrazo = obterSituacaoPrazo(pedido.dataEntrega)
          const statusInfo = obterStatusExpedicao(pedido)

          return (
            <div
              key={pedido.id}
              className={`rounded-2xl shadow-md p-4 border-2 ${obterClasseCard(pedido.dataEntrega)}`}
            >
              <div className="flex justify-between gap-6 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
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

                <div className="flex flex-col gap-2 min-w-[180px]">
                  {!podeAlterarExpedicao && (
                    <span className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-800 text-center">
                      Somente consulta
                    </span>
                  )}

                  {podeAlterarExpedicao &&
                    ["CONCLUIDO", "PRONTO_ENTREGA"].includes(pedido.status) && (
                      <button
                        onClick={() => {
                          const confirmar = confirm(
                            `Deseja finalizar a entrega do pedido ${obterNumeroPedido(pedido)}?`
                          )

                          if (!confirmar) return

                          alterarStatus(pedido.id, "ENTREGUE")
                        }}
                        className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
                      >
                        Finalizar Entrega
                      </button>
                    )}
                </div>
              </div>
            </div>
          )
        })}

        {pedidosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            Nenhum pedido na expedição.
          </div>
        )}
      </div>
    </div>
  )
}
