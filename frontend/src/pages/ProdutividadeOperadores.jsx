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

  function exportarCSV() {
    const cabecalho = [
        "Posicao",
        "Operador",
        "Total",
        "Iniciados",
        "Pausados",
        "Concluidos",
        "Cancelados"
    ]

    const linhas = dados.map((item, index) => [
        `${index + 1}`,
        item.operador || "",
        item.total || 0,
        item.iniciados || 0,
        item.pausados || 0,
        item.concluidos || 0,
        item.cancelados || 0
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
    link.download = "produtividade-operadores.csv"
    link.click()

    URL.revokeObjectURL(url)
    }

  useEffect(() => {
    carregarProdutividade()
  }, [])

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
  }

  function imprimir() {
    window.print()
  }

  const totalConcluidos = dados.reduce(
    (total, item) => total + item.concluidos,
    0
  )

  const totalPausados = dados.reduce(
    (total, item) => total + item.pausados,
    0
  )

  const totalIniciados = dados.reduce(
    (total, item) => total + item.iniciados,
    0
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
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

      

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ResumoCard
          titulo="Concluídos"
          valor={totalConcluidos}
          tipo="sucesso"
        />

        <ResumoCard
          titulo="Em Andamento"
          valor={totalIniciados}
          tipo="info"
        />

        <ResumoCard
          titulo="Pausados"
          valor={totalPausados}
          tipo={totalPausados > 0 ? "alerta" : "normal"}
        />
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
              onClick={carregarProdutividade}
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
        Período:
        {" "}
        {dataInicio || "Início"}
        {" "}até{" "}
        {dataFim || "Hoje"}
      </p>

      <p>
        Emitido em:
        {" "}
        {new Date().toLocaleString("pt-BR")}
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
              <Th>Iniciados</Th>
              <Th>Pausados</Th>
              <Th>Concluídos</Th>
              <Th>Cancelados</Th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item, index) => (
              <tr key={item.operadorId}>
                <td className="p-3 border font-bold">
                  {index + 1}º
                </td>

                <td className="p-3 border">
                  {item.operador}
                </td>

                <td className="p-3 border">
                  {item.total}
                </td>

                <td className="p-3 border">
                  {item.iniciados}
                </td>

                <td className="p-3 border">
                  {item.pausados}
                </td>

                <td className="p-3 border font-bold">
                  {item.concluidos}
                </td>

                <td className="p-3 border">
                  {item.cancelados}
                </td>
              </tr>
            ))}

            {dados.length === 0 && (
              <tr>
                <td className="p-4 border" colSpan="7">
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