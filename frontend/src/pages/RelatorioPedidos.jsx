import { useEffect, useState } from "react"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th } from "../components/ui/Table"
import { BadgePrazo } from "../components/ui/BadgePrazo"
import { BadgeStatus } from "../components/ui/BadgeStatus"

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
  Truck,
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
  const [pedido, setPedido] = useState("")
  const [cliente, setCliente] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [status, setStatus] = useState("")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  const [paginacao, setPaginacao] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1
  })

  function obterNumeroPedido(item) {
    if (
      item?.origemPedido === "EXTERNO" &&
      item?.numeroPedidoManual
    ) {
      return item.numeroPedidoManual
    }

    return `#${item?.numeroPedido}`
  }

  function exportarCSV() {
    const cabecalho = [
      "Pedido",
      "Cliente",
      "Vendedor",
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
      formatarData(item.dataEntrega),
      item.enderecoEntrega || item.cliente?.endereco || "",
      item.status || "",
      item.situacaoPrazo || "",
      item.valorTotal || ""
    ])

    const csv = [
      cabecalho,
      ...linhas
    ]
      .map((linha) =>
        linha
          .map((campo) =>
            `"${String(campo).replace(/"/g, '""')}"`
          )
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

  function obterClassePrazo(prazo) {
    if (prazo === "ATRASADO") {
      return "bg-red-50"
    }

    if (prazo === "HOJE") {
      return "bg-yellow-50"
    }

    return ""
  }

  async function carregarVendedores() {
    try {
      const response = await api.get("/funcionarios/operadores")

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
        pedido,
        cliente,
        vendedorId,
        status,
        page: pagina,
        limit,
        ...filtros
      }

      const [relatorioResponse, empresaResponse] = await Promise.all([
        api.get("/relatorio-pedidos", { params }),
        api.get("/configuracao-empresa")
      ])

      setPedidos(relatorioResponse.data.dados)
      setPaginacao(relatorioResponse.data.paginacao)
      setEmpresa(empresaResponse.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar relatório de pedidos")
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
    setPedido("")
    setCliente("")
    setVendedorId("")
    setStatus("")
    setPage(1)
  }

  function imprimir() {
    window.print()
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

  function filtroStatusRapido(novoStatus) {
    setStatus(novoStatus)
    setPage(1)

    carregarRelatorio(1, {
      status: novoStatus
    })
  }

  const totalPedidos = pedidos.length

  const emSeparacao = pedidos.filter(
    (p) => p.status === "EM_SEPARACAO"
  ).length

  const emProducao = pedidos.filter(
    (p) => p.status === "EM_PRODUCAO"
  ).length

  const prontoEntrega = pedidos.filter(
    (p) => p.status === "PRONTO_ENTREGA"
  ).length

  const saiuEntrega = pedidos.filter(
    (p) => p.status === "SAIU_ENTREGA"
  ).length

  const atrasados = pedidos.filter(
    (p) => p.situacaoPrazo === "ATRASADO"
  ).length

  const valorTotalPedidos = pedidos.reduce(
    (acc, item) => acc + Number(item.valorTotal || 0),
    0
  )

  return (
    <div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-6 no-print">

  <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Total Pedidos</p>
        <strong className="text-3xl font-bold text-gray-800">
          {totalPedidos}
        </strong>
      </div>

      <ClipboardList
        size={30}
        className="text-gray-400 shrink-0"
      />
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

      <Package
        size={30}
        className="text-blue-500 shrink-0"
      />
    </div>
  </div>

  <div className="bg-sky-50 border border-sky-300 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-sky-700">Em Produção</p>
        <strong className="text-3xl font-bold text-sky-800">
          {emProducao}
        </strong>
      </div>

      <Factory
        size={30}
        className="text-sky-500 shrink-0"
      />
    </div>
  </div>

  <div className="bg-green-50 border border-green-300 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-green-700">Pronto Entrega</p>
        <strong className="text-3xl font-bold text-green-800">
          {prontoEntrega}
        </strong>
      </div>

      <PackageCheck
        size={30}
        className="text-green-500 shrink-0"
      />
    </div>
  </div>

  <div className="bg-indigo-50 border border-indigo-300 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-indigo-700">Saiu Entrega</p>
        <strong className="text-3xl font-bold text-indigo-800">
          {saiuEntrega}
        </strong>
      </div>

      <Truck
        size={30}
        className="text-indigo-500 shrink-0"
      />
    </div>
  </div>

  <div className="bg-red-50 border border-red-300 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-red-700">Atrasados</p>
        <strong className="text-3xl font-bold text-red-800">
          {atrasados}
        </strong>
      </div>

      <TriangleAlert
        size={30}
        className="text-red-500 shrink-0"
      />
    </div>
  </div>

  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-emerald-700">Valor Exibido</p>
        <strong className="text-xl font-bold text-emerald-800">
          {formatarMoeda(valorTotalPedidos)}
        </strong>
      </div>

      <DollarSign
        size={30}
        className="text-emerald-500 shrink-0"
      />
    </div>
  </div>

</div>

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <Button
          type="button"
          onClick={filtroHoje}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          <span>Hoje</span>
        </Button>

        <Button
          type="button"
          onClick={filtroProximos5Dias}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          <span>Próximos 5 Dias</span>
        </Button>

        <Button
          type="button"
          onClick={filtroSemana}
          className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          <span>Esta Semana</span>
        </Button>

        <Button
          type="button"
          onClick={filtroMes}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          <span>Este Mês</span>
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("EM_PRODUCAO")}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Filter size={16} />
          <span>Em Produção</span>
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("PRONTO_ENTREGA")}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Filter size={16} />
          <span>Pronto Entrega</span>
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("SAIU_ENTREGA")}
          className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Filter size={16} />
          <span>Saiu Entrega</span>
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("ENTREGUE")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Filter size={16} />
          <span>Entregues</span>
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("CANCELADO")}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Filter size={16} />
          <span>Cancelados</span>
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            placeholder="Número pedido"
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
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
            <option value="">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_SEPARACAO">Em Separação</option>
            <option value="EM_PRODUCAO">Em Produção</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="PRONTO_ENTREGA">Pronto Entrega</option>
            <option value="SAIU_ENTREGA">Saiu Entrega</option>
            <option value="ENTREGUE">Entregue</option>
            <option value="CANCELADO">Cancelado</option>
          </Select>

          <Select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
          >
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </Select>
          <div className="flex grid-cols-1 md:grid-cols-3 gap-4" >
            <Button variant="Primary" onClick={buscar} className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2">
             <Search size={18} /> Buscar
            </Button> 

            <Button variant="secondary" onClick={limparFiltros} className="bg-gray-500 text-white px-6 py-3 rounded-lg flex items-center gap-2">
              <Eraser size={18} />Limpar
            </Button>
          </div>
        </div>
        
        
        </div>

        

      <CabecalhoImpressao
        empresa={empresa}
        titulo="Relatório de Pedidos"
        periodoInicio={dataInicio}
        periodoFim={dataFim}
        extra={
          status
            ? `Status filtrado: ${status}`
            : ""
        }
      />

      <div className="bg-white rounded-2xl shadow-md p-6 print-area">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Listagem de Pedidos
          </h2>

          <p className="text-gray-600">
            Total encontrado: {paginacao.total}
          </p>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Cliente</Th>
              <Th>Vendedor</Th>
              <Th>Data Entrega</Th>
              <Th>Endereço</Th>
              <Th>Status</Th>
              <Th>Prazo</Th>
              <Th>Valor</Th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((item) => (
              <tr
                key={item.id}
                className={obterClassePrazo(item.situacaoPrazo)}
              >
                <td className="p-3 border font-bold">
                  {obterNumeroPedido(item)}
                </td>

                <td className="p-3 border">
                  {item.cliente?.nome}
                </td>

                <td className="p-3 border">
                  {item.vendedor?.nome}
                </td>

                <td className="p-3 border">
                  {formatarData(item.dataEntrega)}
                </td>

                <td className="p-3 border">
                  {item.enderecoEntrega || item.cliente?.endereco || "-"}
                </td>

                <td className="p-3 border">
                  <BadgeStatus status={item.status} />
                </td>

                <td className="p-3 border">
                  <BadgePrazo prazo={item.situacaoPrazo} />
                </td>

                <td className="p-3 border">
                  {formatarMoeda(item.valorTotal)}
                </td>
              </tr>
            ))}

            {pedidos.length === 0 && (
              <tr>
                <td className="p-4 border" colSpan="8">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        <div className="flex justify-between items-center mt-4 no-print">
          <p className="text-sm text-gray-600">
            Página {paginacao.page} de {paginacao.totalPages} — Total: {paginacao.total}
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
