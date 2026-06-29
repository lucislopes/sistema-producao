import { useEffect, useState } from "react"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { BadgePrazo } from "../components/ui/BadgePrazo"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import { Link } from "react-router-dom"

import {
  Download,
  Printer,
  CalendarDays,
  Search,
  Eraser,
  ClipboardList,
  Package,
  Factory,
  PackageCheck,
  TriangleAlert,
  DollarSign,
  Filter
} from "lucide-react"

export function RelatorioPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [empresa, setEmpresa] = useState(null)

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [baseData, setBaseData] = useState("entrega")
  const [pedido, setPedido] = useState("")
  const [cliente, setCliente] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [status, setStatus] = useState("")

  const [busca, setBusca] = useState("")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

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

  const podeVerValores =
    usuarioLogado.funcao === "ADMIN"

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
    if (prazo === "ATRASADO" || prazo === "Atrasado") {
      return "bg-red-50"
    }

    if (prazo === "HOJE") {
      return "bg-yellow-50"
    }

    return ""
  }

  function exportarCSV() {
    const cabecalho = [
      "Pedido",
      "Cliente",
      "Vendedor",
      "Data Pedido",
      "Data Entrega",
      "Endereco",
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
      item.enderecoEntrega || item.cliente?.endereco || "",
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
    link.download = "relatorio-pedidos.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  async function carregarVendedores() {
  try {
    const response = await api.get("/funcionarios/vendedores")

    console.log(response.data)

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
    try {
      const params = {
        dataInicio,
        dataFim,
        baseData,
        pedido,
        cliente,
        vendedorId,
        status,
        busca,
        page: pagina,
        limit,
        ...filtros
      }

      const relatorioResponse = await api.get("/relatorio-pedidos", {
        params
      })

      setPedidos(relatorioResponse.data.dados)
      setPaginacao(relatorioResponse.data.paginacao)

      if (podeExportarImprimir) {
        const empresaResponse = await api.get("/configuracao-empresa")
        setEmpresa(empresaResponse.data)
      } else {
        setEmpresa(null)
      }
    } catch (error) {
      console.log(error)

      alert(
        error.response?.data?.error ||
        "Não foi possível carregar o relatório de pedidos no momento."
      )
    }
  }

  useEffect(() => {
    carregarVendedores()
    carregarRelatorio(1)
  }, [])

  useEffect(() => {
    carregarRelatorio(page)
  }, [page, limit])

  function buscar() {
    setPage(1)
    carregarRelatorio(1)
  }

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setBaseData("entrega")
    setPedido("")
    setCliente("")
    setVendedorId("")
    setStatus("")
    setPage(1)
    setBusca("")

    carregarRelatorio(1, {
      dataInicio: "",
      dataFim: "",
      baseData: "entrega",
      pedido: "",
      cliente: "",
      vendedorId: "",
      status: "",
      busca: ""
    })
  }

  function imprimir() {
    window.print()
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

  function filtroProximos5Dias() {
    const hoje = new Date()
    const fim = new Date()

    fim.setDate(fim.getDate() + 5)

    const dataInicioFiltro = formatarDataFiltro(hoje)
    const dataFimFiltro = formatarDataFiltro(fim)

    setDataInicio(dataInicioFiltro)
    setDataFim(dataFimFiltro)
    setPage(1)

    carregarRelatorio(1, {
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

  function filtroAtrasados() {
    setStatus("")
    setPage(1)

    carregarRelatorio(1)
  }

  function filtroStatusRapido(novoStatus) {
    setStatus(novoStatus)
    setPage(1)

    carregarRelatorio(1, {
      status: novoStatus
    })
  }

  const totalPedidos = paginacao.total

  const abertos = pedidos.filter(
    (p) => p.status === "ABERTO"
  ).length

  const emSeparacao = pedidos.filter(
    (p) => p.status === "EM_SEPARACAO"
  ).length

  const emProducao = pedidos.filter(
      p => p.status === "EM_PRODUCAO"
  ).length

  const atrasado = pedidos.filter(
    (p) => p.situacaoPrazo === "ATRASADO" || p.situacaoPrazo === "Atrasado"
  ).length

  const valorTotalPedidos = pedidos.reduce(
    (acc, item) => acc + Number(item.valorTotal || 0),
    0
  )

  return (
    <div>
      {podeExportarImprimir && (
      <div className="flex justify-between items-center mb-6 no-print">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={exportarCSV}
            className="bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Download size={18} />
            Exportar CSV
          </Button>

          <Button
            type="button"
            onClick={imprimir}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimir
          </Button>
        </div>
        </div>
      )}

      {isVendedor && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 no-print">
          <strong>Modo consulta:</strong> você está visualizando os pedidos para acompanhamento. Valores, exportação e impressão ficam restritos aos perfis autorizados.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6 no-print">

      <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pedidos</p>
              <strong className="text-3xl font-bold text-gray-800">
                {totalPedidos}
              </strong>
            </div>

            <ClipboardList size={30} className="text-gray-400 shrink-0" />
          </div>
        </div>

      <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">Abertos</p>
            <strong className="text-3xl font-bold text-gray-800">
              {abertos}
            </strong>
          </div>
          <ClipboardList size={30} className="text-gray-500 shrink-0" />
        </div>
      </div>

        

        <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">Em Separação</p>
              <strong className="text-3xl font-bold text-blue-800">
                {emSeparacao}
              </strong>
            </div>

            <Package size={30} className="text-blue-500 shrink-0" />
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-700">Em Produção</p>
              <strong className="text-3xl font-bold text-indigo-800">
                {emProducao}
              </strong>
            </div>

            <Factory size={30} className="text-indigo-500 shrink-0" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700">Atrasados</p>
              <strong className="text-3xl font-bold text-red-800">
                {atrasado}
              </strong>
            </div>

            <TriangleAlert
                size={30}
                className="text-red-500 shrink-0"
            />
          </div>
        </div>

        {podeVerValores && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Valor Exibido</p>
                <strong className="text-xl font-bold text-emerald-800">
                  {formatarMoeda(valorTotalPedidos)}
                </strong>
              </div>

              <DollarSign size={30} className="text-emerald-500 shrink-0" />
            </div>
          </div>
        )}
        </div>

      <div className="flex flex-wrap gap-2 mb-4 no-print">
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
          onClick={filtroProximos5Dias}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Próximos 5 Dias
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

        <div className="h-8 w-px bg-gray-300 mx-2" />

        <Button
          type="button"
          onClick={filtroAtrasados}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <TriangleAlert size={16} />
          Atrasados
        </Button>

      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={baseData}
            onChange={(e) => setBaseData(e.target.value)}
          >
            <option value="entrega">Filtrar por Data de Entrega</option>
            <option value="pedido">Filtrar por Data do Pedido</option>
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

          <Input
            type="text"
            placeholder="Buscar pedido ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <Select
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

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos em andamento</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_SEPARACAO">Em Separação</option>
            <option value="EM_PRODUCAO">Em Produção</option>
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

          <div className="flex gap-4">
            <Button
              variant="Primary"
              onClick={buscar}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
            >
              <Search size={18} />
              Buscar
            </Button>

            <Button
              variant=""
              onClick={limparFiltros}
              className="bg-red-50 text-red-700 border border-red-200 px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100"
            >
              <Eraser size={18} />
              Limpar
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 print-area">
        <CabecalhoImpressao
          empresa={empresa}
          titulo="Relatório de Pedidos"
          periodoInicio={dataInicio}
          periodoFim={dataFim}
          extra={
            status
              ? `Status filtrado: ${status}`
              : baseData === "pedido"
                ? "Base da data: Data do Pedido"
                : "Base da data: Data de Entrega"
          }
        />

        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Listagem de Pedidos
          </h2>

          <p className="text-gray-600">
            {paginacao.total} pedido{paginacao.total === 1 ? "" : "s"} encontrado{paginacao.total === 1 ? "" : "s"}
          </p>
        </div>

        <Table>
          <thead>
            <tr>
              <Th className="uppercase text-xs tracking-wide">Pedido</Th>
              <Th>Cliente</Th>
              <Th>Vendedor</Th>
              <Th>Data Pedido</Th>
              <Th>Data Entrega</Th>
              <Th>Endereço</Th>
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

                <Td
                  className="max-w-[250px] truncate"
                  title={item.enderecoEntrega || item.cliente?.endereco || "-"}
                >
                  {item.enderecoEntrega || item.cliente?.endereco || "-"}
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

            {pedidos.length === 0 && (
              <tr>
                <Td className="p-4 border" colSpan={podeVerValores ? "9" : "8"}>
                  Nenhum pedido encontrado.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>

        <div className="flex justify-between items-center mt-4 no-print">
          <p className="text-sm text-gray-600">
            Página {paginacao.page} de {paginacao.totalPages}
          </p>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>

            <Button
              variant="secondary"
              disabled={page >= paginacao.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}