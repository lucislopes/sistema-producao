import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { Button } from "../components/ui/Button"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackState"
import {
  Download,
  Printer,
  TriangleAlert,
  CalendarDays,
  PackageCheck,
  Search,
  Eraser,
  Eye,
  ClipboardList
} from "lucide-react"

function ResumoCard({ titulo, valor, tipo = "normal", icon: Icon }) {
  const classes = {
    normal: { card: "bg-white border-gray-200", icon: "bg-gray-100 text-gray-700" },
    perigo: { card: "bg-red-50 border-red-300", icon: "bg-red-100 text-red-700" },
    alerta: { card: "bg-yellow-50 border-yellow-300", icon: "bg-yellow-100 text-yellow-700" },
    sucesso: { card: "bg-green-50 border-green-300", icon: "bg-green-100 text-green-700" },
    info: { card: "bg-blue-50 border-blue-300", icon: "bg-blue-100 text-blue-700" }
  }
  const estilo = classes[tipo] || classes.normal

  return <div className={`rounded-xl border p-4 shadow-sm ${estilo.card}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-gray-600">{titulo}</p><strong className="mt-1 block text-2xl font-bold">{valor}</strong></div>{Icon && <div className={`rounded-xl p-3 ${estilo.icon}`}><Icon size={24} aria-hidden="true" /></div>}</div></div>
}

export function RelatorioExpedicao() {
  const [pedidos, setPedidos] = useState([])
  const [rotas, setRotas] = useState([])
  const [empresa, setEmpresa] = useState(null)

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [rotaId, setRotaId] = useState("")
  const [status, setStatus] = useState("")
  const [busca, setBusca] = useState("")
  const [incluirEntregues, setIncluirEntregues] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const filtrosAtuaisRef = useRef({})

  const usuarioLogado = JSON.parse(localStorage.getItem("@usuario") || "{}")
  const isVendedor = usuarioLogado.funcao === "VENDEDOR"
  const podeExportarImprimir =
    usuarioLogado.funcao === "ADMIN" ||
    usuarioLogado.funcao === "VENDEDOR_OPERADOR"

  async function carregarRotas() {
    try {
      const response = await api.get("/rotas-entrega")
      setRotas(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  async function carregarEmpresa() {
    if (!podeExportarImprimir) return setEmpresa(null)
    try { const response = await api.get("/configuracao-empresa"); setEmpresa(response.data) }
    catch (error) { console.log(error) }
  }

  async function carregarRelatorio(filtros = {}, silencioso = false) {
    if (!silencioso) setCarregando(true)
    try {
      const params = {
        dataInicio,
        dataFim,
        rotaId,
        status,
        busca,
        incluirEntregues,
        ...filtros
      }
      filtrosAtuaisRef.current = params

      const relatorioResponse = await api.get("/relatorio-expedicao", { params })

      setPedidos(relatorioResponse.data)
      setErro(false)
    } catch (error) {
      console.log(error)

      if (error.response?.status === 403) {
        setPedidos([])
        setErro(true)
        return
      }
      setErro(true)
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }

  useEffect(() => {
    carregarRotas()
    carregarEmpresa()
    carregarRelatorio()

    const interval = setInterval(() => {
      if (!document.hidden) carregarRelatorio(filtrosAtuaisRef.current, true)
    }, 30000)

    return () => clearInterval(interval)
    // A atualização usa filtrosAtuaisRef para preservar sempre a última consulta aplicada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function imprimir() {
    window.print()
  }

  function obterClasseLinha(dataEntrega) {
    if (!dataEntrega) return ""

    const hoje = formatarDataFiltro(new Date())
    const entrega = String(dataEntrega).substring(0, 10)

    if (entrega < hoje) {
      return "bg-red-50"
    }

    if (entrega === hoje) {
      return "bg-yellow-50"
    }

    return ""
  }

  function formatarDataFiltro(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")

    return `${ano}-${mes}-${dia}`
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

    function obterStatus(pedido) {
    if (
      pedido.status === "PRONTO_ENTREGA" &&
      pedido.tipoPedido === "DIRETO_ENTREGA"
    ) {
      return "Pronto Entrega - Chapa Inteira"
    }

    const statusMap = {
      ABERTO: "Aberto",
      EM_SEPARACAO: "Em Separação",
      EM_PRODUCAO: "Em Produção",
      CONCLUIDO: "Concluído",
      PRONTO_ENTREGA: "Pronto Entrega",
      SAIU_ENTREGA: "Saiu para Entrega",
      ENTREGUE: "Entregue"
    }

    return statusMap[pedido.status] || pedido.status
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

  function filtroHoje() {
    const hoje = formatarDataFiltro(new Date())

    setDataInicio(hoje)
    setDataFim(hoje)

    carregarRelatorio({
      dataInicio: hoje,
      dataFim: hoje
    })
  }

  function filtroAmanha() {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)

    const data = formatarDataFiltro(amanha)

    setDataInicio(data)
    setDataFim(data)

    carregarRelatorio({
      dataInicio: data,
      dataFim: data
    })
  }

  function filtroProximos5Dias() {
    const hoje = new Date()

    const fim = new Date()
    fim.setDate(fim.getDate() + 5)

    const dataInicioFiltro = formatarDataFiltro(hoje)
    const dataFimFiltro = formatarDataFiltro(fim)

    setDataInicio(dataInicioFiltro)
    setDataFim(dataFimFiltro)

    carregarRelatorio({
      dataInicio: dataInicioFiltro,
      dataFim: dataFimFiltro
    })
  }

  function filtroSemana() {
    const hoje = new Date()

    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - hoje.getDay())

    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)

    const dataInicioFiltro = formatarDataFiltro(inicio)
    const dataFimFiltro = formatarDataFiltro(fim)

    setDataInicio(dataInicioFiltro)
    setDataFim(dataFimFiltro)

    carregarRelatorio({
      dataInicio: dataInicioFiltro,
      dataFim: dataFimFiltro
    })
  }

  function filtroMes() {
    const hoje = new Date()

    const inicio = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      1
    )

    const fim = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      0
    )

    const dataInicioFiltro = formatarDataFiltro(inicio)
    const dataFimFiltro = formatarDataFiltro(fim)

    setDataInicio(dataInicioFiltro)
    setDataFim(dataFimFiltro)

    carregarRelatorio({
      dataInicio: dataInicioFiltro,
      dataFim: dataFimFiltro
    })
  }

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setRotaId("")
    setStatus("")
    setBusca("")
    setIncluirEntregues(false)

    carregarRelatorio({
      dataInicio: "",
      dataFim: "",
      rotaId: "",
      status: "",
      busca: "",
      incluirEntregues: false
    })
  }

  function exportarCSV() {
    const cabecalho = [
      "Pedido",
      "Cliente",
      "Data Prevista",
      "Chapas",
      "Rota",
      "Recebedor",
      "Contato",
      "Endereco",
      "Status"
    ]

    const linhas = pedidos.map((pedido) => [
      obterNumeroPedido(pedido),
      pedido.cliente?.nome || "",
      formatarData(pedido.dataEntrega),
      obterQuantidadeChapas(pedido),
      pedido.rota?.nome || "",
      pedido.nomeRecebedor || "",
      pedido.contatoRecebedor || "",
      pedido.enderecoEntrega || "",
      obterStatus(pedido)
    ])

    const csv = [cabecalho, ...linhas]
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n")

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = "relatorio-expedicao.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  const atrasados = pedidos.filter((pedido) => {
    if (!pedido.dataEntrega) return false

    const hoje = formatarDataFiltro(new Date())
    const entrega = String(pedido.dataEntrega).substring(0, 10)

    return entrega < hoje
  }).length

  const hojeQtd = pedidos.filter((pedido) => {
    if (!pedido.dataEntrega) return false

    const hoje = formatarDataFiltro(new Date())
    const entrega = String(pedido.dataEntrega).substring(0, 10)

    return entrega === hoje
  }).length

  const prontoEntrega = pedidos.filter(
    (pedido) => pedido.status === "PRONTO_ENTREGA"
  ).length

  function aplicarFiltros(event) {
    event.preventDefault()
    carregarRelatorio()
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 no-print">
        <h1 className="text-xl font-bold text-blue-950">Relatório de Expedição</h1>
        <p className="mt-1 text-sm text-blue-800">Consulte entregas da empresa, acompanhe prazos e organize a programação por rota.</p>
      </div>
      {podeExportarImprimir && (
      <div className="flex justify-between items-center no-print">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={exportarCSV}
            variant="success"
            disabled={!pedidos.length}
          >
            <Download size={18} />
            Exportar CSV
          </Button>

          <Button
            type="button"
            onClick={imprimir}
            variant="dark"
            disabled={!pedidos.length}
          >
            <Printer size={18} />
            Imprimir
          </Button>
        </div>
      </div>
    )}

    {isVendedor && (
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 no-print">
        <strong>Modo consulta:</strong> você está visualizando as entregas para acompanhamento. Alterações, exportações e impressões ficam restritas aos perfis autorizados.
      </div>
    )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 no-print">
        <ResumoCard titulo="Total de entregas" valor={pedidos.length} icon={ClipboardList} />
        <ResumoCard
          titulo="Atrasados"
          valor={atrasados}
          tipo={atrasados > 0 ? "perigo" : "normal"}
          icon={TriangleAlert}
        />

        <ResumoCard
          titulo="Hoje"
          valor={hojeQtd}
          tipo="alerta"
          icon={CalendarDays}
        />

        <ResumoCard
          titulo="Pronto Entrega"
          valor={prontoEntrega}
          tipo="sucesso"
          icon={PackageCheck}
        />
      </div>

      <div className="flex flex-wrap gap-2 no-print" aria-label="Filtros rápidos">
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

        <Button type="button" onClick={filtroSemana} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <CalendarDays size={16} />
          Esta semana
        </Button>

        <Button type="button" onClick={filtroMes} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <CalendarDays size={16} />
          Este mês
        </Button>
      </div>

      <form onSubmit={aplicarFiltros} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm no-print">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Input
            aria-label="Data inicial"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <Input
            aria-label="Data final"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <Select
            aria-label="Rota"
            value={rotaId}
            onChange={(e) => setRotaId(e.target.value)}
          >
            <option value="">Todas as rotas</option>

            {rotas.map((rota) => (
              <option key={rota.id} value={rota.id}>
                {rota.nome}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="PRONTO_ENTREGA">Pronto Entrega</option>
            {incluirEntregues && (
              <option value="ENTREGUE">Entregue</option>
            )}
          </Select>

          <Input
            type="text"
            placeholder="Buscar pedido ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={incluirEntregues} onChange={(e) => { setIncluirEntregues(e.target.checked); if (!e.target.checked && status === "ENTREGUE") setStatus("") }} className="h-4 w-4 rounded border-gray-300" />
            Incluir pedidos já entregues
          </label>

          <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            loading={carregando}
          >
            <Search size={18} />
            Buscar
          </Button>

          <Button
            type="button"
            onClick={limparFiltros}
            variant="dangerSoft"
          >
            <Eraser size={18} />
            Limpar
          </Button>
          </div>
        </div>
      </form>

      <CabecalhoImpressao
        empresa={empresa}
        titulo="Relatório de Expedição"
        periodoInicio={dataInicio}
        periodoFim={dataFim}
      />

      {carregando ? <LoadingState mensagem="Carregando relatório de expedição..." /> : erro ? <ErrorState onRetry={() => carregarRelatorio(filtrosAtuaisRef.current)} /> : <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm print-area">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Relatório de Expedição
          </h2>

          <p className="text-gray-600">
            Período: {dataInicio || dataFim ? `${formatarData(dataInicio)} até ${formatarData(dataFim)}` : "Todo o período"}
          </p>

          <p className="text-gray-600">
            {pedidos.length} entrega{pedidos.length === 1 ? "" : "s"} encontrada{pedidos.length === 1 ? "" : "s"}
          </p>
        </div>

        {pedidos.length === 0 ? <EmptyState titulo="Nenhuma entrega encontrada" descricao="Altere os filtros ou limpe a pesquisa para consultar outras entregas." /> : <Table label="Relatório de expedição">
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Cliente</Th>
              <Th>Prev. Entrega</Th>
              <Th>Chapas</Th>
              <Th>Rota</Th>
              <Th>Recebedor</Th>
              <Th>Contato</Th>
              <Th>Endereço</Th>
              <Th>Status</Th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((pedido) => (
              <tr
                key={pedido.id}
                className={obterClasseLinha(pedido.dataEntrega)}
              >
                <Td>
                  <Link to={`/pedidos/${pedido.id}`} className="inline-flex min-h-10 items-center gap-2 font-bold text-blue-700 hover:text-blue-900 hover:underline">
                    {obterNumeroPedido(pedido)} <Eye size={15} aria-hidden="true" />
                  </Link>
                </Td>

                <Td>
                  {pedido.cliente?.nome}
                </Td>

                <Td>
                  {formatarData(pedido.dataEntrega)}
                </Td>

                <Td>
                  {obterQuantidadeChapas(pedido)}
                </Td>

                <Td>
                  {pedido.rota?.nome || "-"}
                </Td>

                <Td>
                  {pedido.nomeRecebedor || "-"}
                </Td>

                <Td>
                  {pedido.contatoRecebedor || "-"}
                </Td>

                <Td
                  className="max-w-[280px] truncate"
                  title={pedido.enderecoEntrega || "-"}
                >
                  {pedido.enderecoEntrega || "-"}
                </Td>

                <Td>
                  {pedido.status === "PRONTO_ENTREGA" && pedido.tipoPedido === "DIRETO_ENTREGA"
                    ? <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">{obterStatus(pedido)}</span>
                    : <BadgeStatus status={pedido.status} />}
                </Td>
              </tr>
            ))}

          </tbody>
        </Table>}
        {pedidos.length > 0 && <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 no-print"><span><span className="mr-1 inline-block h-3 w-3 rounded-sm border border-red-200 bg-red-50" />Prazo vencido</span><span><span className="mr-1 inline-block h-3 w-3 rounded-sm border border-yellow-200 bg-yellow-50" />Entrega hoje</span></div>}
      </div>}
    </div>
  )
}
