import { useEffect, useMemo, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cog,
  Download,
  Eraser,
  FileSpreadsheet,
  Package,
  Ruler,
  Search,
  Trophy,
  Users
} from "lucide-react"

export function RelatorioConsumoChapas() {
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)

  const [porVendedor, setPorVendedor] = useState([])
  const [porOperador, setPorOperador] = useState([])
  const [porDia, setPorDia] = useState([])
  const [porTipoServico, setPorTipoServico] = useState([])

  const [vendedores, setVendedores] = useState([])
  const [clientes, setClientes] = useState([])

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [clienteId, setClienteId] = useState("")
  const [tipoPedido, setTipoPedido] = useState("")
  const [baseData, setBaseData] = useState("pedido")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [loading, setLoading] = useState(false)

  const [paginacao, setPaginacao] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1
  })

  const maiorVendedor = useMemo(() => {
    return porVendedor.length > 0 ? porVendedor[0] : null
  }, [porVendedor])

  const maiorOperador = useMemo(() => {
    return porOperador.length > 0 ? porOperador[0] : null
  }, [porOperador])

  const maiorDia = useMemo(() => {
    if (porDia.length === 0) return null

    return [...porDia].sort(
      (a, b) => Number(b.chapas || 0) - Number(a.chapas || 0)
    )[0]
  }, [porDia])

  const maiorServico = useMemo(() => {
    return porTipoServico.length > 0 ? porTipoServico[0] : null
  }, [porTipoServico])

  function numero(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      maximumFractionDigits: 2
    })
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
    if (pedido.origemPedido === "EXTERNO" && pedido.numeroPedidoManual) {
      return pedido.numeroPedidoManual
    }

    return `#${pedido.numeroPedido}`
  }

  function tipoPedidoTexto(tipo) {
    if (tipo === "DIRETO_ENTREGA") return "Chapa Inteira"
    if (tipo === "COM_PRODUCAO") return "Produção"
    return tipo || "-"
  }

  function statusTexto(status) {
    const mapa = {
      ABERTO: "Aberto",
      EM_PRODUCAO: "Em produção",
      PRONTO_ENTREGA: "Pronto entrega",
      SAIU_ENTREGA: "Saiu entrega",
      ENTREGUE: "Entregue",
      CANCELADO: "Cancelado"
    }

    return mapa[status] || status || "-"
  }

  async function carregarAuxiliares() {
    try {
      const [vendedoresRes, clientesRes] = await Promise.all([
        api.get("/funcionarios/vendedores"),
        api.get("/clientes")
      ])

      setVendedores(vendedoresRes.data || [])
      setClientes(clientesRes.data || [])
    } catch (error) {
      console.log(error)
    }
  }

  async function carregarRelatorio(pagina = 1, filtros = {}) {
    try {
      setLoading(true)

      const params = {
        dataInicio,
        dataFim,
        vendedorId,
        clienteId,
        tipoPedido,
        baseData,
        page: pagina,
        limit,
        ...filtros
      }

      const response = await api.get("/relatorio-consumo-chapas", { params })

      setDados(response.data.dados || [])
      setResumo(response.data.resumo || null)
      setPorVendedor(response.data.porVendedor || [])
      setPorOperador(response.data.porOperador || [])
      setPorDia(response.data.porDia || [])
      setPorTipoServico(response.data.porTipoServico || [])

      setPaginacao(
        response.data.paginacao || {
          total: 0,
          page: 1,
          limit,
          totalPages: 1
        }
      )
    } catch (error) {
      console.log(error)
      alert(
        error.response?.data?.error ||
          "Erro ao carregar relatório de consumo de chapas."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarAuxiliares()
    carregarRelatorio(1)
  }, [])

  useEffect(() => {
    carregarRelatorio(page)
  }, [page, limit])

  function buscar() {
    setPage(1)
    carregarRelatorio(1)
  }

  function alterarBaseData(valor) {
    setBaseData(valor)
    setPage(1)

    carregarRelatorio(1, {
      baseData: valor
    })
  }

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setBaseData("pedido")
    setVendedorId("")
    setClienteId("")
    setTipoPedido("")
    setPage(1)

    carregarRelatorio(1, {
      dataInicio: "",
      dataFim: "",
      vendedorId: "",
      clienteId: "",
      tipoPedido: "",
      baseData: "pedido"
    })
  }

  function aplicarPeriodo(tipo) {
    const hoje = new Date()
    let inicio = new Date(hoje)
    let fim = new Date(hoje)

    if (tipo === "semana") {
      inicio = new Date(hoje)
      inicio.setDate(hoje.getDate() - hoje.getDay())

      fim = new Date(inicio)
      fim.setDate(inicio.getDate() + 6)
    }

    if (tipo === "mes") {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    }

    if (tipo === "trimestre") {
      const trimestre = Math.floor(hoje.getMonth() / 3)
      inicio = new Date(hoje.getFullYear(), trimestre * 3, 1)
      fim = new Date(hoje.getFullYear(), trimestre * 3 + 3, 0)
    }

    if (tipo === "ano") {
      inicio = new Date(hoje.getFullYear(), 0, 1)
      fim = new Date(hoje.getFullYear(), 11, 31)
    }

    const inicioTexto = formatarDataFiltro(inicio)
    const fimTexto = formatarDataFiltro(fim)

    setDataInicio(inicioTexto)
    setDataFim(fimTexto)
    setPage(1)

    carregarRelatorio(1, {
      dataInicio: inicioTexto,
      dataFim: fimTexto,
      baseData
    })
  }

  function exportarCSV() {
    const cabecalho = [
      "Pedido",
      "Cliente",
      "Vendedor",
      "Tipo",
      "Data Pedido",
      "Data Entrega",
      "Status",
      "Chapas"
    ]

    const linhas = dados.map((item) => [
      obterNumeroPedido(item),
      item.cliente?.nome || "",
      item.vendedor?.nome || "",
      tipoPedidoTexto(item.tipoPedido),
      formatarData(item.dataPedido),
      formatarData(item.dataEntrega),
      statusTexto(item.status),
      item.totalChapas || 0
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
    link.download = "relatorio-consumo-chapas.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Relatório de Consumo de Chapas
          </h1>

          <p className="text-sm text-gray-600 mt-1">
            Relatório gerencial por venda, produção, vendedor, operador e tipo de serviço.
          </p>
        </div>

        <Button
          type="button"
          onClick={exportarCSV}
          disabled={dados.length === 0}
          className="bg-green-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50"
        >
          <Download size={18} />
          Exportar CSV
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="flex flex-wrap gap-2 mb-5">
          <PeriodoButton label="Hoje" onClick={() => aplicarPeriodo("hoje")} />
          <PeriodoButton label="Semana" onClick={() => aplicarPeriodo("semana")} />
          <PeriodoButton label="Mês" onClick={() => aplicarPeriodo("mes")} />
          <PeriodoButton label="Trimestre" onClick={() => aplicarPeriodo("trimestre")} />
          <PeriodoButton label="Ano" onClick={() => aplicarPeriodo("ano")} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-3">
          <Select
            value={baseData}
            onChange={(e) => alterarBaseData(e.target.value)}
          >
            <option value="pedido">Data da venda/pedido</option>
            <option value="producao">Data da produção/serviço</option>
          </Select>

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

          <Select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
            <option value="">Todos os vendedores</option>
            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nome}
              </option>
            ))}
          </Select>

          <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Todos os clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </Select>

          <Select value={tipoPedido} onChange={(e) => setTipoPedido(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="COM_PRODUCAO">Produção</option>
            <option value="DIRETO_ENTREGA">Chapa Inteira</option>
          </Select>

          <Select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
          >
            <option value={25}>25 registros</option>
            <option value={50}>50 registros</option>
            <option value={100}>100 registros</option>
          </Select>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={buscar}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 w-full"
            >
              <Search size={18} />
              Buscar
            </Button>

            <Button
              type="button"
              onClick={limparFiltros}
              className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl flex items-center justify-center"
            >
              <Eraser size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <Card titulo="Total Chapas" valor={resumo?.totalChapas} icon={Package} destaque />
        <Card titulo="Produção" valor={resumo?.totalProducao} icon={FileSpreadsheet} />
        <Card titulo="Chapa Inteira" valor={resumo?.totalChapaInteira} icon={Package} />
        <Card titulo="Pedidos" valor={resumo?.totalPedidos} icon={BarChart3} />
        <Card titulo="Clientes" valor={resumo?.clientesAtendidos} icon={Users} />
        <Card titulo="Média/Pedido" valor={resumo?.mediaPorPedido} icon={Trophy} decimal />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {baseData === "pedido" && (
          <InsightCard
            titulo="Vendedor destaque"
            valor={maiorVendedor?.nome || "-"}
            detalhe={`${numero(maiorVendedor?.chapas)} chapas`}
            icon={Trophy}
          />
        )}

        {baseData === "producao" && (
          <InsightCard
            titulo="Operador destaque"
            valor={maiorOperador?.nome || "-"}
            detalhe={`${numero(maiorOperador?.chapas)} chapas`}
            icon={Trophy}
          />
        )}

        <InsightCard
          titulo={baseData === "producao" ? "Dia de maior produção" : "Dia de maior consumo"}
          valor={maiorDia ? formatarData(maiorDia.data) : "-"}
          detalhe={`${numero(maiorDia?.chapas)} chapas`}
          icon={CalendarDays}
        />

        <InsightCard
          titulo="Serviço mais consumido"
          valor={maiorServico?.nome || "-"}
          detalhe={`${numero(maiorServico?.chapas)} chapas`}
          icon={Cog}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {baseData === "pedido" && (
          <RankingCard
            titulo="Ranking de Chapas por Vendedor"
            subtitulo="Baseado na data da venda/pedido."
            dados={porVendedor}
            campoNome="nome"
            campoValor="chapas"
          />
        )}

        {baseData === "producao" && (
          <RankingCard
            titulo="Ranking de Produção por Operador"
            subtitulo="Baseado nos serviços concluídos por operador."
            dados={porOperador}
            campoNome="nome"
            campoValor="chapas"
          />
        )}

        {baseData === "producao" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Produção por Operador
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Serviços concluídos, chapas produzidas e metros de encabeçamento por operador.
            </p>

            <Table>
              <thead>
                <tr>
                  <Th>Operador</Th>
                  <Th>Serviços</Th>
                  <Th>Chapas</Th>
                  <Th>Metros Encabeçamento</Th>
                </tr>
              </thead>

              <tbody>
                {porOperador.map((item) => (
                  <tr key={item.operadorId}>
                    <Td className="font-semibold text-gray-800">
                      {item.nome}
                    </Td>
                    <Td>{numero(item.quantidadeServicos)}</Td>
                    <Td className="font-bold text-blue-700">
                      {numero(item.chapas)}
                    </Td>
                    <Td>{numero(item.metrosEncabecamento)}</Td>
                  </tr>
                ))}

                {porOperador.length === 0 && (
                  <tr>
                    <Td colSpan="4">
                      Nenhuma produção por operador encontrada. Verifique se existem serviços concluídos com operador vinculado.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {baseData === "pedido" && (
        <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl p-4 text-sm">
          Esta visão mostra o ranking por vendedor. Para ver produção por operador, altere para{" "}
          <strong>Data da produção/serviço</strong>.
        </div>
      )}

      {baseData === "producao" && porOperador.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm">
          A tela está em produção, mas nenhum operador veio da API. Se houver serviços concluídos no período,
          verifique no backend se os serviços possuem <strong>operadorId</strong>.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Consumo por Tipo de Serviço
            </h2>

            <p className="text-sm text-gray-500">
              Serviços concluídos e volume de chapas por tipo.
            </p>
          </div>

          <div className="hidden md:flex gap-3">
            <MiniTotal label="Serviços" valor={resumo?.totalServicosConcluidos} icon={Cog} />
            <MiniTotal label="Metros" valor={resumo?.totalMetrosEncabecamento} icon={Ruler} />
          </div>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Serviço</Th>
              <Th>Qtd. Serviços</Th>
              <Th>Chapas</Th>
              <Th>Metros Encabeçamento</Th>
            </tr>
          </thead>

          <tbody>
            {porTipoServico.map((item) => (
              <tr key={item.tipoServicoId}>
                <Td className="font-semibold text-gray-800">
                  {item.nome}
                </Td>
                <Td>{numero(item.quantidadeServicos)}</Td>
                <Td className="font-bold text-blue-700">
                  {numero(item.chapas)}
                </Td>
                <Td>{numero(item.metrosEncabecamento)}</Td>
              </tr>
            ))}

            {porTipoServico.length === 0 && (
              <tr>
                <Td colSpan="4">
                  Nenhum serviço concluído encontrado no período.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Listagem Detalhada
            </h2>

            <p className="text-sm text-gray-500">
              {loading
                ? "Carregando..."
                : `${numero(paginacao.total)} registro(s) encontrado(s).`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Pedido</Th>
                <Th>Cliente</Th>
                <Th>Vendedor</Th>
                <Th>Tipo</Th>
                <Th>Data Pedido</Th>
                <Th>Data Entrega</Th>
                <Th>Status</Th>
                <Th>Chapas</Th>
              </tr>
            </thead>

            <tbody>
              {dados.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <Td className="font-bold text-blue-700">
                    {obterNumeroPedido(item)}
                  </Td>

                  <Td>{item.cliente?.nome || "-"}</Td>
                  <Td>{item.vendedor?.nome || "-"}</Td>

                  <Td>
                    <TipoBadge
                      tipo={item.tipoPedido}
                      texto={tipoPedidoTexto(item.tipoPedido)}
                    />
                  </Td>

                  <Td>{formatarData(item.dataPedido)}</Td>
                  <Td>{formatarData(item.dataEntrega)}</Td>

                  <Td>
                    <StatusBadge
                      status={item.status}
                      texto={statusTexto(item.status)}
                    />
                  </Td>

                  <Td className="font-bold text-gray-900">
                    {numero(item.totalChapas)}
                  </Td>
                </tr>
              ))}

              {dados.length === 0 && (
                <tr>
                  <Td colSpan="8">
                    {loading
                      ? "Carregando relatório..."
                      : "Nenhum consumo encontrado para os filtros selecionados."}
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-5">
          <p className="text-sm text-gray-600">
            Página {paginacao.page || 1} de {paginacao.totalPages || 1} — Total:{" "}
            {numero(paginacao.total)}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>

            <Button
              type="button"
              disabled={page >= paginacao.totalPages || loading}
              onClick={() => setPage(page + 1)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              Próxima
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PeriodoButton({ label, onClick }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-100"
    >
      <CalendarDays size={16} />
      {label}
    </Button>
  )
}

function Card({ titulo, valor, icon: Icon, destaque = false, decimal = false }) {
  const numero = Number(valor || 0)

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm border ${
        destaque
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm ${destaque ? "text-blue-100" : "text-gray-500"}`}>
            {titulo}
          </p>

          <strong className="text-3xl font-bold">
            {decimal
              ? numero.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
              : numero.toLocaleString("pt-BR")}
          </strong>
        </div>

        {Icon && (
          <div
            className={`p-3 rounded-xl ${
              destaque ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"
            }`}
          >
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  )
}

function InsightCard({ titulo, valor, detalhe, icon: Icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="bg-amber-50 text-amber-700 p-3 rounded-xl">
          <Icon size={24} />
        </div>

        <div>
          <p className="text-sm text-gray-500">{titulo}</p>

          <strong className="text-lg text-gray-900">
            {valor}
          </strong>

          <p className="text-sm text-gray-600">
            {detalhe}
          </p>
        </div>
      </div>
    </div>
  )
}

function MiniTotal({ label, valor, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
      <Icon size={18} className="text-blue-700" />

      <div>
        <p className="text-xs text-gray-500">{label}</p>

        <strong className="text-sm text-gray-900">
          {Number(valor || 0).toLocaleString("pt-BR")}
        </strong>
      </div>
    </div>
  )
}

function RankingCard({ titulo, subtitulo, dados, campoNome, campoValor }) {
  const maiorValor = Math.max(
    ...dados.map((item) => Number(item[campoValor] || 0)),
    0
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        {titulo}
      </h2>

      <p className="text-sm text-gray-500 mb-4">
        {subtitulo || "Comparativo visual por volume de chapas."}
      </p>

      <div className="space-y-3">
        {dados.slice(0, 10).map((item, index) => {
          const valor = Number(item[campoValor] || 0)
          const largura =
            maiorValor > 0 ? Math.max((valor / maiorValor) * 100, 4) : 0

          return (
            <div key={item.operadorId || item.nome || index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {index + 1}. {item[campoNome]}
                </span>

                <strong className="text-gray-900">
                  {valor.toLocaleString("pt-BR")}
                </strong>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${largura}%` }}
                />
              </div>
            </div>
          )
        })}

        {dados.length === 0 && (
          <p className="text-sm text-gray-500">
            Nenhum dado encontrado.
          </p>
        )}
      </div>
    </div>
  )
}

function TipoBadge({ tipo, texto }) {
  const classe =
    tipo === "DIRETO_ENTREGA"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-blue-50 text-blue-700 border-blue-200"

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${classe}`}
    >
      {texto}
    </span>
  )
}

function StatusBadge({ status, texto }) {
  const classes = {
    ABERTO: "bg-gray-50 text-gray-700 border-gray-200",
    EM_PRODUCAO: "bg-yellow-50 text-yellow-700 border-yellow-200",
    PRONTO_ENTREGA: "bg-blue-50 text-blue-700 border-blue-200",
    SAIU_ENTREGA: "bg-purple-50 text-purple-700 border-purple-200",
    ENTREGUE: "bg-green-50 text-green-700 border-green-200",
    CANCELADO: "bg-red-50 text-red-700 border-red-200"
  }

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
        classes[status] || "bg-gray-50 text-gray-700 border-gray-200"
      }`}
    >
      {texto}
    </span>
  )
}