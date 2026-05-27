import { useEffect, useState } from "react"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"

export function RelatorioProducao() {
  const [servicos, setServicos] = useState([])
  const [operadores, setOperadores] = useState([])
  const [tiposServico, setTiposServico] = useState([])
  const [empresa, setEmpresa] = useState(null)
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
      const [relatorioResponse, empresaResponse] = await Promise.all([
        api.get("/relatorio-producao", {
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
        }),

        api.get("/configuracao-empresa")
      ])

      setServicos(relatorioResponse.data.dados)
      setPaginacao(relatorioResponse.data.paginacao)

      setEmpresa(empresaResponse.data)
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
        <div className="flex gap-2">
        <Button
            onClick={exportarCSV}
            className="bg-green-700 text-white px-6 py-3 rounded-lg"
        >
            Exportar CSV
        </Button>

        <Button
            onClick={imprimir}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg"
        >
            Imprimir
        </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            value={operadorId}
            onChange={(e) => setOperadorId(e.target.value)}
          >
            <option value="">Todos os operadores</option>

            {operadores.map((operador) => (
              <option key={operador.id} value={operador.id}>
                {operador.nome}
              </option>
            ))}
          </Select>

          <Select
            value={tipoServicoId}
            onChange={(e) => setTipoServicoId(e.target.value)}
          >
            <option value="">Todos os serviços</option>

            {tiposServico.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </Select>

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="INICIADO">Iniciado</option>
            <option value="PAUSADO">Pausado</option>
            <option value="CONCLUIDO">Concluído</option>
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
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={buscar}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Buscar
          </Button>

          <Button variant="secondary"
            onClick={limparFiltros}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg"
          >
            Limpar
          </Button>
        </div>
      </div>

      <CabecalhoImpressao
        empresa={empresa}
        titulo="Relatório de Produção"
        periodoInicio={dataInicio}
        periodoFim={dataFim}
      />
      
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Listagem de Produção
          </h2>

          <p className="text-gray-600">
            Total encontrado: {paginacao.total}
          </p>
        </div>

        <Table>
          <thead>
            <tr className="p-3 border font-bold" >
              <th className="p-3 border font-bold" >Pedido</th>
              <th className="p-3 border font-bold" >Cliente</th>
              <th className="p-3 border font-bold" >Plano</th>
              <th className="p-3 border font-bold" >Serviço</th>
              <th className="p-3 border font-bold" >Operador</th>
              <th className="p-3 border font-bold" >Status</th>
              <th className="p-3 border font-bold" >Início</th>
              <th className="p-3 border font-bold" >Fim</th>
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
                <td>
                  Nenhum serviço encontrado.
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
            <Button variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="bg-gray-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
            >
              Anterior
            </Button>

            <Button
              disabled={page >= paginacao.totalPages}
              onClick={() => setPage(page + 1)}
              className="bg-gray-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}