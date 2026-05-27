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

    return new Date(data).toLocaleDateString("pt-BR")
  }

  function obterSituacaoPrazo(dataEntrega) {
    if (!dataEntrega) {
      return {
        texto: "Sem data",
        classe: "bg-gray-100 text-gray-700 border-gray-300"
      }
    }

    const hoje = new Date()
    hoje.seThours(0, 0, 0, 0)

    const entrega = new Date(dataEntrega)
    entrega.seThours(0, 0, 0, 0)

    if (entrega < hoje) {
      return {
        texto: "Atrasado",
        classe: "bg-red-100 text-red-700 border-red-400"
      }
    }

    if (entrega.getTime() === hoje.getTime()) {
      return {
        texto: "Hoje",
        classe: "bg-yellow-100 text-yellow-700 border-yellow-400"
      }
    }

    return {
      texto: "No prazo",
      classe: "bg-green-100 text-green-700 border-green-400"
    }
  }

  function obterClasseCard(dataEntrega) {
    const situacao = obterSituacaoPrazo(dataEntrega)

    if (situacao.texto === "Atrasado") {
      return "border-red-500 bg-red-50"
    }

    if (situacao.texto === "Hoje") {
      return "border-yellow-500 bg-yellow-50"
    }

    if (situacao.texto === "No prazo") {
      return "border-green-400 bg-white"
    }

    return "border-gray-300 bg-white"
  }

  function obterStatus(status) {
    const statusMap = {
      CONCLUIDO: {
        texto: "Concluído",
        classe: "bg-gray-100 text-gray-700 border-gray-300"
      },
      PRONTO_ENTREGA: {
        texto: "Pronto Entrega",
        classe: "bg-blue-100 text-blue-700 border-blue-400"
      },
      SAIU_ENTREGA: {
        texto: "Saiu Entrega",
        classe: "bg-yellow-100 text-yellow-700 border-yellow-400"
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

    const bateBusca =
      String(pedido.numeroPedido).includes(textoBusca) ||
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
          <option value="CONCLUIDO">Concluído</option>
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
          const statusInfo = obterStatus(pedido.status)

          return (
            <div
              key={pedido.id}
              className={`rounded-2xl shadow-md p-5 border-2 ${obterClasseCard(pedido.dataEntrega)}`}
            >
              <div className="flex justify-between gap-6 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold">
                      Pedido #{pedido.numeroPedido}
                    </h2>

                    <span className={`text-xs px-3 py-1 rounded-full border ${statusInfo.classe}`}>
                      {statusInfo.texto}
                    </span>

                    <span className={`text-xs px-3 py-1 rounded-full border ${situacaoPrazo.classe}`}>
                      {situacaoPrazo.texto}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
                    <p>
                      <strong>Cliente:</strong> {pedido.cliente?.nome}
                    </p>

                    <p>
                      <strong>Rota:</strong> {pedido.rota?.nome || "-"}
                    </p>

                    <p>
                      <strong>Entrega:</strong> {formatarData(pedido.dataEntrega)}
                    </p>

                    <p>
                      <strong>Recebedor:</strong> {pedido.nomeRecebedor || "-"}
                    </p>

                    <p>
                      <strong>Contato:</strong> {pedido.contatoRecebedor || "-"}
                    </p>

                    <p className="md:col-span-2">
                      <strong>Endereço:</strong> {pedido.enderecoEntrega || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[180px]">
                  {pedido.status === "CONCLUIDO" && (
                    <button
                      onClick={() =>
                        alterarStatus(
                          pedido.id,
                          "PRONTO_ENTREGA"
                        )
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Preparar Entrega
                    </button>
                  )}

                  {pedido.status === "PRONTO_ENTREGA" && (
                    <button
                      onClick={() =>
                        alterarStatus(
                          pedido.id,
                          "SAIU_ENTREGA"
                        )
                      }
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                    >
                      Saiu Entrega
                    </button>
                  )}

                  {pedido.status === "SAIU_ENTREGA" && (
                    <button
                      onClick={() =>
                        alterarStatus(
                          pedido.id,
                          "ENTREGUE"
                        )
                      }
                      className="bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                      Finalizar Entrega
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {pedidosFiltrados.lengTh === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            Nenhum pedido na expedição.
          </div>
        )}
      </div>
    </div>
  )
}