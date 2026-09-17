import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { BadgePrazo } from "../components/ui/BadgePrazo"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackState"

import {
  Download,
  Printer,
  CalendarDays,
  Search,
  Eraser,
  PackageCheck,
  DollarSign,
  UserCheck,
  CircleHelp
} from "lucide-react"

export function RelatorioPedidosEntregues() {
  const [pedidos, setPedidos] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [empresa, setEmpresa] = useState(null)

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [baseData, setBaseData] = useState("realizada")
  const [vendedorId, setVendedorId] = useState("")
  const [responsavelFrete, setResponsavelFrete] = useState("")
  const [busca, setBusca] = useState("")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [resumo, setResumo] = useState({
    total: 0,
    noPrazo: 0,
    comAtraso: 0,
    semRegistro: 0,
    semClassificacao: 0,
    valorTotal: 0
  })

  const [paginacao, setPaginacao] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1
  })

  const usuarioLogado = JSON.parse(localStorage.getItem("@usuario") || "{}")
  const isVendedor = usuarioLogado.funcao === "VENDEDOR"

  const podeExportarImprimir =
    usuarioLogado.funcao === "ADMIN" ||
    usuarioLogado.funcao === "VENDEDOR_OPERADOR"

  const podeVerValores = usuarioLogado.funcao === "ADMIN"

  function obterNumeroPedido(item) {
    if (item?.origemPedido === "EXTERNO" && item?.numeroPedidoManual) {
      return item.numeroPedidoManual
    }

    return `#${item?.numeroPedido}`
  }

  function formatarData(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-")

    return `${dia}/${mes}/${ano}`
  }

  function formatarMoeda(valor) {
    if (!valor) return "-"

    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  function formatarDataFiltro(data) {
    return data.toISOString().split("T")[0]
  }

  function obterClassePrazo(prazo) {
    if (prazo === "Entregue com atraso") return "bg-red-50"
    if (prazo === "Entregue no prazo") return "bg-green-50"
    return ""
  }

  async function carregarVendedores() {
    try {
      const response = await api.get("/funcionarios/vendedores")

      setVendedores(
        response.data.filter(
          (f) =>
            f.funcao === "VENDEDOR" ||
            f.funcao === "VENDEDOR_OPERADOR"
        )
      )
    } catch (error) {
      console.log(error)
    }
  }

  async function carregarRelatorio(pagina = page, filtros = {}) {
    setCarregando(true)
    try {
      const params = {
        dataInicio,
        dataFim,
        baseData,
        vendedorId,
        responsavelFrete,
        busca,
        page: pagina,
        limit,
        ...filtros
      }

      const relatorioResponse = await api.get("/relatorios/relatorio-pedidos-entregues", {
        params
      })

      setPedidos(relatorioResponse.data.dados)
      setPaginacao(relatorioResponse.data.paginacao)
      setResumo(relatorioResponse.data.resumo || {})
      setErro(false)
    } catch (error) {
      console.log(error)
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }

  async function carregarEmpresa() {
    if (!podeExportarImprimir) return setEmpresa(null)
    try {
      const response = await api.get("/configuracao-empresa")
      setEmpresa(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    carregarVendedores()
    carregarEmpresa()
    // Dados auxiliares são carregados uma única vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    carregarRelatorio(page)
    // A paginação reaplica os filtros selecionados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit])

  function buscar() {
    setPage(1)
    carregarRelatorio(1)
  }

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setBaseData("realizada")
    setVendedorId("")
    setBusca("")
    setResponsavelFrete("")
    setPage(1)

    carregarRelatorio(1, {
      dataInicio: "",
      dataFim: "",
      baseData: "realizada",
      vendedorId: "",
      responsavelFrete: "",
      busca: ""
    })
  }

  function filtroHoje() {
    const hoje = formatarDataFiltro(new Date())

    setDataInicio(hoje)
    setDataFim(hoje)
    setPage(1)

    carregarRelatorio(1, {
      dataInicio: hoje,
      dataFim: hoje
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
    setPage(1)

    carregarRelatorio(1, {
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
    setPage(1)

    carregarRelatorio(1, {
      dataInicio: dataInicioFiltro,
      dataFim: dataFimFiltro
    })
  }

  function imprimir() {
    window.print()
  }

  function nomeFrete(item) {
    return item.tipoEntrega === "CLIENTE_RETIRA" ? "Cliente retira" : item.responsavelFrete === "EMPRESA" ? "Frete Loja" : item.responsavelFrete === "CLIENTE" ? "Frete Cliente" : "Não informado"
  }

  function exportarCSV() {
    const cabecalho = [
      "Pedido",
      "Cliente",
      "Vendedor",
      "Data Pedido",
      "Previsao Entrega",
      "Entrega Realizada",
      "Endereco",
      "Responsavel Frete",
      "Status",
      "Prazo",
      "Valor"
    ]

    const linhas = pedidos.map((item) => [
      obterNumeroPedido(item),
      item.cliente?.nome || "",
      item.vendedor?.nome || "",
      formatarData(item.dataPedido),
      formatarData(item.dataEntrega),
      formatarData(item.dataEntregaReal),
      item.enderecoEntrega || item.cliente?.endereco || "",
      nomeFrete(item),
      item.status || "",
      item.situacaoPrazo || "",
      item.valorTotal || ""
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
    link.download = "relatorio-pedidos-entregues.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  const totalPedidos = resumo.total ?? paginacao.total
  const entreguesNoPrazo = resumo.noPrazo || 0
  const entreguesComAtraso = resumo.comAtraso || 0
  const valorTotalPedidos = resumo.valorTotal || 0

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 no-print">
        <h1 className="text-xl font-bold text-green-950">Pedidos entregues</h1>
        <p className="mt-1 text-sm text-green-800">Consulte o histórico de entregas realizadas e compare a data efetiva com a previsão.</p>
      </div>

      {podeExportarImprimir && (
        <div className="flex flex-wrap justify-end gap-2 no-print">
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={exportarCSV}
              variant="success"
              disabled={!pedidos.length}
            >
              <Download size={18} />
              Exportar página em CSV
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
          <strong>Modo consulta:</strong> você está visualizando somente pedidos já entregues. Valores, exportação e impressão ficam restritos aos perfis autorizados.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 no-print">
        <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Entregues</p>
              <strong className="text-3xl font-bold text-gray-800">
                {totalPedidos}
              </strong>
            </div>

            <PackageCheck size={30} className="text-green-500 shrink-0" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700">No Prazo</p>
              <strong className="text-3xl font-bold text-green-800">
                {entreguesNoPrazo}
              </strong>
            </div>

            <UserCheck size={30} className="text-green-500 shrink-0" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Com Atraso</p>
              <strong className="text-3xl font-bold text-red-800">
                {entreguesComAtraso}
              </strong>
            </div>

            <PackageCheck size={30} className="text-red-500 shrink-0" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700">Sem classificação</p>
              <strong className="text-3xl font-bold text-amber-800">{resumo.semClassificacao || 0}</strong>
            </div>
            <CircleHelp size={30} className="text-amber-500 shrink-0" />
          </div>
        </div>

        {podeVerValores && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Valor Entregue</p>
                <strong className="text-xl font-bold text-emerald-800">
                  {formatarMoeda(valorTotalPedidos)}
                </strong>
              </div>

              <DollarSign size={30} className="text-emerald-500 shrink-0" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 no-print" aria-label="Filtros rápidos">
        <Button
          type="button"
          onClick={filtroHoje}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Hoje
        </Button>

        <Button
          type="button"
          onClick={filtroSemana}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Esta Semana
        </Button>

        <Button
          type="button"
          onClick={filtroMes}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Este Mês
        </Button>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); buscar() }} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            aria-label="Base da data"
            value={baseData}
            onChange={(e) => setBaseData(e.target.value)}
          >
            <option value="realizada">Filtrar pela Entrega Realizada</option>
            <option value="entrega">Filtrar pela Previsão de Entrega</option>
            <option value="pedido">Filtrar por Data do Pedido</option>
          </Select>

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

          <Input
            type="text"
            placeholder="Buscar pedido, cliente ou vendedor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <Select
            aria-label="Vendedor"
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
          >
            <option value="">Todos os vendedores</option>

            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nome}
              </option>
            ))}
          </Select>

          <Select aria-label="Responsável pelo frete" value={responsavelFrete} onChange={e => setResponsavelFrete(e.target.value)}>
            <option value="">Todas as modalidades</option>
            <option value="EMPRESA">Frete Loja</option>
            <option value="CLIENTE">Frete Cliente</option>
            <option value="CLIENTE_RETIRA">Cliente retira</option>
          </Select>

          <Select
            aria-label="Registros por página"
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

          <div className="flex gap-4">
            <Button
              type="submit"
              loading={carregando}
            >
              <Search size={18} />
              Buscar
            </Button>

            <Button
              variant="dangerSoft"
              type="button"
              onClick={limparFiltros}
            >
              <Eraser size={18} />
              Limpar
            </Button>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-md p-6 print-area">
        <CabecalhoImpressao
          empresa={empresa}
          titulo="Relatório de Pedidos Entregues"
          periodoInicio={dataInicio}
          periodoFim={dataFim}
          extra={
            baseData === "pedido"
              ? "Base da data: Data do Pedido"
              : baseData === "entrega"
                ? "Base da data: Previsão de Entrega"
                : "Base da data: Entrega Realizada"
          }
        />

        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Pedidos Entregues
          </h2>

          <p className="text-gray-600">
            {paginacao.total} pedido{paginacao.total === 1 ? "" : "s"} entregue{paginacao.total === 1 ? "" : "s"} encontrado{paginacao.total === 1 ? "" : "s"}
          </p>
        </div>

        {carregando ? (
          <LoadingState mensagem="Carregando pedidos entregues..." />
        ) : erro ? (
          <ErrorState mensagem="Não foi possível carregar os pedidos entregues." onRetry={() => carregarRelatorio(page)} />
        ) : pedidos.length === 0 ? (
          <EmptyState titulo="Nenhum pedido entregue encontrado" descricao="Revise o período ou os demais filtros aplicados." />
        ) : (
          <>
        <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Cliente</Th>
              <Th>Vendedor</Th>
              <Th>Data Pedido</Th>
              <Th>Previsão</Th>
              <Th>Entregue em</Th>
              <Th>Endereço</Th>
              <Th>Frete</Th>
              <Th>Status</Th>
              <Th>Prazo</Th>
              {podeVerValores && <Th>Valor</Th>}
            </tr>
          </thead>

          <tbody>
            {pedidos.map((item) => (
              <tr
                key={item.id}
                className={obterClassePrazo(item.situacaoPrazo)}
              >
                <Td className="font-bold text-blue-700">
                  <Link
                    to={`/pedidos/${item.id}`}
                    className="hover:underline"
                  >
                    {obterNumeroPedido(item)}
                  </Link>
                </Td>

                <Td>{item.cliente?.nome}</Td>
                <Td>{item.vendedor?.nome}</Td>
                <Td>{formatarData(item.dataPedido)}</Td>
                <Td>{formatarData(item.dataEntrega)}</Td>
                <Td>{formatarData(item.dataEntregaReal)}</Td>

                <Td
                  className="max-w-[250px] truncate"
                  title={item.enderecoEntrega || item.cliente?.endereco || "-"}
                >
                  {item.enderecoEntrega || item.cliente?.endereco || "-"}
                </Td>

                <Td>
                  {nomeFrete(item)}
                </Td>
                <Td>
                  <BadgeStatus status={item.status} />
                </Td>

                <Td>
                  <BadgePrazo prazo={item.situacaoPrazo} />
                </Td>

                {podeVerValores && (
                  <Td className="font-semibold text-green-700">
                    {formatarMoeda(item.valorTotal)}
                  </Td>
                )}
              </tr>
            ))}

          </tbody>
        </Table>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <p className="text-sm text-gray-600">
            Página {paginacao.page} de {paginacao.totalPages}
          </p>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((paginaAtual) => paginaAtual - 1)}
            >
              Anterior
            </Button>

            <Button
              variant="secondary"
              disabled={page >= paginacao.totalPages}
              onClick={() => setPage((paginaAtual) => paginaAtual + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
