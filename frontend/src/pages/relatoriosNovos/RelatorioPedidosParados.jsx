import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Table, Td, Th } from "../../components/ui/Table"
import { BadgeStatus } from "../../components/ui/BadgeStatus"
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/FeedbackState"
import { Clock3, Download, Eye, Hourglass, Search, TriangleAlert } from "lucide-react"

function formatarData(valor, usarUTC = false) {
  if (!valor) return "-"
  return new Date(valor).toLocaleDateString("pt-BR", usarUTC ? { timeZone: "UTC" } : undefined)
}

function numeroPedido(pedido) {
  return pedido.origemPedido === "EXTERNO" && pedido.numeroPedidoManual
    ? pedido.numeroPedidoManual
    : `#${pedido.numeroPedido}`
}

const niveis = {
  RECENTE: { texto: "Recente", classe: "bg-gray-100 text-gray-700" },
  ATENCAO: { texto: "Atenção", classe: "bg-yellow-100 text-yellow-800" },
  ALTO: { texto: "Alto", classe: "bg-orange-100 text-orange-800" },
  CRITICO: { texto: "Crítico", classe: "bg-red-100 text-red-800" }
}

function Card({ titulo, valor, icon: Icon, classe = "border-gray-200 bg-white text-gray-900" }) {
  return <div className={`rounded-xl border p-4 shadow-sm ${classe}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm opacity-75">{titulo}</p><strong className="mt-1 block text-2xl">{valor}</strong></div><Icon size={25} aria-hidden="true" /></div></div>
}

export function RelatorioPedidosParados() {
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)
  const [vendedores, setVendedores] = useState([])
  const [status, setStatus] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [busca, setBusca] = useState("")
  const [minimoDias, setMinimoDias] = useState(3)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  async function carregarRelatorio(filtros = {}) {
    setCarregando(true)
    try {
      const response = await api.get("/relatorios-novos/pedidos-parados", {
        params: { status, vendedorId, busca, minimoDias, ...filtros }
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
      } catch (error) { console.log(error) }
      carregarRelatorio()
    }
    iniciar()
  }, [])

  function aplicar(event) { event.preventDefault(); carregarRelatorio() }

  function limpar() {
    setStatus(""); setVendedorId(""); setBusca(""); setMinimoDias(3)
    carregarRelatorio({ status: "", vendedorId: "", busca: "", minimoDias: 3 })
  }

  function exportarCSV() {
    const cabecalho = ["Pedido", "Cliente", "Vendedor", "Status", "Data entrega", "Última mudança", "Dias sem mudança", "Nível", "Fonte"]
    const linhas = dados.map((item) => [numeroPedido(item), item.cliente?.nome, item.vendedor?.nome, item.status, formatarData(item.dataEntrega, true), formatarData(item.dataUltimaMudancaStatus), item.diasParado, niveis[item.nivel]?.texto, item.fonteUltimaMudanca])
    const csv = [cabecalho, ...linhas].map((linha) => linha.map((campo) => `"${String(campo ?? "").replace(/"/g, '""')}"`).join(";")).join("\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a"); link.href = url; link.download = "pedidos-parados.csv"; link.click(); URL.revokeObjectURL(url)
  }

  const possuiEstimativas = dados.some((item) => item.fonteUltimaMudanca === "CADASTRO")

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h1 className="text-xl font-bold text-blue-950">Pedidos Parados</h1>
        <p className="mt-1 text-sm text-blue-800">Mostra pedidos ativos sem mudança de status pelo período mínimo selecionado.</p>
      </div>

      <form onSubmit={aplicar} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pedido ou cliente..." className="pl-9" /></div>
          <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status ativos</option><option value="ABERTO">Aberto</option><option value="EM_SEPARACAO">Em separação</option><option value="EM_PRODUCAO">Em produção</option><option value="PRONTO_ENTREGA">Pronto entrega</option><option value="SAIU_ENTREGA">Saiu para entrega</option></Select>
          <Select aria-label="Vendedor" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}><option value="">Todos os vendedores</option>{vendedores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</Select>
          <Select aria-label="Tempo mínimo parado" value={minimoDias} onChange={(e) => setMinimoDias(Number(e.target.value))}><option value={0}>Todos</option><option value={3}>3 dias ou mais</option><option value={7}>7 dias ou mais</option><option value={15}>15 dias ou mais</option><option value={30}>30 dias ou mais</option></Select>
        </div>
        <div className="mt-3 flex gap-2"><Button type="submit" loading={carregando}>Aplicar filtros</Button><Button type="button" variant="dangerSoft" onClick={limpar}>Limpar</Button></div>
      </form>

      {carregando ? <LoadingState mensagem="Analisando pedidos sem movimentação..." /> : erro ? <ErrorState onRetry={() => carregarRelatorio()} /> : <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Card titulo="Pedidos encontrados" valor={resumo?.total || 0} icon={Hourglass} />
          <Card titulo="Atenção (3–6 dias)" valor={resumo?.atencao || 0} icon={Clock3} classe="border-yellow-200 bg-yellow-50 text-yellow-900" />
          <Card titulo="Alto (7–14 dias)" valor={resumo?.alto || 0} icon={TriangleAlert} classe="border-orange-200 bg-orange-50 text-orange-900" />
          <Card titulo="Críticos (15+ dias)" valor={resumo?.critico || 0} icon={TriangleAlert} classe="border-red-200 bg-red-50 text-red-900" />
          <Card titulo="Maior tempo" valor={`${resumo?.maiorTempo || 0} dia(s)`} icon={Clock3} />
        </div>

        {possuiEstimativas && <p className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900" role="status">Alguns pedidos antigos não possuem histórico de status; nesses casos, o tempo é contado desde o cadastro e aparece como “Estimado”.</p>}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-gray-900">Fila por tempo sem movimentação</h2><p className="text-sm text-gray-500">Pedidos com maior tempo aparecem primeiro.</p></div><Button type="button" variant="secondary" disabled={!dados.length} onClick={exportarCSV}><Download size={16} />Exportar CSV</Button></div>
          {dados.length === 0 ? <EmptyState titulo="Nenhum pedido parado" descricao="Nenhum pedido corresponde aos filtros selecionados." /> : <Table label="Pedidos parados"><thead><tr><Th>Pedido</Th><Th>Cliente</Th><Th>Vendedor</Th><Th>Status</Th><Th>Entrega</Th><Th>Última mudança</Th><Th>Tempo</Th><Th>Nível</Th><Th>Ação</Th></tr></thead><tbody>{dados.map((item) => { const nivel = niveis[item.nivel]; return <tr key={item.id}><Td><strong>{numeroPedido(item)}</strong></Td><Td>{item.cliente?.nome || "-"}</Td><Td>{item.vendedor?.nome || "-"}</Td><Td><BadgeStatus status={item.status} /></Td><Td>{formatarData(item.dataEntrega, true)}</Td><Td>{formatarData(item.dataUltimaMudancaStatus)}{item.fonteUltimaMudanca === "CADASTRO" && <span className="ml-2 text-xs text-yellow-700">Estimado</span>}</Td><Td><strong>{item.diasParado} dia(s)</strong></Td><Td><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${nivel.classe}`}>{nivel.texto}</span></Td><Td><Link to={`/pedidos/${item.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Eye size={16} />Ver</Link></Td></tr> })}</tbody></Table>}
        </div>
      </>}
    </div>
  )
}
