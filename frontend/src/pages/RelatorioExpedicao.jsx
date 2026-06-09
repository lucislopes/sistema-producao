import { useEffect, useState } from "react"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th } from "../components/ui/Table"
import { Button } from "../components/ui/Button"
import {
  Download,
  Printer,
  TriangleAlert,
  CalendarDays,
  PackageCheck,
  Truck,
  Search,
  Eraser,
  MapPinned,
  Filter
} from "lucide-react"


export function RelatorioExpedicao() {
  const [pedidos, setPedidos] = useState([])
  const [rotas, setRotas] = useState([])
  const [empresa, setEmpresa] = useState(null)

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [rotaId, setRotaId] = useState("")
  const [status, setStatus] = useState("")
  const [busca, setBusca] = useState("")

  async function carregarRotas() {
    try {
      const response = await api.get("/rotas-entrega")
      setRotas(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  async function carregarRelatorio(filtros = {}) {
    try {
      const params = {
        dataInicio,
        dataFim,
        rotaId,
        status,
        busca,
        ...filtros
      }

      const [relatorioResponse, empresaResponse] = await Promise.all([
        api.get("/relatorio-expedicao", { params }),
        api.get("/configuracao-empresa")
      ])

      setPedidos(relatorioResponse.data)
      setEmpresa(empresaResponse.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar relatório")
    }
  }

  useEffect(() => {
    carregarRotas()
    carregarRelatorio()

    const interval = setInterval(() => {
      carregarRelatorio()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    carregarRelatorio()
  }, [dataInicio, dataFim, rotaId, status])

  function imprimir() {
    window.print()
  }

  function formatarData(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-")

    return `${dia}/${mes}/${ano}`
  }

  function formatarDataFiltro(data) {
    return data.toISOString().split("T")[0]
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

  function obterStatus(status) {
    const statusMap = {
      CONCLUIDO: "Concluído",
      PRONTO_ENTREGA: "Pronto Entrega",
      SAIU_ENTREGA: "Saiu Entrega",
      ENTREGUE: "Entregue"
    }

    return statusMap[status] || status
  }

  function obterClasseLinha(dataEntrega) {
    if (!dataEntrega) return ""

    const hojeData = new Date()
    hojeData.setHours(0, 0, 0, 0)

    const entrega = new Date(dataEntrega)
    entrega.setHours(0, 0, 0, 0)

    if (entrega < hojeData) {
      return "bg-red-50"
    }

    if (entrega.getTime() === hojeData.getTime()) {
      return "bg-yellow-50"
    }

    return ""
  }

  function ResumoCard({ titulo, valor, tipo = "normal", icon: Icon }) {
    const classes = {
      normal: {
        card: "bg-white border-gray-200",
        icon: "bg-gray-100 text-gray-700"
      },
      perigo: {
        card: "bg-red-50 border-red-300",
        icon: "bg-red-100 text-red-700"
      },
      alerta: {
        card: "bg-yellow-50 border-yellow-300",
        icon: "bg-yellow-100 text-yellow-700"
      },
      sucesso: {
        card: "bg-green-50 border-green-300",
        icon: "bg-green-100 text-green-700"
      },
      info: {
        card: "bg-blue-50 border-blue-300",
        icon: "bg-blue-100 text-blue-700"
      }
    }

    const estilo = classes[tipo] || classes.normal

    return (
      <div className={`rounded-xl shadow-sm border p-4 ${estilo.card}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">{titulo}</p>
            <strong className="text-2xl font-bold block mt-1">
              {valor}
            </strong>
          </div>

          {Icon && (
            <div className={`p-3 rounded-xl ${estilo.icon}`}>
              <Icon size={24} />
            </div>
          )}
        </div>
      </div>
    )
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
  }

  function exportarCSV() {
    const cabecalho = [
      "Pedido",
      "Cliente",
      "Data Prevista",
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
      pedido.rota?.nome || "",
      pedido.nomeRecebedor || "",
      pedido.contatoRecebedor || "",
      pedido.enderecoEntrega || "",
      obterStatus(pedido.status)
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

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const entrega = new Date(pedido.dataEntrega)
    entrega.setHours(0, 0, 0, 0)

    return entrega < hoje
  }).length

  const hojeQtd = pedidos.filter((pedido) => {
    if (!pedido.dataEntrega) return false

    const hoje = new Date().toISOString().split("T")[0]

    return String(pedido.dataEntrega).substring(0, 10) === hoje
  }).length

  const prontoEntrega = pedidos.filter(
    (pedido) => pedido.status === "PRONTO_ENTREGA"
  ).length

  const saiuEntrega = pedidos.filter(
    (pedido) => pedido.status === "SAIU_ENTREGA"
  ).length

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
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

        <ResumoCard
          titulo="Saiu Entrega"
          valor={saiuEntrega}
          tipo="info"
          icon={Truck}
        />
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

        <Button type="button" onClick={filtroProximos5Dias} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <CalendarDays size={16} />
          Próximos 5 dias
        </Button>

        <Button type="button" onClick={filtroSemana} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <CalendarDays size={16} />
          Esta semana
        </Button>

        <Button type="button" onClick={filtroMes} className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <CalendarDays size={16} />
          Este mês
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="PRONTO_ENTREGA">Pronto Entrega</option>
            <option value="SAIU_ENTREGA">Saiu Entrega</option>
          </Select>

          <Input
            type="text"
            placeholder="Buscar pedido ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          
          <Button
            type="button"
            onClick={() => carregarRelatorio()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Search size={18} />
            Buscar
          </Button>

          <Button
            type="button"
            onClick={limparFiltros}
            variant=""
            className="bg-red-50 text-red-700 border border-red-200 px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100"
          >
            <Eraser size={18} />
            Limpar
          </Button>
        </div>
      </div>

      <CabecalhoImpressao
        empresa={empresa}
        titulo="Relatório de Expedição"
        periodoInicio={dataInicio}
        periodoFim={dataFim}
      />

      <div className="bg-white rounded-2xl shadow-md p-6 print-area">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Relatório de Expedição
          </h2>

          <p className="text-gray-600">
            Período: {formatarData(dataInicio)} até {formatarData(dataFim)}
          </p>

          <p className="text-gray-600">
            Total de entregas: {pedidos.length}
          </p>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Cliente</Th>
              <Th>Prev. Entrega</Th>
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
                <td className="p-3 border font-bold">
                  {obterNumeroPedido(pedido)}
                </td>

                <td className="p-3 border">
                  {pedido.cliente?.nome}
                </td>

                <td className="p-3 border">
                  {formatarData(pedido.dataEntrega)}
                </td>

                <td className="p-3 border">
                  {pedido.rota?.nome || "-"}
                </td>

                <td className="p-3 border">
                  {pedido.nomeRecebedor || "-"}
                </td>

                <td className="p-3 border">
                  {pedido.contatoRecebedor || "-"}
                </td>

                <td className="p-3 border">
                  {pedido.enderecoEntrega || "-"}
                </td>

                <td className="p-3 border">
                  {obterStatus(pedido.status)}
                </td>
              </tr>
            ))}

            {pedidos.length === 0 && (
              <tr>
                <td className="p-4 border" colSpan="8">
                  Nenhuma entrega encontrada para este período.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}
