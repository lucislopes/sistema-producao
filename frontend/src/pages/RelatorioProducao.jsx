import { useEffect, useState } from "react"
import { api } from "../services/api"

export function RelatorioProducao() {
  const [servicos, setServicos] = useState([])
  const [operadores, setOperadores] = useState([])
  const [tiposServico, setTiposServico] = useState([])

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [operadorId, setOperadorId] = useState("")
  const [tipoServicoId, setTipoServicoId] = useState("")
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

  async function carregarBase() {
    try {
      const [operadoresRes, tiposRes] = await Promise.all([
        api.get("/funcionarios/operadores"),
        api.get("/tipos-servico")
      ])

      setOperadores(operadoresRes.data)
      setTiposServico(tiposRes.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar filtros")
    }
  }
  function exportarCSV() {
    const cabecalho = [
        "Pedido",
        "Cliente",
        "Plano",
        "Servico",
        "Operador",
        "Status",
        "Inicio",
        "Fim"
    ]

    const linhas = servicos.map((item) => [
        `#${item.plano?.pedido?.numeroPedido || ""}`,
        item.plano?.pedido?.cliente?.nome || "",
        item.plano?.numeroPlano || "",
        item.tipoServico?.nome || "",
        item.operador?.nome || "",
        item.status || "",
        formatarDataHora(item.dataInicio),
        formatarDataHora(item.dataFim)
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
    link.download = "relatorio-producao.csv"
    link.click()

    URL.revokeObjectURL(url)
    }

  async function carregarRelatorio(pagina = page) {
    try {
      const response = await api.get("/relatorio-producao", {
        params: {
          dataInicio,
          dataFim,
          operadorId,
          tipoServicoId,
          status,
          busca,
          page: pagina,
          limit
        }
      })

      setServicos(response.data.dados)
      setPaginacao(response.data.paginacao)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar relatório de produção")
    }
  }

  useEffect(() => {
    carregarBase()
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
    setOperadorId("")
    setTipoServicoId("")
    setStatus("")
    setBusca("")
    setPage(1)
  }

  function imprimir() {
    window.print()
  }

  function formatarDataHora(data) {
    if (!data) return "-"

    return new Date(data).toLocaleString("pt-BR")
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold">
          Relatório de Produção
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
            type="text"
            placeholder="Buscar pedido ou cliente..."
            className="border p-3 rounded-lg"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="border p-3 rounded-lg"
            value={operadorId}
            onChange={(e) => setOperadorId(e.target.value)}
          >
            <option value="">Todos os operadores</option>

            {operadores.map((operador) => (
              <option key={operador.id} value={operador.id}>
                {operador.nome}
              </option>
            ))}
          </select>

          <select
            className="border p-3 rounded-lg"
            value={tipoServicoId}
            onChange={(e) => setTipoServicoId(e.target.value)}
          >
            <option value="">Todos os serviços</option>

            {tiposServico.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
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
            <option value="INICIADO">Iniciado</option>
            <option value="PAUSADO">Pausado</option>
            <option value="CONCLUIDO">Concluído</option>
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
            Listagem de Produção
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
              <th className="text-left p-3 border">Plano</th>
              <th className="text-left p-3 border">Serviço</th>
              <th className="text-left p-3 border">Operador</th>
              <th className="text-left p-3 border">Status</th>
              <th className="text-left p-3 border">Início</th>
              <th className="text-left p-3 border">Fim</th>
            </tr>
          </thead>

          <tbody>
            {servicos.map((item) => (
              <tr key={item.id}>
                <td className="p-3 border font-bold">
                  #{item.plano?.pedido?.numeroPedido}
                </td>

                <td className="p-3 border">
                  {item.plano?.pedido?.cliente?.nome}
                </td>

                <td className="p-3 border">
                  {item.plano?.numeroPlano}
                </td>

                <td className="p-3 border">
                  {item.tipoServico?.nome}
                </td>

                <td className="p-3 border">
                  {item.operador?.nome || "-"}
                </td>

                <td className="p-3 border">
                  {item.status}
                </td>

                <td className="p-3 border">
                  {formatarDataHora(item.dataInicio)}
                </td>

                <td className="p-3 border">
                  {formatarDataHora(item.dataFim)}
                </td>
              </tr>
            ))}

            {servicos.length === 0 && (
              <tr>
                <td className="p-4 border" colSpan="8">
                  Nenhum serviço encontrado.
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