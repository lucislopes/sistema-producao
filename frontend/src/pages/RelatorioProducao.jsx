import { useEffect, useState } from "react"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"

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
            <span className="text-gray-500">Tempo médio</span>
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

  function ehHoje(data) {
    if (!data) return false
    const hoje = new Date().toISOString().substring(0, 10)
    return String(data).substring(0, 10) === hoje
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

  function calcularDuracaoMinutos(inicio, fim) {
    if (!inicio || !fim) return 0

    const dataInicio = new Date(inicio)
    const dataFim = new Date(fim)

    const diff = dataFim - dataInicio

    if (diff <= 0) return 0

    return Math.round(diff / 60000)
  }

    function formatarTempoMedio(minutos) {
      if (!minutos || minutos <= 0) return "-"

      if (minutos < 60) {
        return `${minutos} min`
      }

      const horas = Math.floor(minutos / 60)
      const restoMinutos = minutos % 60

      return `${horas}h ${restoMinutos}min`
    }

    const servicosConcluidosComTempo = servicos.filter(
      (item) =>
        item.status === "CONCLUIDO" &&
        item.dataInicio &&
        item.dataFim
    )

    const tempoTotalMinutos = servicosConcluidosComTempo.reduce(
      (acc, item) =>
        acc + calcularDuracaoMinutos(item.dataInicio, item.dataFim),
      0
    )

    const tempoMedioGeral =
      servicosConcluidosComTempo.length > 0
        ? Math.round(tempoTotalMinutos / servicosConcluidosComTempo.length)
        : 0

        const resumoPorServico = tiposServico
          .map((tipo) => {
            const itens = servicos.filter(
              (item) => item.tipoServico?.nome === tipo.nome
            )

            const concluidosComTempo = itens.filter(
              (item) =>
                item.status === "CONCLUIDO" &&
                item.dataInicio &&
                item.dataFim
            )

            const tempoTotal = concluidosComTempo.reduce(
              (acc, item) =>
                acc + calcularDuracaoMinutos(item.dataInicio, item.dataFim),
              0
            )

            const tempoMedio =
              concluidosComTempo.length > 0
                ? Math.round(tempoTotal / concluidosComTempo.length)
                : 0

            return {
              nome: tipo.nome,
              total: itens.length,
              abertos: itens.filter((item) => item.status === "ABERTO").length,
              producao: itens.filter((item) => item.status === "INICIADO").length,
              concluidos: itens.filter((item) => item.status === "CONCLUIDO").length,
              cancelados: itens.filter((item) => item.status === "CANCELADO").length,
              tempoMedio
            }
          })
          .filter((item) => item.total > 0)

          const producaoHoje = servicos.filter(
            (item) =>
              item.status === "CONCLUIDO" &&
              ehHoje(item.dataFim)
          ).length

          const operadoresEnvolvidos = new Set(
            servicos
              .filter((item) => item.operador?.id)
              .map((item) => item.operador.id)
          ).size

          const servicoMaisExecutado =
          resumoPorServico.length > 0
            ? [...resumoPorServico].sort((a, b) => b.total - a.total)[0]
            : null

          const resumoOperadores = operadores.map((operador) => {
            const concluidosOperador = servicos.filter(
              (item) =>
                item.operador?.id === operador.id &&
                item.status === "CONCLUIDO"
            )

            return {
              nome: operador.nome,
              total: concluidosOperador.length
            }
          })

          const operadorDestaque =
            resumoOperadores.length > 0
              ? [...resumoOperadores].sort((a, b) => b.total - a.total)[0]
              : null




  

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
          titulo="Tempo Médio"
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
      
      <div className="flex flex-wrap items-center gap-2 mb-4 no-print">
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

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">

        <p className="text-sm text-gray-500 mb-4">
          A data filtrada muda conforme o status: Concluído usa Data Fim, Em Produção usa Data Início, e Aberto usa Data de Criação.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          

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
            <option value={25}>25 registros</option>
            <option value={50}>50 registros</option>
            <option value={100}>100 registros</option>
          </Select>

          <div className="flex gap-3">
            <Button
              variant="Primary"
              onClick={buscar}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Search size={18} />
              Buscar
            </Button>

            <Button
              type="button"
              onClick={limparFiltros}
              variant=""
              className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Eraser size={18} />
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
            {paginacao.total} serviço{paginacao.total === 1 ? "" : "s"} encontrado{paginacao.total === 1 ? "" : "s"}
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
              <tr key={item.id}>
                <Td className="font-bold text-blue-700">
                  {obterNumeroPedido(item.plano?.pedido)}
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

            {servicos.length === 0 && (
              <tr>
                <Td className="p-4" colSpan="8">
                  Nenhum serviço encontrado.
                </Td>
              </tr>
            )}
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
