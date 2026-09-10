import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackState"
import {
  Search,
  CalendarDays,
  Eraser,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Printer
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

function ResumoCard({ titulo, valor, detalhe, tipo = "normal", icon: Icon }) {
  const estilos = {
    normal: "border-gray-200 bg-white text-gray-900",
    sucesso: "border-green-200 bg-green-50 text-green-900",
    perigo: "border-red-200 bg-red-50 text-red-900",
    info: "border-blue-200 bg-blue-50 text-blue-900"
  }

  return (
    <div className={`border rounded-xl p-4 shadow-sm ${estilos[tipo] || estilos.normal}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{titulo}</p>
          <strong className="text-2xl font-bold">{valor}</strong>
          {detalhe && <p className="mt-1 text-xs text-gray-600">{detalhe}</p>}
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
    valorAumentos: 0,
    valorDescontos: 0,
    impactoTotal: 0
  })

  const [vendedores, setVendedores] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState("")

  const [busca, setBusca] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [vendedorId, setVendedorId] = useState("")

  async function carregarRelatorio(filtros = {}) {
    setCarregando(true)
    setErro("")

    try {
      const response = await api.get("/relatorio-frete/auditoria", {
        params: {
            busca,
            dataInicio,
            dataFim,
            vendedorId,
            ...filtros
        }
        })

      setDados(response.data.dados)
      setResumo(response.data.resumo)
    } catch (error) {
      console.error(error)
      setErro(
        error.response?.data?.error ||
        "Erro ao carregar relatório de auditoria de frete"
      )
    } finally {
      setCarregando(false)
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
    api.get("/configuracao-empresa")
      .then((response) => setEmpresa(response.data))
      .catch((error) => console.error(error))
    // A primeira carga utiliza intencionalmente os filtros vazios da montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function limparFiltros() {
    setBusca("")
    setDataInicio("")
    setDataFim("")
    setVendedorId("")
    carregarRelatorio({ busca: "", dataInicio: "", dataFim: "", vendedorId: "" })
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

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "auditoria-frete.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  function imprimir() {
    window.print()
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-end gap-2 no-print">
        <Button type="button" variant="success" onClick={exportarCSV} disabled={dados.length === 0}>
          <Download size={17} />
          Exportar CSV
        </Button>
        <Button type="button" variant="dark" onClick={imprimir} disabled={dados.length === 0}>
          <Printer size={17} />
          Imprimir
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 no-print">
        <ResumoCard
          titulo="Fretes Alterados"
          valor={resumo.total}
          icon={FileText}
        />

        <ResumoCard
          titulo="Aumentos"
          valor={resumo.aumentos}
          detalhe={`${formatarMoeda(resumo.valorAumentos)} adicionados`}
          tipo="sucesso"
          icon={TrendingUp}
        />

        <ResumoCard
          titulo="Descontos"
          valor={resumo.descontos}
          detalhe={`${formatarMoeda(resumo.valorDescontos)} concedidos`}
          tipo="perigo"
          icon={TrendingDown}
        />

        <ResumoCard
          titulo="Impacto Total"
          valor={formatarMoeda(resumo.impactoTotal)}
          detalhe={resumo.impactoTotal >= 0 ? "Impacto líquido positivo" : "Impacto líquido negativo"}
          tipo={resumo.impactoTotal >= 0 ? "sucesso" : "perigo"}
          icon={DollarSign}
        />
      </div>

      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 no-print">
        Este relatório compara o frete padrão da rota com o valor efetivamente cobrado nos pedidos marcados como frete alterado.
      </div>

      <form onSubmit={(event) => { event.preventDefault(); carregarRelatorio() }} className="bg-white p-4 rounded-2xl shadow-md mb-4 no-print">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <label className="relative text-sm font-medium text-gray-700">
            Pedido, cliente, rota ou vendedor
            <Search
              size={18}
              className="absolute left-3 bottom-3.5 text-gray-400"
            />

            <Input
              type="text"
              placeholder="Pedido, cliente, rota..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="mt-1 pl-10"
            />
          </label>

          <label className="relative text-sm font-medium text-gray-700">
            Data inicial
            <CalendarDays
              size={18}
              className="absolute left-3 bottom-3.5 text-gray-400"
            />

            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="mt-1 pl-10"
            />
          </label>

          <label className="relative text-sm font-medium text-gray-700">
            Data final
            <CalendarDays
              size={18}
              className="absolute left-3 bottom-3.5 text-gray-400"
            />

            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="mt-1 pl-10"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Vendedor
            <Select className="mt-1" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
              <option value="">Todos os vendedores</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>
              ))}
            </Select>
          </label>

          <div className="flex gap-2">
            <Button
              type="submit"
              loading={carregando}
              className="flex-1"
            >
              Buscar
            </Button>

            <Button
              type="button"
              variant="dangerSoft"
              onClick={limparFiltros}
              disabled={carregando || (!busca && !dataInicio && !dataFim && !vendedorId)}
              className="flex-1"
            >
              <Eraser size={16} />
              Limpar
            </Button>
          </div>
        </div>
      </form>

      <CabecalhoImpressao
        empresa={empresa}
        titulo="Relatório de Auditoria de Frete"
        periodoInicio={dataInicio}
        periodoFim={dataFim}
      />

      <div className="bg-white p-6 rounded-2xl shadow-md print-area">
        <div className="mb-4">
            <h2 className="text-2xl font-bold">
            Auditoria de Frete
            </h2>

            <p className="text-sm text-gray-600">
            {dados.length} {dados.length === 1 ? "frete alterado encontrado" : "fretes alterados encontrados"}
            </p>
        </div>

        {carregando && <LoadingState mensagem="Analisando as alterações de frete..." />}

        {!carregando && erro && (
          <ErrorState descricao={erro} onRetry={() => carregarRelatorio()} />
        )}

        {!carregando && !erro && dados.length === 0 && (
          <EmptyState
            titulo="Nenhuma alteração de frete encontrada"
            descricao="Não há pedidos com frete alterado para os filtros selecionados."
          />
        )}

        {!carregando && !erro && dados.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-300">
            <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Cliente</Th>
              <Th>Rota</Th>
              <Th>Vendedor</Th>
              <Th>Data Pedido</Th>
              <Th>Data Entrega</Th>
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
                <Td>{formatarData(item.dataEntrega)}</Td>
                <Td>{formatarMoeda(item.valorFretePadrao)}</Td>
                <Td>{formatarMoeda(item.valorFreteCobrado)}</Td>
                <Td>
                  <span
                    className={
                      item.diferenca > 0
                        ? "text-green-700 font-semibold"
                        : item.diferenca < 0
                          ? "text-red-700 font-semibold"
                          : "text-gray-700 font-semibold"
                    }
                  >
                    {formatarMoeda(item.diferenca)}
                  </span>
                </Td>
                <Td>{item.motivoAlteracaoFrete}</Td>
              </tr>
            ))}

          </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
