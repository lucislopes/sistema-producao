import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackState"

import {
  Download,
  Printer,
  CalendarDays,
  Search,
  Eraser,
  Factory,
  ClipboardList,
  CheckCircle2,
  Filter,
  User,
  Wrench,
  Clock,
  Trophy,
  Zap
} from "lucide-react"

export function RelatorioProducao() {
  const [servicos, setServicos] = useState([])
  const [operadores, setOperadores] = useState([])
  const [tiposServico, setTiposServico] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [resumo, setResumo] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

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

  const usuarioLogado = JSON.parse(localStorage.getItem("@usuario") || "{}")
  const isVendedor = usuarioLogado.funcao === "VENDEDOR"

  const podeExportarImprimir =
    usuarioLogado.funcao === "ADMIN" ||
    usuarioLogado.funcao === "VENDEDOR_OPERADOR"

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
    setCarregando(true)
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

      const relatorioResponse = await api.get("/relatorio-producao", {
        params
      })

      setServicos(relatorioResponse.data.dados)
      setPaginacao(relatorioResponse.data.paginacao)
      setResumo(relatorioResponse.data.resumo || null)
      setErro(false)
    } catch (error) {
      console.log(error)
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }

  async function carregarEmpresa() {
    if (!podeExportarImprimir) return setEmpresa(null)
    try {
      const response = await api.get("/configuracao-empresa")
      setEmpresa(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    carregarBase()
    carregarEmpresa()
    // Dados auxiliares são carregados uma única vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    carregarRelatorio(page)
    // A paginação reaplica os filtros selecionados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    carregarRelatorio(1, {
      dataInicio: "",
      dataFim: "",
      operadorId: "",
      tipoServicoId: "",
      status: "",
      busca: ""
    })
  }

  function imprimir() {
    window.print()
  }

  function formatarDataHora(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)
    const horaTexto = String(data).substring(11, 16)

    const [ano, mes, dia] = dataTexto.split("-")

    if (!horaTexto) {
      return `${dia}/${mes}/${ano}`
    }

    return `${dia}/${mes}/${ano} ${horaTexto}`
  }

  function formatarDataFiltro(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")

    return `${ano}-${mes}-${dia}`
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

  function CardServico({ item }) {
    return (
      <div
        className={`bg-white border-l-4 ${classeServico(
          item.nome
        )} border border-gray-200 rounded-xl p-4 shadow-sm`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-sm text-gray-500">Serviço</p>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span>{iconeServico(item.nome)}</span>
              {item.nome}
            </h3>
          </div>

          <div className="bg-gray-100 text-gray-700 p-3 rounded-xl">
            <Wrench size={22} />
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <strong>{item.total}</strong>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Em produção</span>
            <strong className="text-blue-700">{item.producao}</strong>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Concluídos</span>
            <strong className="text-green-700">{item.concluidos}</strong>
          </div>

          <div className="border-t pt-2 flex justify-between">
            <span className="text-gray-500">Tempo médio corrido</span>
            <strong>{formatarTempoMedio(item.tempoMedio)}</strong>
          </div>
        </div>
      </div>
    )
  }

  function CardDestaque({ titulo, principal, detalhe, icon: Icon, iconClass = "bg-blue-100 text-blue-700" }) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">{titulo}</p>

            <strong className="text-xl font-bold block mt-1 text-gray-800">
              {principal || "-"}
            </strong>

            <p className="text-sm text-gray-500 mt-1">
              {detalhe}
            </p>
          </div>

          {Icon && (
            <div className={`${iconClass} p-3 rounded-xl`}>
              <Icon size={24} />
            </div>
          )}
        </div>
      </div>
    )
  }

  function iconeServico(nome) {
    const icones = {
      Corte: "🪚",
      Encabeçamento: "📏",
      Engrosso: "📐",
      Furação: "🔩",
      "Painel Ripado": "🧱",
      "Corte Usinado": "⚙️",
      Usinagem: "⚙️",
      Outros: "🔧"
    }

    return icones[nome] || "🔧"
  }

  function classeServico(nome) {
    const classes = {
      Corte: "border-blue-300",
      Encabeçamento: "border-green-300",
      Engrosso: "border-yellow-300",
      Furação: "border-purple-300",
      "Painel Ripado": "border-orange-300",
      "Corte Usinado": "border-cyan-300",
      Usinagem: "border-indigo-300",
      Outros: "border-gray-300"
    }

    return classes[nome] || "border-gray-300"
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

  function formatarTempoMedio(minutos) {
    if (!minutos || minutos <= 0) return "-"
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    const restoMinutos = minutos % 60
    return `${horas}h ${restoMinutos}min`
  }

  const totalServicos = resumo?.total || 0
  const iniciados = resumo?.iniciados || 0
  const concluidos = resumo?.concluidos || 0
  const producaoHoje = resumo?.producaoHoje || 0
  const tempoMedioGeral = resumo?.tempoMedio || 0
  const resumoPorServico = resumo?.porServico || []
  const operadoresEnvolvidos = resumo?.operadoresEnvolvidos || 0
  const servicoMaisExecutado = resumo?.servicoMaisExecutado || null
  const operadorDestaque = resumo?.operadorDestaque
    ? { nome: resumo.operadorDestaque.nome, total: resumo.operadorDestaque.concluidos }
    : null

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 no-print">
        <h1 className="text-xl font-bold text-blue-950">Produção por serviço</h1>
        <p className="mt-1 text-sm text-blue-800">Acompanhe serviços abertos, em execução e concluídos, com tempos e responsáveis.</p>
      </div>

      {podeExportarImprimir && (
        <div className="flex flex-wrap justify-end gap-2 no-print">
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={exportarCSV}
              variant="success"
              disabled={!servicos.length}
            >
              <Download size={18} />
              Exportar página em CSV
            </Button>

            <Button
              type="button"
              onClick={imprimir}
              variant="dark"
              disabled={!servicos.length}
            >
              <Printer size={18} />
              Imprimir
            </Button>
          </div>
        </div>
      )}

      {isVendedor && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 no-print">
          <strong>Modo consulta:</strong> você está visualizando a produção para acompanhamento. Exportação e impressão ficam restritas aos perfis autorizados.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 no-print">
        <ResumoCard
          titulo="Total"
          valor={totalServicos}
          icon={ClipboardList}
        />

        <ResumoCard
          titulo="Em Produção"
          valor={iniciados}
          tipo="info"
          icon={Factory}
        />

        <ResumoCard
          titulo="Concluídos"
          valor={concluidos}
          tipo="sucesso"
          icon={CheckCircle2}
        />

        <ResumoCard
          titulo="Produção Hoje"
          valor={producaoHoje}
          tipo="sucesso"
          icon={Zap}
        />

        <ResumoCard
          titulo="Tempo Médio Corrido"
          valor={formatarTempoMedio(tempoMedioGeral)}
          tipo="info"
          icon={Clock}
        />

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 no-print">
        <CardDestaque
          titulo="🏆 Serviço Líder"
          principal={servicoMaisExecutado?.nome}
          detalhe={
            servicoMaisExecutado
              ? `${servicoMaisExecutado.total} serviço${servicoMaisExecutado.total === 1 ? "" : "s"} executado${servicoMaisExecutado.total === 1 ? "" : "s"}`
              : "Nenhum serviço no período"
          }
          icon={Trophy}
        />

        <CardDestaque
          titulo="👤 Operador Destaque"
          principal={operadorDestaque?.nome}
          detalhe={
            operadorDestaque
              ? `${operadorDestaque.total} serviço${operadorDestaque.total === 1 ? "" : "s"} concluído${operadorDestaque.total === 1 ? "" : "s"}`
              : "Nenhum operador no período"
          }
          icon={User}
          iconClass="bg-green-100 text-green-700"
        />
      </div>

      <div className="mb-6 no-print">
        <h3 className="text-lg font-semibold mb-3">
          Produção por Serviço
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {resumoPorServico.map((item) => (
            <CardServico key={item.nome} item={item} />
          ))}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 no-print" aria-label="Filtros rápidos">
        <Button
          type="button"
          onClick={filtroHoje}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Hoje
        </Button>

        <Button
          type="button"
          onClick={filtroSemana}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Esta semana
        </Button>

        <Button
          type="button"
          onClick={filtroMes}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Este mês
        </Button>

        <div className="h-8 w-px bg-gray-300 mx-2" />

        <Button
          type="button"
          onClick={() => filtroStatusRapido("ABERTO")}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Filter size={16} />
          Abertos
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("INICIADO")}
          className="bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Factory size={16} />
          Em Produção
        </Button>

        <Button
          type="button"
          onClick={() => filtroStatusRapido("CONCLUIDO")}
          className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          Concluídos
        </Button>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); buscar() }} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm no-print">

        <p className="text-sm text-gray-500 mb-4">
          A data filtrada muda conforme o status: Concluído usa Data Fim, Em Produção usa Data Início, e Aberto usa Data de Criação.
          O tempo médio é corrido entre início e conclusão, incluindo períodos fora do expediente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Input
            aria-label="Data inicial"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <Input
            aria-label="Data final"
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
            aria-label="Operador"
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

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          

          <Select
            aria-label="Tipo de serviço"
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
            aria-label="Status"
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
            aria-label="Registros por página"
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

          <div className="flex gap-3">
            <Button
              type="submit"
              loading={carregando}
            >
              <Search size={18} />
              Buscar
            </Button>

            <Button
              type="button"
              onClick={limparFiltros}
              variant="dangerSoft"
            >
              <Eraser size={18} />
              Limpar
            </Button>
          </div>
        </div>
      </form>

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
            {paginacao.total} serviço{paginacao.total === 1 ? "" : "s"} encontrado{paginacao.total === 1 ? "" : "s"}
          </p>
        </div>

        {carregando ? (
          <LoadingState mensagem="Carregando o relatório de produção..." />
        ) : erro ? (
          <ErrorState descricao="Não foi possível carregar o relatório de produção." onRetry={() => carregarRelatorio(page)} />
        ) : servicos.length === 0 ? (
          <EmptyState titulo="Nenhum serviço encontrado" descricao="Revise o período e os filtros selecionados." />
        ) : (
          <>
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
              <tr key={item.id}>
                <Td className="font-bold text-blue-700">
                  <Link to={`/pedidos/${item.plano?.pedido?.id}`} className="hover:underline">
                    {obterNumeroPedido(item.plano?.pedido)}
                  </Link>
                </Td>

                <Td>
                  {item.plano?.pedido?.cliente?.nome || "-"}
                </Td>

                <Td className="font-medium text-indigo-700">
                  {item.plano?.numeroPlano || "-"}
                </Td>

                <Td className="font-medium text-indigo-700">
                  <span className="inline-flex items-center gap-2">
                    <span>{iconeServico(item.tipoServico?.nome)}</span>
                    {item.tipoServico?.nome || "-"}
                  </span>
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

          </tbody>
        </Table>

        <div className="flex justify-between items-center mt-4 no-print">
          <div className="flex flex-wrap gap-4 text-gray-600">
            <p>
              {paginacao.total} serviço{paginacao.total === 1 ? "" : "s"} encontrado{paginacao.total === 1 ? "" : "s"}
            </p>

            <p>
              {operadoresEnvolvidos} operador{operadoresEnvolvidos === 1 ? "" : "es"} envolvido{operadoresEnvolvidos === 1 ? "" : "s"}
            </p>

            <p>
              Tempo médio: {formatarTempoMedio(tempoMedioGeral)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((paginaAtual) => paginaAtual - 1)}
            >
              Anterior
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={page >= paginacao.totalPages}
              onClick={() => setPage((paginaAtual) => paginaAtual + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
