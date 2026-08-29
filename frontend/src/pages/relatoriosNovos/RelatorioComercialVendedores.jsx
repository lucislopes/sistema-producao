import { useEffect, useState } from "react"
import { api } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Table, Td, Th } from "../../components/ui/Table"
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/FeedbackState"
import { CircleDollarSign, Download, ShoppingCart, TrendingUp, TriangleAlert, Users } from "lucide-react"

function formatarDataFiltro(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

function periodoMesAtual() {
  const hoje = new Date()
  return {
    inicio: formatarDataFiltro(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    fim: formatarDataFiltro(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0))
  }
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function Card({ titulo, valor, icon: Icon, tipo = "normal" }) {
  const estilos = {
    normal: "border-gray-200 bg-white text-gray-900",
    info: "border-blue-200 bg-blue-50 text-blue-900",
    sucesso: "border-green-200 bg-green-50 text-green-900",
    alerta: "border-red-200 bg-red-50 text-red-900"
  }

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${estilos[tipo]}`}>
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-sm opacity-75">{titulo}</p><strong className="mt-1 block text-2xl">{valor}</strong></div>
        <Icon size={25} aria-hidden="true" />
      </div>
    </div>
  )
}

export function RelatorioComercialVendedores() {
  const mesAtual = periodoMesAtual()
  const [dataInicio, setDataInicio] = useState(mesAtual.inicio)
  const [dataFim, setDataFim] = useState(mesAtual.fim)
  const [vendedorId, setVendedorId] = useState("")
  const [vendedores, setVendedores] = useState([])
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  async function carregarRelatorio(filtros = {}) {
    setCarregando(true)
    try {
      const response = await api.get("/relatorios-novos/comercial-vendedores", {
        params: { dataInicio, dataFim, vendedorId, ...filtros }
      })
      setDados(response.data.dados || [])
      setResumo(response.data.resumo || null)
      setErro(false)
    } catch (error) {
      console.log(error)
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    async function iniciar() {
      try {
        const response = await api.get("/funcionarios/vendedores")
        setVendedores(response.data || [])
      } catch (error) {
        console.log(error)
      }
      carregarRelatorio()
    }
    iniciar()
  }, [])

  function aplicarFiltros(event) {
    event.preventDefault()
    carregarRelatorio()
  }

  function filtroMesAtual() {
    const periodo = periodoMesAtual()
    setDataInicio(periodo.inicio)
    setDataFim(periodo.fim)
    setVendedorId("")
    carregarRelatorio({ dataInicio: periodo.inicio, dataFim: periodo.fim, vendedorId: "" })
  }

  function filtroTodoPeriodo() {
    setDataInicio("")
    setDataFim("")
    setVendedorId("")
    carregarRelatorio({ dataInicio: "", dataFim: "", vendedorId: "" })
  }

  function exportarCSV() {
    const cabecalho = ["Posição", "Vendedor", "Pedidos", "Válidos", "Valor vendido", "Ticket médio", "Entregues", "Em andamento", "Atrasados", "Cancelados"]
    const linhas = dados.map((item, index) => [
      index + 1, item.vendedor, item.totalPedidos, item.pedidosValidos, item.valorVendido,
      item.ticketMedio, item.entregues, item.emAndamento, item.atrasados, item.cancelados
    ])
    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => `"${String(campo ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "relatorio-comercial-vendedores.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h1 className="text-xl font-bold text-blue-950">Relatório Comercial por Vendedor</h1>
        <p className="mt-1 text-sm text-blue-800">Visão gerencial de pedidos e valores com base na data do pedido. Pedidos cancelados não entram no valor vendido.</p>
      </div>

      <form onSubmit={aplicarFiltros} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input type="date" aria-label="Data inicial" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <Input type="date" aria-label="Data final" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          <Select aria-label="Vendedor" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
            <option value="">Todos os vendedores</option>
            {vendedores.map((vendedor) => <option key={vendedor.id} value={vendedor.id}>{vendedor.nome}</option>)}
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={carregando} className="flex-1">Aplicar</Button>
            <Button type="button" variant="secondary" onClick={filtroMesAtual}>Mês atual</Button>
            <Button type="button" variant="dangerSoft" onClick={filtroTodoPeriodo}>Todo o período</Button>
          </div>
        </div>
      </form>

      {carregando ? <LoadingState mensagem="Gerando relatório comercial..." /> : erro ? (
        <ErrorState onRetry={() => carregarRelatorio()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Card titulo="Valor vendido" valor={formatarMoeda(resumo?.valorVendido)} icon={CircleDollarSign} tipo="sucesso" />
            <Card titulo="Pedidos" valor={resumo?.totalPedidos || 0} icon={ShoppingCart} />
            <Card titulo="Ticket médio" valor={formatarMoeda(resumo?.ticketMedio)} icon={TrendingUp} tipo="info" />
            <Card titulo="Vendedores" valor={dados.length} icon={Users} />
            <Card titulo="Atrasados atuais" valor={resumo?.atrasados || 0} icon={TriangleAlert} tipo={resumo?.atrasados ? "alerta" : "normal"} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-bold text-gray-900">Ranking de vendedores</h2><p className="text-sm text-gray-500">Ordenado pelo valor vendido no período.</p></div>
              <Button type="button" variant="secondary" disabled={!dados.length} onClick={exportarCSV}><Download size={16} />Exportar CSV</Button>
            </div>

            {dados.length === 0 ? <EmptyState titulo="Nenhuma venda encontrada" descricao="Altere o período ou o vendedor selecionado." /> : (
              <Table label="Ranking comercial por vendedor">
                <thead><tr><Th>Posição</Th><Th>Vendedor</Th><Th>Pedidos</Th><Th>Valor vendido</Th><Th>Ticket médio</Th><Th>Entregues</Th><Th>Em andamento</Th><Th>Atrasados</Th><Th>Cancelados</Th></tr></thead>
                <tbody>{dados.map((item, index) => (
                  <tr key={item.vendedorId}>
                    <Td><strong>#{index + 1}</strong></Td><Td><strong>{item.vendedor}</strong></Td><Td>{item.totalPedidos}</Td>
                    <Td className="font-semibold text-green-700">{formatarMoeda(item.valorVendido)}</Td><Td>{formatarMoeda(item.ticketMedio)}</Td>
                    <Td>{item.entregues}</Td><Td>{item.emAndamento}</Td><Td className={item.atrasados ? "font-semibold text-red-700" : ""}>{item.atrasados}</Td><Td>{item.cancelados}</Td>
                  </tr>
                ))}</tbody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
