import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"
import { Button } from "../components/ui/Button"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackState"
import {
  Download,
  Printer,
  CalendarDays,
  Search,
  Eraser,
  ClipboardList,
  Factory,
  CheckCircle2,
  CircleX,
  Clock3,
  Gauge,
  Trophy,
  Users
} from "lucide-react"

function ResumoCard({ titulo, valor, tipo = "normal", icon: Icon }) {
  const classes = {
    normal: { card: "bg-white border-gray-200", icon: "bg-gray-100 text-gray-700" },
    alerta: { card: "bg-yellow-50 border-yellow-300", icon: "bg-yellow-100 text-yellow-700" },
    sucesso: { card: "bg-green-50 border-green-300", icon: "bg-green-100 text-green-700" },
    info: { card: "bg-blue-50 border-blue-300", icon: "bg-blue-100 text-blue-700" }
  }

  const estilo = classes[tipo] || classes.normal

  return (
    <div className={`rounded-xl shadow-sm border p-4 ${estilo.card}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600">{titulo}</p>
          <strong className="text-2xl font-bold block mt-1">{valor}</strong>
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

export function ProdutividadeOperadores() {
  const [dados, setDados] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")

  async function carregarProdutividade(filtros = {}) {
    setCarregando(true)
    setErro("")

    try {
      const params = {
        dataInicio,
        dataFim,
        ...filtros
      }

      const produtividadeResponse = await api.get("/produtividade/operadores", { params })
      setDados(produtividadeResponse.data)
    } catch (error) {
      console.error(error)
      setErro("Não foi possível carregar a produtividade dos operadores.")
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarProdutividade()
    api.get("/configuracao-empresa")
      .then((response) => setEmpresa(response.data))
      .catch((error) => console.error(error))
    // A carga inicial usa os filtros vazios existentes na montagem da tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exportarCSV() {
    const cabecalho = [
      "Posicao",
      "Operador",
      "Total",
      "Em Aberto",
      "Em Producao",
      "Concluidos",
      "Cancelados",
      "Taxa de Conclusao",
      "Tempo Medio"
    ]

    const linhas = dados.map((item, index) => [
      `${index + 1}`,
      item.operador || "",
      item.total || 0,
      item.abertos || 0,
      item.iniciados || 0,
      item.concluidos || 0,
      item.cancelados || 0,
      `${item.taxaConclusao || 0}%`,
      formatarTempo(item.tempoMedioMinutos)
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
    link.download = "produtividade-operadores.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")

    carregarProdutividade({
      dataInicio: "",
      dataFim: ""
    })
  }

  function imprimir() {
    window.print()
  }

  function formatarDataFiltro(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")

    return `${ano}-${mes}-${dia}`
  }

  function filtroHoje() {
    const hoje = formatarDataFiltro(new Date())

    setDataInicio(hoje)
    setDataFim(hoje)

    carregarProdutividade({
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

    carregarProdutividade({
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

    carregarProdutividade({
      dataInicio: dataInicioFiltro,
      dataFim: dataFimFiltro
    })
  }

  const totalConcluidos = dados.reduce(
    (total, item) => total + (item.concluidos || 0),
    0
  )

  const totalEmProducao = dados.reduce(
    (total, item) => total + (item.iniciados || 0),
    0
  )

  const totalCancelados = dados.reduce(
    (total, item) => total + (item.cancelados || 0),
    0
  )

  const totalServicos = dados.reduce(
    (total, item) => total + (item.total || 0),
    0
  )

  const totalAbertos = dados.reduce(
    (total, item) => total + (item.abertos || 0),
    0
  )

  const taxaConclusaoGeral = totalServicos > 0
    ? Math.round((totalConcluidos / totalServicos) * 100)
    : 0

  const melhorOperador =
  dados.length > 0 ? dados[0] : null

  function formatarTempo(minutos = 0) {
    if (!minutos) return "-"
    if (minutos < 60) return `${minutos} min`

    const horas = Math.floor(minutos / 60)
    const minutosRestantes = minutos % 60
    return minutosRestantes ? `${horas}h ${minutosRestantes}min` : `${horas}h`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={exportarCSV}
            variant="success"
            disabled={dados.length === 0}
          >
            <Download size={18} />
            Exportar CSV
          </Button>

          <Button
            type="button"
            onClick={imprimir}
            variant="dark"
            disabled={dados.length === 0}
          >
            <Printer size={18} />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 no-print">
        <strong>Como o período é considerado:</strong> conclusão para serviços concluídos,
        início para serviços em produção e cadastro para serviços abertos ou cancelados.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6 no-print">
        <ResumoCard
          titulo="Total Serviços"
          valor={totalServicos}
          icon={ClipboardList}
        />

        <ResumoCard
          titulo="Operadores"
          valor={dados.length}
          icon={Users}
        />

        <ResumoCard
          titulo="Em Aberto"
          valor={totalAbertos}
          tipo="alerta"
          icon={ClipboardList}
        />

        <ResumoCard
          titulo="Em Produção"
          valor={totalEmProducao}
          tipo="info"
          icon={Factory}
        />

        <ResumoCard
          titulo="Concluídos"
          valor={totalConcluidos}
          tipo="sucesso"
          icon={CheckCircle2}
        />

        <ResumoCard
          titulo="Taxa de Conclusão"
          valor={`${taxaConclusaoGeral}%`}
          tipo="sucesso"
          icon={Gauge}
        />

        <ResumoCard
          titulo="Cancelados"
          valor={totalCancelados}
          icon={CircleX}
        />
      </div>

      {melhorOperador && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 no-print">
          <Trophy className="text-amber-600" size={22} aria-hidden="true" />
          <span className="font-semibold text-amber-950">Destaque do período: {melhorOperador.operador}</span>
          <span className="text-sm text-amber-800">
            {melhorOperador.concluidos} concluído(s) · {melhorOperador.taxaConclusao}% de conclusão
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <Button
          type="button"
          onClick={filtroHoje}
          variant="secondary"
        >
          <CalendarDays size={16} />
          Hoje
        </Button>

        <Button
          type="button"
          onClick={filtroSemana}
          variant="secondary"
        >
          <CalendarDays size={16} />
          Esta semana
        </Button>

        <Button
          type="button"
          onClick={filtroMes}
          variant="secondary"
        >
          <CalendarDays size={16} />
          Este mês
        </Button>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); carregarProdutividade() }} className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm font-medium text-gray-700">
            Data inicial
            <Input className="mt-1" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Data final
            <Input className="mt-1" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </label>

          <div className="flex gap-3">
            <Button
              type="submit"
              loading={carregando}
              className="flex-1 self-end"
            >
              <Search size={18} />
              Buscar
            </Button>

            <Button
              type="button"
              onClick={limparFiltros}
              variant="dangerSoft"
              disabled={carregando || (!dataInicio && !dataFim)}
              className="flex-1 self-end"
            >
              <Eraser size={18} />
              Limpar
            </Button>
          </div>
        </div>
      </form>

           <CabecalhoImpressao
              empresa={empresa}
              titulo="Relatório de Produtividade"
              periodoInicio={dataInicio}
              periodoFim={dataFim}
            />


      <div className="bg-white rounded-2xl shadow-md p-6 print-area">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Ranking de Operadores
          </h2>

          <p className="text-gray-600">
            Total de operadores: {dados.length}. O ranking prioriza a quantidade concluída.
          </p>
        </div>

        {carregando && <LoadingState mensagem="Calculando a produtividade dos operadores..." />}

        {!carregando && erro && (
          <ErrorState descricao={erro} onRetry={() => carregarProdutividade()} />
        )}

        {!carregando && !erro && dados.length === 0 && (
          <EmptyState
            titulo="Nenhuma produtividade encontrada"
            descricao="Não há serviços atribuídos a operadores no período selecionado."
          />
        )}

        {!carregando && !erro && dados.length > 0 && <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Operador</Th>
              <Th>Total</Th>
              <Th>Em Aberto</Th>
              <Th>Em Produção</Th>
              <Th>Concluídos</Th>
              <Th>Cancelados</Th>
              <Th>Conclusão</Th>
              <Th>Tempo Médio</Th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item, index) => (
              <tr key={item.operadorId} className="border-t">
                <Td className="font-bold text-blue-700">
                  {index + 1}º
                </Td>

                <Td className="font-semibold">
                  {item.operador}
                </Td>

                <Td>
                  {item.total || 0}
                </Td>

                <Td className="text-amber-700 font-medium">
                  {item.abertos || 0}
                </Td>

                <Td className="text-blue-700 font-medium">
                  {item.iniciados || 0}
                </Td>

                <Td className="text-green-700 font-bold">
                  {item.concluidos || 0}
                </Td>

                <Td className="text-red-700 font-medium">
                  {item.cancelados || 0}
                </Td>

                <Td>
                  <span className="inline-flex min-w-14 justify-center rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                    {item.taxaConclusao || 0}%
                  </span>
                </Td>

                <Td className="whitespace-nowrap text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={14} aria-hidden="true" />
                    {formatarTempo(item.tempoMedioMinutos)}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>}

        {!carregando && !erro && dados.length > 0 && (
          <p className="mt-4 text-xs text-gray-500">
            Tempo médio calculado entre o início e a conclusão dos serviços concluídos com ambas as datas registradas.
          </p>
        )}
      </div>
    </div>
  )
}

