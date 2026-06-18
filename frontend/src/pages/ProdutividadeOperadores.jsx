import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"
import { Button } from "../components/ui/Button"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
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
  Trophy,
  Users
} from "lucide-react"

export function ProdutividadeOperadores() {
  const [dados, setDados] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  async function carregarProdutividade(filtros = {}) {
    try {
      const params = {
        dataInicio,
        dataFim,
        ...filtros
      }

      const [produtividadeResponse, empresaResponse] = await Promise.all([
        api.get("/produtividade/operadores", { params }),
        api.get("/configuracao-empresa")
      ])

      setDados(produtividadeResponse.data)
      setEmpresa(empresaResponse.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar produtividade")
    }
  }

  useEffect(() => {
    carregarProdutividade()
  }, [])

  function exportarCSV() {
    const cabecalho = [
      "Posicao",
      "Operador",
      "Total",
      "Em Producao",
      "Concluidos",
      "Cancelados"
    ]

    const linhas = dados.map((item, index) => [
      `${index + 1}`,
      item.operador || "",
      item.total || 0,
      item.iniciados || 0,
      item.concluidos || 0,
      item.cancelados || 0
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

  const melhorOperador =
  dados.length > 0 ? dados[0] : null


  function ResumoCard({ titulo, valor, tipo = "normal", icon: Icon }) {
  const classes = {
    normal: {
      card: "bg-white border-gray-200",
      icon: "bg-gray-100 text-gray-700"
    },
    alerta: {
      card: "bg-yellow-50 border-yellow-300",
      icon: "bg-yellow-100 text-yellow-700"
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 no-print">
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
          titulo="Melhor Operador"
          valor={melhorOperador?.operador || "-"}
          tipo="sucesso"
          icon={Trophy}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <button
          type="button"
          onClick={filtroHoje}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Hoje
        </button>

        <button
          type="button"
          onClick={filtroSemana}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Esta semana
        </button>

        <button
          type="button"
          onClick={filtroMes}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays size={16} />
          Este mês
        </button>
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

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => carregarProdutividade()}
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
            Total de operadores: {dados.length}
          </p>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>#</Th>
              <Th>Operador</Th>
              <Th>Total</Th>
              <Th>Em Produção</Th>
              <Th>Concluídos</Th>
              <Th>Cancelados</Th>
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

                <Td className="text-blue-700 font-medium">
                  {item.iniciados || 0}
                </Td>

                <Td className="text-green-700 font-bold">
                  {item.concluidos || 0}
                </Td>

                <Td className="text-red-700 font-medium">
                  {item.cancelados || 0}
                </Td>
              </tr>
            ))}

            {dados.length === 0 && (
              <tr>
                <td className="p-4 border" colSpan="6">
                  Nenhuma produtividade encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}

