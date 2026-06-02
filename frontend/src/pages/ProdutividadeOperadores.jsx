import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"

export function ProdutividadeOperadores() {
  const [dados, setDados] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  async function carregarProdutividade() {
    try {
      const [produtividadeResponse, empresaResponse] = await Promise.all([
        api.get("/produtividade/operadores", {
          params: {
            dataInicio,
            dataFim
          }
        }),

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
  }

  function imprimir() {
    window.print()
  }

  function formatarDataFiltro(data) {
    return data.toISOString().split("T")[0]
  }

  function filtroHoje() {
    const hoje = new Date()

    setDataInicio(formatarDataFiltro(hoje))
    setDataFim(formatarDataFiltro(hoje))
  }

  function filtroSemana() {
    const hoje = new Date()

    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - hoje.getDay())

    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)

    setDataInicio(formatarDataFiltro(inicio))
    setDataFim(formatarDataFiltro(fim))
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

    setDataInicio(formatarDataFiltro(inicio))
    setDataFim(formatarDataFiltro(fim))
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportarCSV}
            className="bg-green-700 text-white px-6 py-3 rounded-lg"
          >
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={imprimir}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg"
          >
            Imprimir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 no-print">
        <ResumoCard
          titulo="Total"
          valor={totalServicos}
        />

        <ResumoCard
          titulo="Em Produção"
          valor={totalEmProducao}
          tipo="info"
        />

        <ResumoCard
          titulo="Concluídos"
          valor={totalConcluidos}
          tipo="sucesso"
        />

        <ResumoCard
          titulo="Cancelados"
          valor={totalCancelados}
          tipo={totalCancelados > 0 ? "alerta" : "normal"}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <button
          type="button"
          onClick={filtroHoje}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Hoje
        </button>

        <button
          type="button"
          onClick={filtroSemana}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          Esta semana
        </button>

        <button
          type="button"
          onClick={filtroMes}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg"
        >
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
            <button
              type="button"
              onClick={carregarProdutividade}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Buscar
            </button>

            <button
              type="button"
              onClick={limparFiltros}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      <div className="hidden print:block mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">
          {empresa?.nome || "Empresa"}
        </h1>

        <p className="text-sm">
          CNPJ: {empresa?.cnpj || "-"}
        </p>

        <p className="text-sm">
          {empresa?.cidade || "-"} / {empresa?.estado || "-"}
        </p>

        <p className="text-sm">
          Tel: {empresa?.telefone || "-"}
        </p>

        <h2 className="text-xl font-bold mt-4">
          Relatório de Produtividade
        </h2>

        <p>
          Período: {dataInicio || "Início"} até {dataFim || "Hoje"}
        </p>

        <p>
          Emitido em: {new Date().toLocaleString("pt-BR")}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
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
                <Td className="font-bold">
                  {index + 1}º
                </Td>

                <Td>
                  {item.operador}
                </Td>

                <Td>
                  {item.total || 0}
                </Td>

                <Td>
                  {item.iniciados || 0}
                </Td>

                <Td className="font-bold">
                  {item.concluidos || 0}
                </Td>

                <Td>
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

function ResumoCard({ titulo, valor, tipo }) {
  const classes = {
    normal: "bg-white border-gray-200",
    alerta: "bg-yellow-50 border-yellow-500",
    sucesso: "bg-green-50 border-green-500",
    info: "bg-blue-50 border-blue-500"
  }

  return (
    <div
      className={`
        rounded-xl shadow-sm border p-4
        ${classes[tipo || "normal"]}
      `}
    >
      <p className="text-sm text-gray-600">
        {titulo}
      </p>

      <strong className="text-2xl font-bold">
        {valor}
      </strong>
    </div>
  )
}