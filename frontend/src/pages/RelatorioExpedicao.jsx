import { useEffect, useState } from "react"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"

export function RelatorioExpedicao() {
  const [pedidos, setPedidos] = useState([])
  const [rotas, setRotas] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const hoje = new Date().toLocaleDateString("sv-SE")

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  
  const [rotaId, setRotaId] = useState("")
  const [status, setStatus] = useState("")
  const [busca, setBusca] = useState("")

    async function carregarRotas() {
      const response = await api.get("/rotas-entrega")
      setRotas(response.data)
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

  function exportarCSV() {
    const cabecalho = [
      "Pedido",
      "Cliente",
      "Data",
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
    link.download = "relatorio-expedicao.csv"
    link.click()

    URL.revokeObjectURL(url)
  }


  useEffect(() => {

    carregarRotas()
    carregarRelatorio()

    const interval = setInterval(() => {

      carregarRelatorio()

    }, 30000)

    return () => clearInterval(interval)

  }, [])

  function imprimir() {
    window.print()
  }

  function formatarData(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-")

    return `${dia}/${mes}/${ano}`
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
      <div className="flex gap-2">
        <button
          onClick={exportarCSV}
          className="bg-green-700 text-white px-6 py-3 rounded-lg"
        >
          Exportar CSV
        </button>

        <button
          onClick={imprimir}
          className="bg-gray-800 text-white px-6 py-3 rounded-lg"
        >
          Imprimir
        </button>
      </div>
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
            onClick={carregarRelatorio}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setDataInicio("")
              setDataFim("")
              setRotaId("")
              setStatus("")
              setBusca("")
            }}
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
            Entregas do dia
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
              <Th>Data</Th>
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
                  Nenhuma entrega encontrada para esta data.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}