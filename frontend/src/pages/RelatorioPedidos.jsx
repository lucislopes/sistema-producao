import { useEffect, useState } from "react"
import { api } from "../services/api"

export function RelatorioPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [vendedores, setVendedores] = useState([])

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
  function exportarCSV() {
  const cabecalho = [
    "Pedido",
    "Cliente",
    "Vendedor",
    "Data Entrega",
    "Endereco",
    "Status",
    "Valor"
  ]

  const linhas = pedidos.map((item) => [
    `#${item.numeroPedido}`,
    item.cliente?.nome || "",
    item.vendedor?.nome || "",
    formatarData(item.dataEntrega),
    item.enderecoEntrega || item.cliente?.endereco || "",
    item.status || "",
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

  async function carregarRelatorio(pagina = page) {
    try {
      const response = await api.get("/relatorio-pedidos", {
        params: {
          dataInicio,
          dataFim,
          pedido,
          cliente,
          vendedorId,
          status,
          page: pagina,
          limit
        }
      })

      setPedidos(response.data.dados)
      setPaginacao(response.data.paginacao)
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

    return new Date(data).toLocaleDateString("pt-BR")
  }

  function formatarMoeda(valor) {
    if (!valor) return "-"

    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold">
          Relatório de Pedidos
        </h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            className="border p-3 rounded-lg"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            type="date"
            className="border p-3 rounded-lg"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <input
            type="number"
            placeholder="Número pedido"
            className="border p-3 rounded-lg"
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
          />

          <input
            type="text"
            placeholder="Cliente"
            className="border p-3 rounded-lg"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />

          <select
            className="border p-3 rounded-lg"
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
          >
            <option value="">Todos os vendedores</option>

            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nome}
              </option>
            ))}
          </select>

          <select
            className="border p-3 rounded-lg"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_PRODUCAO">Em Produção</option>
            <option value="PENDENTE_PECA">Pendente Peça</option>
            <option value="AGUARDANDO_EXTERNO">Aguardando Externo</option>
            <option value="PARCIAL">Parcial</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="PRONTO_ENTREGA">Pronto Entrega</option>
            <option value="SAIU_ENTREGA">Saiu Entrega</option>
            <option value="ENTREGUE">Entregue</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          <select
            className="border p-3 rounded-lg"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
          >
            <option value={25}>25 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={buscar}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Buscar
          </button>

          <button
            onClick={limparFiltros}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Listagem de Pedidos
          </h2>

          <p className="text-gray-600">
            Total encontrado: {paginacao.total}
          </p>
        </div>

        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-left p-3 border">Pedido</th>
              <th className="text-left p-3 border">Cliente</th>
              <th className="text-left p-3 border">Vendedor</th>
              <th className="text-left p-3 border">Data Entrega</th>
              <th className="text-left p-3 border">Endereço</th>
              <th className="text-left p-3 border">Status</th>
              <th className="text-left p-3 border">Valor</th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((item) => (
              <tr key={item.id}>
                <td className="p-3 border font-bold">
                  #{item.numeroPedido}
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
                  {item.status}
                </td>

                <td className="p-3 border">
                  {formatarMoeda(item.valorTotal)}
                </td>
              </tr>
            ))}

            {pedidos.length === 0 && (
              <tr>
                <td className="p-4 border" colSpan="7">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-between items-center mt-4 no-print">
          <p className="text-sm text-gray-600">
            Página {paginacao.page} de {paginacao.totalPages} — Total: {paginacao.total}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="bg-gray-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
            >
              Anterior
            </button>

            <button
              disabled={page >= paginacao.totalPages}
              onClick={() => setPage(page + 1)}
              className="bg-gray-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}