import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import {
  CalendarDays,
  Download,
  Eraser,
  FileSpreadsheet,
  Package,
  Search,
  Users
} from "lucide-react"

export function RelatorioConsumoChapas() {
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porVendedor, setPorVendedor] = useState([])
  const [porDia, setPorDia] = useState([])

  const [vendedores, setVendedores] = useState([])
  const [clientes, setClientes] = useState([])

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [clienteId, setClienteId] = useState("")
  const [tipoPedido, setTipoPedido] = useState("")

    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(50)

    const [paginacao, setPaginacao] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1
    })
  

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

  async function carregarAuxiliares() {
    try {
      const [vendedoresRes, clientesRes] = await Promise.all([
        api.get("/funcionarios/vendedores"),
        api.get("/clientes")
      ])

      setVendedores(vendedoresRes.data)
      setClientes(clientesRes.data)
    } catch (error) {
      console.log(error)
    }
  }

  async function carregarRelatorio(pagina = page, filtros = {}) {
    try {
        const params = {
        dataInicio,
        dataFim,
        vendedorId,
        clienteId,
        tipoPedido,
        page: pagina,
        limit,
        ...filtros
        }

        const response = await api.get("/relatorio-consumo-chapas", {
        params
        })

        setDados(response.data.dados)
        setResumo(response.data.resumo)
        setPorVendedor(response.data.porVendedor)
        setPorDia(response.data.porDia)
        setPaginacao(response.data.paginacao)
    } catch (error) {
        console.log(error)
        alert(
        error.response?.data?.error ||
        "Erro ao carregar relatório de consumo de chapas."
        )
    }
    }

  useEffect(() => {
    carregarAuxiliares()
    carregarRelatorio()
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
    setVendedorId("")
    setClienteId("")
    setTipoPedido("")
    setPage(1)

    carregarRelatorio(1, {
      dataInicio: "",
      dataFim: "",
      vendedorId: "",
      clienteId: "",
      tipoPedido: ""
    })
  }

  function aplicarPeriodo(tipo) {
    const hoje = new Date()
    let inicio = new Date(hoje)
    let fim = new Date(hoje)

    if (tipo === "hoje") {
      inicio = new Date(hoje)
      fim = new Date(hoje)
    }

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

    carregarRelatorio({
      dataInicio: inicioTexto,
      dataFim: fimTexto
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
      item.status || "",
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Relatório de Consumo de Chapas
          </h1>

          <p className="text-sm text-gray-600">
            Acompanhe o total de chapas utilizadas por período, vendedor, cliente e tipo de pedido.
          </p>
        </div>

        <Button
          type="button"
          onClick={exportarCSV}
          className="bg-green-700 text-white px-5 py-3 rounded-lg flex items-center gap-2"
        >
          <Download size={18} />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total Chapas" valor={resumo?.totalChapas || 0} icon={Package} />
        <Card titulo="Produção" valor={resumo?.totalProducao || 0} icon={FileSpreadsheet} />
        <Card titulo="Chapa Inteira" valor={resumo?.totalChapaInteira || 0} icon={Package} />
        <Card titulo="Clientes" valor={resumo?.clientesAtendidos || 0} icon={Users} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={() => aplicarPeriodo("hoje")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
        <CalendarDays size={16} />
          Hoje
        </Button>

        <Button onClick={() => aplicarPeriodo("semana")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
        <CalendarDays size={16} />
          Semana
        </Button>

        <Button onClick={() => aplicarPeriodo("mes")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
        <CalendarDays size={16} />
          Mês
        </Button>

        <Button onClick={() => aplicarPeriodo("trimestre")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
        <CalendarDays size={16} />
          Trimestre
        </Button>

        <Button onClick={() => aplicarPeriodo("ano")} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
        <CalendarDays size={16} />
          Ano
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-4">
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
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          >
            <option value="">Todos os clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </Select>

          <Select
            value={tipoPedido}
            onChange={(e) => setTipoPedido(e.target.value)}
          >
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

          <Button
            type="button"
            onClick={buscar}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Search size={18} />
            Buscar
          </Button>

          <Button
            variant=""
            type="button"
            onClick={limparFiltros}
            className="bg-red-50 text-red-700 border border-red-200 px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100"
          >
            <Eraser size={18} />
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <ResumoLista
          titulo="Chapas por Vendedor"
          dados={porVendedor}
          campoNome="nome"
          campoValor="chapas"
        />

        <ResumoLista
          titulo="Chapas por Dia"
          dados={porDia.map((item) => ({
            ...item,
            dataFormatada: formatarData(item.data)
          }))}
          campoNome="dataFormatada"
          campoValor="chapas"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">
          Listagem de Consumo
        </h2>

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
              <tr key={item.id}>
                <Td className="font-bold text-blue-700">
                  {obterNumeroPedido(item)}
                </Td>
                <Td>{item.cliente?.nome || "-"}</Td>
                <Td>{item.vendedor?.nome || "-"}</Td>
                <Td>{tipoPedidoTexto(item.tipoPedido)}</Td>
                <Td>{formatarData(item.dataPedido)}</Td>
                <Td>{formatarData(item.dataEntrega)}</Td>
                <Td>{item.status}</Td>
                <Td className="font-bold">{item.totalChapas}</Td>
              </tr>
            ))}

            {dados.length === 0 && (
              <tr>
                <Td colSpan="8">
                  Nenhum consumo encontrado para o período.
                </Td>
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

function Card({ titulo, valor, icon: Icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {titulo}
          </p>

          <strong className="text-3xl font-bold text-gray-800">
            {Number(valor || 0).toLocaleString("pt-BR")}
          </strong>
        </div>

        {Icon && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl">
            <Icon size={26} />
          </div>
        )}
      </div>
    </div>
  )
}

function ResumoLista({ titulo, dados, campoNome, campoValor }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">
        {titulo}
      </h2>

      <div className="space-y-2">
        {dados.map((item, index) => (
          <div
            key={index}
            className="flex justify-between border-b border-gray-100 py-2 text-sm"
          >
            <span>{item[campoNome]}</span>
            <strong>{Number(item[campoValor] || 0).toLocaleString("pt-BR")}</strong>
          </div>
        ))}

        {dados.length === 0 && (
          <p className="text-sm text-gray-500">
            Nenhum dado encontrado.
          </p>
        )}
      </div>
    </div>
  )
}