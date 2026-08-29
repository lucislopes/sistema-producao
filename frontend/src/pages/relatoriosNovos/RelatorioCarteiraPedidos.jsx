import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Table, Td, Th } from "../../components/ui/Table"
import { BadgeStatus } from "../../components/ui/BadgeStatus"
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/FeedbackState"
import { CalendarClock, Download, Eye, Search, ShoppingCart, TriangleAlert, WalletCards } from "lucide-react"

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatarData(valor, usarUTC = false) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR", usarUTC ? { timeZone: "UTC" } : undefined) : "Sem previsão"
}

function numeroPedido(pedido) {
  return pedido.origemPedido === "EXTERNO" && pedido.numeroPedidoManual ? pedido.numeroPedidoManual : `#${pedido.numeroPedido}`
}

const previsoes = {
  ATRASADO: { texto: "Atrasado", classe: "bg-red-100 text-red-800" },
  HOJE: { texto: "Entrega hoje", classe: "bg-orange-100 text-orange-800" },
  PROXIMOS_7_DIAS: { texto: "Próximos 7 dias", classe: "bg-yellow-100 text-yellow-800" },
  FUTURO: { texto: "Programado", classe: "bg-blue-100 text-blue-800" },
  SEM_PREVISAO: { texto: "Sem previsão", classe: "bg-gray-100 text-gray-700" }
}

function Card({ titulo, valor, complemento, icon: Icon, classe = "border-gray-200 bg-white text-gray-900" }) {
  return <div className={`rounded-xl border p-4 shadow-sm ${classe}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm opacity-75">{titulo}</p><strong className="mt-1 block text-2xl">{valor}</strong>{complemento && <span className="mt-1 block text-xs opacity-75">{complemento}</span>}</div><Icon size={25} aria-hidden="true" /></div></div>
}

export function RelatorioCarteiraPedidos() {
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porStatus, setPorStatus] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  async function carregarRelatorio(filtros = {}) {
    setCarregando(true)
    try {
      const response = await api.get("/relatorios-novos/carteira-pedidos", { params: { busca, status, vendedorId, dataInicio, dataFim, ...filtros } })
      setDados(response.data.dados || [])
      setResumo(response.data.resumo || null)
      setPorStatus(response.data.porStatus || [])
      setErro(false)
    } catch (error) { console.log(error); setErro(true) }
    finally { setCarregando(false) }
  }

  useEffect(() => {
    async function iniciar() {
      try { const response = await api.get("/funcionarios/vendedores"); setVendedores(response.data || []) }
      catch (error) { console.log(error) }
      carregarRelatorio()
    }
    iniciar()
  }, [])

  function aplicar(event) { event.preventDefault(); carregarRelatorio() }
  function limpar() {
    setBusca(""); setStatus(""); setVendedorId(""); setDataInicio(""); setDataFim("")
    carregarRelatorio({ busca: "", status: "", vendedorId: "", dataInicio: "", dataFim: "" })
  }

  function exportarCSV() {
    const cabecalho = ["Pedido", "Cliente", "Vendedor", "Status", "Entrega", "Situação", "Dias para entrega", "Valor"]
    const linhas = dados.map((item) => [numeroPedido(item), item.cliente?.nome, item.vendedor?.nome, item.status, formatarData(item.dataEntrega, true), previsoes[item.previsao]?.texto, item.diasParaEntrega ?? "-", item.valorTotal])
    const csv = [cabecalho, ...linhas].map((linha) => linha.map((campo) => `"${String(campo ?? "").replace(/"/g, '""')}"`).join(";")).join("\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a"); link.href = url; link.download = "carteira-pedidos.csv"; link.click(); URL.revokeObjectURL(url)
  }

  return <div className="space-y-5">
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><h1 className="text-xl font-bold text-blue-950">Carteira de Pedidos</h1><p className="mt-1 text-sm text-blue-800">Visão financeira dos pedidos ativos, organizada pela urgência da previsão de entrega.</p></div>

    <form onSubmit={aplicar} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pedido ou cliente..." className="pl-9" /></div>
        <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status ativos</option><option value="ABERTO">Aberto</option><option value="EM_SEPARACAO">Em separação</option><option value="EM_PRODUCAO">Em produção</option><option value="PRONTO_ENTREGA">Pronto entrega</option><option value="SAIU_ENTREGA">Saiu para entrega</option></Select>
        <Select aria-label="Vendedor" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}><option value="">Todos os vendedores</option>{vendedores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</Select>
        <Input aria-label="Entrega inicial" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        <Input aria-label="Entrega final" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
      </div>
      <div className="mt-3 flex gap-2"><Button type="submit" loading={carregando}>Aplicar filtros</Button><Button type="button" variant="dangerSoft" onClick={limpar}>Limpar</Button></div>
    </form>

    {carregando ? <LoadingState mensagem="Calculando a carteira de pedidos..." /> : erro ? <ErrorState onRetry={() => carregarRelatorio()} /> : <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card titulo="Pedidos ativos" valor={resumo?.totalPedidos || 0} icon={ShoppingCart} />
        <Card titulo="Valor da carteira" valor={formatarMoeda(resumo?.valorCarteira)} icon={WalletCards} classe="border-green-200 bg-green-50 text-green-900" />
        <Card titulo="Pedidos atrasados" valor={resumo?.pedidosAtrasados || 0} complemento={formatarMoeda(resumo?.valorAtrasado)} icon={TriangleAlert} classe="border-red-200 bg-red-50 text-red-900" />
        <Card titulo="Entregas em até 7 dias" valor={resumo?.proximosSeteDias || 0} complemento={formatarMoeda(resumo?.valorProximosSeteDias)} icon={CalendarClock} classe="border-yellow-200 bg-yellow-50 text-yellow-900" />
        <Card titulo="Sem previsão" valor={resumo?.semPrevisao || 0} icon={CalendarClock} />
      </div>

      {porStatus.length > 0 && <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3">{porStatus.map((item) => <div key={item.status} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"><BadgeStatus status={item.status} /><span className="text-sm text-gray-600">{item.pedidos} pedido(s) · <strong>{formatarMoeda(item.valor)}</strong></span></div>)}</div>}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-gray-900">Prioridade da carteira</h2><p className="text-sm text-gray-500">Atrasados aparecem primeiro; pedidos sem previsão ficam ao final.</p></div><Button type="button" variant="secondary" disabled={!dados.length} onClick={exportarCSV}><Download size={16} />Exportar CSV</Button></div>
        {dados.length === 0 ? <EmptyState titulo="Nenhum pedido ativo encontrado" descricao="Não há pedidos correspondentes aos filtros selecionados." /> : <Table label="Carteira de pedidos ativos"><thead><tr><Th>Pedido</Th><Th>Cliente</Th><Th>Vendedor</Th><Th>Status</Th><Th>Entrega</Th><Th>Situação</Th><Th>Prazo</Th><Th>Valor</Th><Th>Ação</Th></tr></thead><tbody>{dados.map((item) => { const previsao = previsoes[item.previsao]; return <tr key={item.id}><Td><strong>{numeroPedido(item)}</strong></Td><Td>{item.cliente?.nome || "-"}</Td><Td>{item.vendedor?.nome || "-"}</Td><Td><BadgeStatus status={item.status} /></Td><Td>{formatarData(item.dataEntrega, true)}</Td><Td><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${previsao.classe}`}>{previsao.texto}</span></Td><Td>{item.diasParaEntrega === null ? "-" : item.diasParaEntrega < 0 ? `${Math.abs(item.diasParaEntrega)} dia(s) vencido` : item.diasParaEntrega === 0 ? "Hoje" : `${item.diasParaEntrega} dia(s)`}</Td><Td><strong>{formatarMoeda(item.valorTotal)}</strong></Td><Td><Link to={`/pedidos/${item.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Eye size={16} />Ver</Link></Td></tr> })}</tbody></Table>}
      </div>
    </>}
  </div>
}
