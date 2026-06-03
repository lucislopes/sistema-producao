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

  async function carregarRelatorio(pagina = page, filtros = {}) {
    try {
      const params = {
        dataInicio,
        dataFim,
        operadorId,
        tipoServicoId,
        status,
        busca,
        page: pagina,
        limit,
        ...filtros
      }

      const [relatorioResponse, empresaResponse] = await Promise.all([
        api.get("/relatorio-producao", { params }),
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

  function obterStatus(status) {
    const statusMap = {
      ABERTO: "Aberto",
      INICIADO: "Em Produção",
      CONCLUIDO: "Concluído",
      CANCELADO: "Cancelado"
    }

    return statusMap[status] || status
  }

  function obterClasseStatus(status) {
    const classes = {
      ABERTO: "bg-gray-100 text-gray-700",
      INICIADO: "bg-blue-100 text-blue-700",
      CONCLUIDO: "bg-green-100 text-green-700",
      CANCELADO: "bg-red-100 text-red-700"
    }

    return classes[status] || "bg-gray-100 text-gray-700"
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
      obterNumeroPedido(item.plano?.pedido),
      item.plano?.pedido?.cliente?.nome || "",
      item.plano?.numeroPlano || "",
      item.tipoServico?.nome || "",
      item.operador?.nome || "",
      obterStatus(item.status),
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

  const totalServicos = servicos.length

  const abertos = servicos.filter(
    (item) => item.status === "ABERTO"
  ).length

  const iniciados = servicos.filter(
    (item) => item.status === "INICIADO"
  ).length

  const concluidos = servicos.filter(
    (item) => item.status === "CONCLUIDO"
  ).length

  const cancelados = servicos.filter(
    (item) => item.status === "CANCELADO"
  ).length

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={exportarCSV}
            className="bg-green-700 text-white px-6 py-3 rounded-lg"
          >
            Exportar CSV
          </Button>

          <Button
            type="button"
            onClick={imprimir}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg"
          >
            Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 no-print">
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total</p>
          <strong className="text-2xl">{totalServicos}</strong>
        </div>

        <div className="bg-gray-50 border border-gray-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Abertos</p>
          <strong className="text-2xl">{abertos}</strong>
        </div>

        <div className="bg-blue-50 border border-blue-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Em Produção</p>
          <strong className="text-2xl">{iniciados}</strong>
        </div>

        <div className="bg-green-50 border border-green-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Concluídos</p>
          <strong className="text-2xl">{concluidos}</strong>
        </div>

        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <p className="text-sm text-gray-600">Cancelados</p>
          <strong className="text-2xl">{cancelados}</strong>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <Button
          type="button"
          onClick={filtroHoje}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Hoje
        </Button>

        <Button
          type="button"
          onClick={filtroSemana}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          Esta semana
        </Button>

        <Button
          type="button"
          onClick={filtroMes}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg"
        >
          Este mês
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("ABERTO")}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Abertos
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("INICIADO")}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Em Produção
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("CONCLUIDO")}
          className="bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Concluídos
        </Button>
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
            <option value="INICIADO">Em Produção</option>
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

          <div className="flex grid-cols-1 md:grid-cols-3 gap-4" >
            <Button variant="Primary" onClick={buscar} className="bg-blue-600 text-white px-6 py-3 rounded-lg">
              Buscar
            </Button> 

            <Button variant="secondary" onClick={limparFiltros} className="bg-gray-500 text-white px-6 py-3 rounded-lg">
              Limpar
            </Button>
          </div>
        </div>
      </div>

      <CabecalhoImpressao
        empresa={empresa}
        titulo="Relatório de Produção"
        periodoInicio={dataInicio}
        periodoFim={dataFim}
      />

      <div className="bg-white rounded-2xl shadow-md p-6 print-area">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Relatório de Produção
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
              <Th>Plano</Th>
              <Th>Serviço</Th>
              <Th>Operador</Th>
              <Th>Status</Th>
              <Th>Início</Th>
              <Th>Fim</Th>
            </tr>
          </thead>

          <tbody>
            {servicos.map((item) => (
              <tr key={item.id} className="border-t">
                <Td className="font-bold">
                  {obterNumeroPedido(item.plano?.pedido)}
                </Td>

                <Td>
                  {item.plano?.pedido?.cliente?.nome || "-"}
                </Td>

                <Td>
                  {item.plano?.numeroPlano || "-"}
                </Td>

                <Td>
                  {item.tipoServico?.nome || "-"}
                </Td>

                <Td>
                  {item.operador?.nome || "-"}
                </Td>

                <Td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${obterClasseStatus(item.status)}`}
                  >
                    {obterStatus(item.status)}
                  </span>
                </Td>

                <Td>
                  {formatarDataHora(item.dataInicio)}
                </Td>

                <Td>
                  {formatarDataHora(item.dataFim)}
                </Td>
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
        </Table>

        <div className="flex justify-between items-center mt-4 no-print">
          <p className="text-sm text-gray-600">
            Página {paginacao.page} de {paginacao.totalPages} — Total: {paginacao.total}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="bg-gray-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
            >
              Anterior
            </Button>

            <Button
              type="button"
              variant="secondary"
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
