import { useEffect, useState } from "react"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th } from "../components/ui/Table"

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

  async function carregarRelatorio() {
    try {
      const [relatorioResponse, empresaResponse] = await Promise.all([
        api.get("/relatorio-expedicao", {
          params: {
            dataInicio,
            dataFim,
            rotaId,
            status,
            busca
          }
        }),
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

  function filtroHoje() {
    const hoje = new Date()

    setDataInicio(formatarDataFiltro(hoje))
    setDataFim(formatarDataFiltro(hoje))
  }

  function filtroAmanha() {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)

    setDataInicio(formatarDataFiltro(amanha))
    setDataFim(formatarDataFiltro(amanha))
  }

  function filtroProximos5Dias() {
    const hoje = new Date()

    const fim = new Date()
    fim.setDate(fim.getDate() + 5)

    setDataInicio(formatarDataFiltro(hoje))
    setDataFim(formatarDataFiltro(fim))
  }

  function filtroSemana() {
    const hoje = new Date()

    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - hoje.getDay())

    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)

    setDataInicio(formatarDataFiltro(inicio))
    setDataFim(formatarDataFiltro(fim))
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

    setDataInicio(formatarDataFiltro(inicio))
    setDataFim(formatarDataFiltro(fim))
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
      `#${pedido.numeroPedido}`,
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

    return pedido.dataEntrega.substring(0, 10) === hoje
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
          <button
            type="button"
            onClick={exportarCSV}
            className="bg-green-700 text-white px-6 py-3 rounded-lg"
          >
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={imprimir}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg"
          >
            Imprimir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Atrasados</p>
          <strong className="text-2xl">{atrasados}</strong>
        </div>

        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Hoje</p>
          <strong className="text-2xl">{hojeQtd}</strong>
        </div>

        <div className="bg-green-50 border border-green-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Pronto Entrega</p>
          <strong className="text-2xl">{prontoEntrega}</strong>
        </div>

        <div className="bg-blue-50 border border-blue-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Saiu Entrega</p>
          <strong className="text-2xl">{saiuEntrega}</strong>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <button
          type="button"
          onClick={filtroHoje}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Hoje
        </button>

        <button
          type="button"
          onClick={filtroAmanha}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Amanhã
        </button>

        <button
          type="button"
          onClick={filtroProximos5Dias}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          Próximos 5 dias
        </button>

        <button
          type="button"
          onClick={filtroSemana}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          Esta semana
        </button>

        <button
          type="button"
          onClick={filtroMes}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg"
        >
          Este mês
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          <button
            type="button"
            onClick={carregarRelatorio}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={limparFiltros}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg"
          >
            Limpar
          </button>
        </div>
      </div>

      <CabecalhoImpressao
        empresa={empresa}
        titulo="Relatório de Expedição"
        periodoInicio={dataInicio}
        periodoFim={dataFim}
      />

      <div className="bg-white rounded-2xl shadow-md p-6">
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
                  #{pedido.numeroPedido}
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