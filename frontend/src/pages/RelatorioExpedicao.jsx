import { useEffect, useState } from "react"
import { api } from "../services/api"

export function RelatorioExpedicao() {
  const [pedidos, setPedidos] = useState([])
  const [rotas, setRotas] = useState([])

  const hoje = new Date().toISOString().substring(0, 10)

  const [data, setData] = useState(hoje)
  const [rotaId, setRotaId] = useState("")
  const [status, setStatus] = useState("")
  const [busca, setBusca] = useState("")

  async function carregarRotas() {
    const response = await api.get("/rotas-entrega")
    setRotas(response.data)
  }

  async function carregarRelatorio() {
    try {
      const response = await api.get("/relatorio-expedicao", {
        params: {
          data,
          rotaId,
          status,
          busca
        }
      })

      setPedidos(response.data)
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

  function imprimir() {
    window.print()
  }

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleDateString("pt-BR")
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
        <h1 className="text-3xl font-bold">
          Relatório de Expedição
        </h1>

        <button
          onClick={imprimir}
          className="bg-gray-800 text-white px-6 py-3 rounded-lg"
        >
          Imprimir
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="date"
            className="border p-3 rounded-lg"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />

          <select
            className="border p-3 rounded-lg"
            value={rotaId}
            onChange={(e) => setRotaId(e.target.value)}
          >
            <option value="">Todas as rotas</option>

            {rotas.map((rota) => (
              <option key={rota.id} value={rota.id}>
                {rota.nome}
              </option>
            ))}
          </select>

          <select
            className="border p-3 rounded-lg"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="PRONTO_ENTREGA">Pronto Entrega</option>
            <option value="SAIU_ENTREGA">Saiu Entrega</option>
          </select>

          <input
            type="text"
            placeholder="Buscar pedido ou cliente..."
            className="border p-3 rounded-lg"
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
              setData(hoje)
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

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Entregas do dia
          </h2>

          <p className="text-gray-600">
            Data: {formatarData(data)}
          </p>

          <p className="text-gray-600">
            Total de entregas: {pedidos.length}
          </p>
        </div>

        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-left p-3 border">Pedido</th>
              <th className="text-left p-3 border">Cliente</th>
              <th className="text-left p-3 border">Data</th>
              <th className="text-left p-3 border">Rota</th>
              <th className="text-left p-3 border">Recebedor</th>
              <th className="text-left p-3 border">Contato</th>
              <th className="text-left p-3 border">Endereço</th>
              <th className="text-left p-3 border">Status</th>
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
        </table>
      </div>
    </div>
  )
}