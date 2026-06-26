import { useEffect, useMemo, useState } from "react"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Input } from "../components/ui/Input"
import { Button } from "../components/ui/Button"
import {
  Printer,
  Search,
  Eraser,
  Route,
  PackageCheck,
  CalendarDays,
  TriangleAlert,
  ClipboardCheck
} from "lucide-react"

export function RomaneioEntrega() {
  const [pedidos, setPedidos] = useState([])
  const [rotas, setRotas] = useState([])
  const [empresa, setEmpresa] = useState(null)

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [rotasSelecionadas, setRotasSelecionadas] = useState([])
  const [busca, setBusca] = useState("")

  const [statusSelecionados, setStatusSelecionados] = useState([
    "ABERTO",
    "EM_SEPARACAO",
    "EM_PRODUCAO",
    "CONCLUIDO",
    "PRONTO_ENTREGA",
  ])

  const usuarioLogado = JSON.parse(localStorage.getItem("@usuario") || "{}")

  const isVendedor = usuarioLogado.funcao === "VENDEDOR"

  const podeImprimir =
    usuarioLogado.funcao === "ADMIN" ||
    usuarioLogado.funcao === "VENDEDOR_OPERADOR"

  const statusDisponiveis = [
    {
      valor: "ABERTO",
      nome: "Aberto"
    },
    {
      valor: "EM_SEPARACAO",
      nome: "Em Separação"
    },
    {
      valor: "EM_PRODUCAO",
      nome: "Em Produção"
    },
    {
      valor: "CONCLUIDO",
      nome: "Concluído"
    },
    {
      valor: "PRONTO_ENTREGA",
      nome: "Pronto Entrega"
    },
  ]

  async function carregarRotas() {
    const response = await api.get("/rotas-entrega")
    setRotas(response.data)
  }

  async function carregarRelatorio() {
    try {
      const relatorioResponse = await api.get("/romaneio-entrega", {
        params: {
          dataInicio,
          dataFim,
          rotas: rotasSelecionadas.join(","),
          status: statusSelecionados.join(","),
          busca
        }
      })

      setPedidos(relatorioResponse.data)

      if (podeImprimir) {
        const empresaResponse = await api.get("/configuracao-empresa")
        setEmpresa(empresaResponse.data)
      } else {
        setEmpresa(null)
      }
    } catch (error) {
      console.log(error)

      alert(
        error.response?.data?.error ||
        "Não foi possível carregar o romaneio de entregas no momento."
      )
    }
  }

  useEffect(() => {
    carregarRotas()
    carregarRelatorio()
  }, [])

  function formatarData(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-")

    return `${dia}/${mes}/${ano}`
  }

  function formatarDataFiltro(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")

    return `${ano}-${mes}-${dia}`
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

  function obterQuantidadeChapas(pedido) {
    if (pedido.tipoPedido === "DIRETO_ENTREGA") {
      return Number(pedido.quantidadeChapasDiretoEntrega || 0)
    }

    return pedido.planos?.reduce(
      (total, plano) => total + Number(plano.quantidadeChapas || 0),
      0
    ) || 0
  }

  function alternarRota(id) {
    setRotasSelecionadas((atual) => {
      if (atual.includes(id)) {
        return atual.filter((rotaId) => rotaId !== id)
      }

      return [...atual, id]
    })
  }

  function selecionarTodasRotas() {
    setRotasSelecionadas(rotas.map((rota) => rota.id))
  }

  function limparRotas() {
    setRotasSelecionadas([])
  }

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setBusca("")
    setRotasSelecionadas([])
    setStatusSelecionados([
      "ABERTO",
      "EM_SEPARACAO",
      "EM_PRODUCAO",
      "CONCLUIDO",
      "PRONTO_ENTREGA",
    ])

    setTimeout(() => {
      carregarRelatorio()
    }, 100)
  }

  function filtroHoje() {
    const hoje = formatarDataFiltro(new Date())
    setDataInicio(hoje)
    setDataFim(hoje)
  }

  function filtroAmanha() {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)

    const data = formatarDataFiltro(amanha)
    setDataInicio(data)
    setDataFim(data)
  }

  function filtroProximos5Dias() {
    const hoje = new Date()
    const fim = new Date()

    fim.setDate(fim.getDate() + 5)

    setDataInicio(formatarDataFiltro(hoje))
    setDataFim(formatarDataFiltro(fim))
  }

  function imprimir() {
    window.print()
  }

  const pedidosPorRota = useMemo(() => {
    const grupos = {}

    pedidos.forEach((pedido) => {
      const nomeRota = pedido.rota?.nome || "Sem rota"

      if (!grupos[nomeRota]) {
        grupos[nomeRota] = []
      }

      grupos[nomeRota].push(pedido)
    })

    return grupos
  }, [pedidos])

  const totalPedidos = pedidos.length

  const totalChapas = pedidos.reduce(
    (total, pedido) => total + obterQuantidadeChapas(pedido),
    0
  )

  const atrasados = pedidos.filter((pedido) => {
    if (!pedido.dataEntrega) return false

    const hoje = formatarDataFiltro(new Date())
    const entrega = String(pedido.dataEntrega).substring(0, 10)

    return entrega < hoje
  }).length

  function alternarStatus(status) {
    setStatusSelecionados((atual) => {
      if (atual.includes(status)) {
        return atual.filter((item) => item !== status)
      }

      return [...atual, status]
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold">
            Relatório de Entrega por Rotas
          </h1>

          <p className="text-gray-600">
            Pedidos concluídos pendentes para entrega.
          </p>
        </div>

        {podeImprimir && (
          <Button
            type="button"
            onClick={imprimir}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimir
          </Button>
        )}
      </div>

      {isVendedor && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 no-print">
          <strong>Modo consulta:</strong> você está visualizando o romaneio para acompanhamento das entregas. A impressão fica restrita aos perfis autorizados.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Pedidos para entrega</p>
              <strong className="text-2xl">{totalPedidos}</strong>
            </div>
            <PackageCheck size={28} />
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total de chapas</p>
              <strong className="text-2xl">{totalChapas}</strong>
            </div>
            <ClipboardCheck size={28} />
          </div>
        </div>

        <div className="bg-red-50 border border-red-300 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-red-700">Atrasados</p>
              <strong className="text-2xl">{atrasados}</strong>
            </div>
            <TriangleAlert size={28} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <Button type="button" onClick={filtroHoje} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <CalendarDays size={16} />
          Hoje
        </Button>

        <Button type="button" onClick={filtroAmanha} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <CalendarDays size={16} />
          Amanhã
        </Button>

        <Button type="button" onClick={filtroProximos5Dias} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <CalendarDays size={16} />
          Próximos 5 dias
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Buscar pedido ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={carregarRelatorio}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Search size={18} />
              Buscar
            </Button>

            <Button
              variant=""
              type="button"
              onClick={limparFiltros}
              className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Eraser size={18} />
              Limpar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="border rounded-xl p-4">
    <h2 className="font-bold flex items-center gap-2 mb-3">
      <PackageCheck size={18} />
      Status dos Pedidos
      <span className="text-sm text-gray-500 font-normal">
        ({statusSelecionados.length} selecionado(s))
      </span>
    </h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {statusDisponiveis.map((status) => (
        <label
          key={status.valor}
          className={
            statusSelecionados.includes(status.valor)
              ? "flex items-center gap-2 border border-blue-300 bg-blue-50 rounded-lg px-3 py-2 text-sm cursor-pointer font-semibold text-blue-700"
              : "flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
          }
        >
          <input
            type="checkbox"
            checked={statusSelecionados.includes(status.valor)}
            onChange={() => alternarStatus(status.valor)}
          />
          {status.nome}
        </label>
      ))}
    </div>
  </div>

  <div className="border rounded-xl p-4 lg:col-span-2">
    <div className="flex justify-between items-center mb-3">
      <h2 className="font-bold flex items-center gap-2">
        <Route size={18} />
        Rotas de Entrega
        <span className="text-sm text-gray-500 font-normal">
          ({rotasSelecionadas.length} selecionada(s))
        </span>
      </h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={selecionarTodasRotas}
          className="text-sm text-blue-700 font-semibold"
        >
          Marcar todas
        </button>

        <button
          type="button"
          onClick={limparRotas}
          className="text-sm text-red-700 font-semibold"
        >
          Limpar
        </button>
      </div>
    </div>

    <div className="max-h-72 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {rotas.map((rota) => (
        <label
          key={rota.id}
          className={
            rotasSelecionadas.includes(rota.id)
              ? "flex items-center gap-2 border border-blue-300 bg-blue-50 rounded-lg px-3 py-2 text-sm cursor-pointer font-semibold text-blue-700"
              : "flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
          }
        >
          <input
            type="checkbox"
            checked={rotasSelecionadas.includes(rota.id)}
            onChange={() => alternarRota(rota.id)}
          />

          <span className="truncate" title={rota.nome}>
            {rota.nome}
          </span>
        </label>
      ))}
    </div>
  </div>
</div>




      </div>

      <CabecalhoImpressao
        empresa={empresa}
        titulo="Relatório de Entrega por Rotas"
        periodoInicio={dataInicio}
        periodoFim={dataFim}
      />

      <div className="print-area">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              Relatório de Entrega por Rotas
            </h2>

            <p className="text-gray-600">
              Período: {formatarData(dataInicio)} até {formatarData(dataFim)}
            </p>

            <p className="text-gray-600">
              Total: {totalPedidos} pedido(s) | {totalChapas} chapa(s)
            </p>
          </div>

          {Object.keys(pedidosPorRota).map((nomeRota) => {
            const pedidosDaRota = pedidosPorRota[nomeRota]

            const totalChapasRota = pedidosDaRota.reduce(
              (total, pedido) => total + obterQuantidadeChapas(pedido),
              0
            )

            return (
              <div key={nomeRota} className="mb-8 break-inside-avoid">
                <div className="bg-gray-800 text-white px-4 py-2 rounded-t-xl flex justify-between">
                  <strong>{nomeRota}</strong>

                  <span>
                    {pedidosDaRota.length} pedido(s) | {totalChapasRota} chapa(s)
                  </span>
                </div>

                <div className="border border-gray-300 rounded-b-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 border text-left">OK</th>
                        <th className="p-2 border text-left">Pedido</th>
                        <th className="p-2 border text-left">Cliente</th>
                        <th className="p-2 border text-left">Chapas</th>
                        <th className="p-2 border text-left">Prev. Entrega</th>
                        <th className="p-2 border text-left">Recebedor</th>
                        <th className="p-2 border text-left">Contato</th>
                        <th className="p-2 border text-left">Endereço</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pedidosDaRota.map((pedido) => (
                        <tr key={pedido.id}>
                          <td className="p-2 border text-center text-lg">□</td>
                          <td className="p-2 border font-bold">
                            {obterNumeroPedido(pedido)}
                          </td>
                          <td className="p-2 border">
                            {pedido.cliente?.nome || "-"}
                          </td>
                          <td className="p-2 border">
                            {obterQuantidadeChapas(pedido)}
                          </td>
                          <td className="p-2 border">
                            {formatarData(pedido.dataEntrega)}
                          </td>
                          <td className="p-2 border">
                            {pedido.nomeRecebedor || "-"}
                          </td>
                          <td className="p-2 border">
                            {pedido.contatoRecebedor || "-"}
                          </td>
                          <td className="p-2 border">
                            {pedido.enderecoEntrega || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 text-sm flex gap-6">
                  <span>Separado por: ____________________</span>
                  <span>Carregado por: ____________________</span>
                  <span>Motorista: ____________________</span>
                </div>
              </div>
            )
          })}

          {pedidos.length === 0 && (
            <div className="text-gray-600">
              Nenhum pedido concluído encontrado para as rotas selecionadas.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}