import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import {
  Search,
  CalendarDays,
  Eraser,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign
} from "lucide-react"

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

function formatarData(data) {
  if (!data) return "-"
  return new Date(data).toLocaleDateString("pt-BR")
}

function ResumoCard({ titulo, valor, icon: Icon }) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{titulo}</p>
          <strong className="text-2xl font-bold">{valor}</strong>
        </div>
        {Icon && <Icon size={26} />}
      </div>
    </div>
  )
}

export function RelatorioAuditoriaFrete() {
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState({
    total: 0,
    aumentos: 0,
    descontos: 0,
    impactoTotal: 0
  })

  const [vendedores, setVendedores] = useState([])

  const [busca, setBusca] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [vendedorId, setVendedorId] = useState("")

  async function carregarRelatorio() {
    try {
      const response = await api.get("/relatorio-frete/auditoria", {
        params: {
            busca,
            dataInicio,
            dataFim,
            vendedorId
        }
        })

      setDados(response.data.dados)
      setResumo(response.data.resumo)
    } catch (error) {
      console.log(error)
      alert(
        error.response?.data?.error ||
        "Erro ao carregar relatório de auditoria de frete"
      )
    }
  }

  async function carregarVendedores() {
    try {
      const response = await api.get("/funcionarios/vendedores")
      setVendedores(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    carregarVendedores()
    carregarRelatorio()
  }, [])

  function limparFiltros() {
    setBusca("")
    setDataInicio("")
    setDataFim("")
    setVendedorId("")
  }

  function exportarCSV() {
    const linhas = [
      [
        "Pedido",
        "Cliente",
        "Rota",
        "Vendedor",
        "Data Pedido",
        "Data Entrega",
        "Frete Rota",
        "Frete Cobrado",
        "Diferença",
        "Motivo"
      ],
      ...dados.map((item) => [
        item.numeroPedido,
        item.cliente,
        item.rota,
        item.vendedor,
        formatarData(item.dataPedido),
        formatarData(item.dataEntrega),
        item.valorFretePadrao,
        item.valorFreteCobrado,
        item.diferenca,
        item.motivoAlteracaoFrete
      ])
    ]

    const csv = linhas
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo ?? "").replaceAll('"', '""')}"`)
          .join(";")
      )
      .join("\n")

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "auditoria-frete.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <ResumoCard
          titulo="Fretes Alterados"
          valor={resumo.total}
          icon={FileText}
        />

        <ResumoCard
          titulo="Aumentos"
          valor={resumo.aumentos}
          icon={TrendingUp}
        />

        <ResumoCard
          titulo="Descontos"
          valor={resumo.descontos}
          icon={TrendingDown}
        />

        <ResumoCard
          titulo="Impacto Total"
          valor={formatarMoeda(resumo.impactoTotal)}
          icon={DollarSign}
        />
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              type="text"
              placeholder="Pedido, cliente, rota..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
          >
            <option value="">Todos vendedores</option>
            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nome}
              </option>
            ))}
          </Select>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={carregarRelatorio}
            >
              Buscar
            </Button>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={limparFiltros}
            >
              <Eraser size={16} />
            </Button>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={exportarCSV}
            >
              CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        <div className="mb-4">
            <h2 className="text-2xl font-bold">
            Auditoria de Frete
            </h2>

            <p className="text-sm text-gray-600">
            {dados.length} fretes alterados encontrados
            </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-300">
            <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Cliente</Th>
              <Th>Rota</Th>
              <Th>Vendedor</Th>
              <Th>Data Pedido</Th>
              <Th>Frete Rota</Th>
              <Th>Frete Cobrado</Th>
              <Th>Diferença</Th>
              <Th>Motivo</Th>
            </tr>
          </thead>

          <tbody>
            {dados.map((item) => (
              <tr key={item.id} className="border-t hover:bg-gray-50">
                <Td>{item.numeroPedido}</Td>
                <Td>{item.cliente}</Td>
                <Td>{item.rota}</Td>
                <Td>{item.vendedor}</Td>
                <Td>{formatarData(item.dataPedido)}</Td>
                <Td>{formatarMoeda(item.valorFretePadrao)}</Td>
                <Td>{formatarMoeda(item.valorFreteCobrado)}</Td>
                <Td>
                  <span
                    className={
                      item.diferenca > 0
                        ? "text-green-700 font-semibold"
                        : "text-red-700 font-semibold"
                    }
                  >
                    {formatarMoeda(item.diferenca)}
                  </span>
                </Td>
                <Td>{item.motivoAlteracaoFrete}</Td>
              </tr>
            ))}

            {dados.length === 0 && (
              <tr>
                <Td colSpan="9">Nenhum frete alterado encontrado.</Td>
              </tr>
            )}
          </tbody>
            </Table>
        </div>
      </div>
    </div>
  )
}