import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Table, Td, Th } from "../../components/ui/Table"
import { BadgeStatus } from "../../components/ui/BadgeStatus"
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/FeedbackState"
import { ClipboardCheck, Download, Eye, FileWarning, Search, TriangleAlert, Truck, WalletCards } from "lucide-react"

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-"
}

function numeroPedido(pedido) {
  return pedido.origemPedido === "EXTERNO" && pedido.numeroPedidoManual ? pedido.numeroPedidoManual : `#${pedido.numeroPedido}`
}

const gravidades = {
  CRITICO: { texto: "Crítico", classe: "bg-red-100 text-red-800" },
  ATENCAO: { texto: "Atenção", classe: "bg-yellow-100 text-yellow-800" },
  INFORMATIVO: { texto: "Informativo", classe: "bg-blue-100 text-blue-800" }
}

function Card({ titulo, valor, icon: Icon, classe = "border-gray-200 bg-white text-gray-900" }) {
  return <div className={`rounded-xl border p-4 shadow-sm ${classe}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm opacity-75">{titulo}</p><strong className="mt-1 block text-2xl">{valor}</strong></div><Icon size={25} aria-hidden="true" /></div></div>
}

export function RelatorioAuditoriaCadastro() {
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)
  const [vendedores, setVendedores] = useState([])
  const [busca, setBusca] = useState("")
  const [tipo, setTipo] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  async function carregarRelatorio(filtros = {}) {
    setCarregando(true)
    try {
      const response = await api.get("/relatorios-novos/auditoria-cadastro", { params: { busca, tipo, vendedorId, ...filtros } })
      setDados(response.data.dados || [])
      setResumo(response.data.resumo || null)
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
    setBusca(""); setTipo(""); setVendedorId("")
    carregarRelatorio({ busca: "", tipo: "", vendedorId: "" })
  }

  function exportarCSV() {
    const cabecalho = ["Pedido", "Cliente", "Vendedor", "Status", "Entrega", "Tipo entrega", "Gravidade", "Inconsistências"]
    const linhas = dados.map((item) => [numeroPedido(item), item.cliente?.nome, item.vendedor?.nome, item.status, formatarData(item.dataEntrega), item.tipoEntrega, gravidades[item.gravidade]?.texto, item.inconsistencias.map((inc) => inc.texto).join(" | ")])
    const csv = [cabecalho, ...linhas].map((linha) => linha.map((campo) => `"${String(campo ?? "").replace(/"/g, '""')}"`).join(";")).join("\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a"); link.href = url; link.download = "auditoria-cadastro-pedidos.csv"; link.click(); URL.revokeObjectURL(url)
  }

  return <div className="space-y-5">
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><h1 className="text-xl font-bold text-blue-950">Auditoria de Cadastro dos Pedidos</h1><p className="mt-1 text-sm text-blue-800">Localiza campos incompletos em pedidos ativos antes que causem problemas financeiros ou na entrega.</p></div>

    <form onSubmit={aplicar} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pedido ou cliente..." className="pl-9" /></div>
        <Select aria-label="Tipo de inconsistência" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todas as inconsistências</option><option value="SEM_VALOR">Sem valor do pedido</option><option value="SEM_DATA_ENTREGA">Sem data de entrega</option><option value="ENTREGA_SEM_ROTA">Entrega sem rota</option><option value="ENTREGA_SEM_ENDERECO">Entrega sem endereço</option><option value="ENTREGA_SEM_RECEBEDOR">Entrega sem recebedor</option><option value="ENTREGA_SEM_CONTATO">Entrega sem contato</option><option value="CLIENTE_SEM_TELEFONE">Cliente sem telefone</option></Select>
        <Select aria-label="Vendedor" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}><option value="">Todos os vendedores</option>{vendedores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</Select>
        <Button type="submit" loading={carregando}>Aplicar filtros</Button>
      </div>
      <div className="mt-3"><Button type="button" variant="dangerSoft" onClick={limpar}>Limpar</Button></div>
    </form>

    {carregando ? <LoadingState mensagem="Auditando os pedidos ativos..." /> : erro ? <ErrorState onRetry={() => carregarRelatorio()} /> : <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card titulo="Pedidos auditados" valor={resumo?.pedidosAuditados || 0} icon={ClipboardCheck} />
        <Card titulo="Com inconsistências" valor={resumo?.pedidosComInconsistencia || 0} icon={FileWarning} classe="border-yellow-200 bg-yellow-50 text-yellow-900" />
        <Card titulo="Pedidos críticos" valor={resumo?.criticos || 0} icon={TriangleAlert} classe="border-red-200 bg-red-50 text-red-900" />
        <Card titulo="Pedidos sem valor" valor={resumo?.semValor || 0} icon={WalletCards} classe="border-orange-200 bg-orange-50 text-orange-900" />
        <Card titulo="Entrega incompleta" valor={resumo?.entregaIncompleta || 0} icon={Truck} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-gray-900">Itens para conferência</h2><p className="text-sm text-gray-500">Pedidos críticos e com mais campos pendentes aparecem primeiro.</p></div><Button type="button" variant="secondary" disabled={!dados.length} onClick={exportarCSV}><Download size={16} />Exportar CSV</Button></div>
        {dados.length === 0 ? <EmptyState titulo="Cadastros completos" descricao="Nenhuma inconsistência foi encontrada nos pedidos correspondentes." /> : <Table label="Auditoria de cadastro dos pedidos"><thead><tr><Th>Pedido</Th><Th>Cliente</Th><Th>Vendedor</Th><Th>Status</Th><Th>Entrega</Th><Th>Gravidade</Th><Th>Campos para corrigir</Th><Th>Ação</Th></tr></thead><tbody>{dados.map((item) => { const gravidade = gravidades[item.gravidade]; return <tr key={item.id}><Td><strong>{numeroPedido(item)}</strong></Td><Td>{item.cliente?.nome || "-"}</Td><Td>{item.vendedor?.nome || "-"}</Td><Td><BadgeStatus status={item.status} /></Td><Td>{formatarData(item.dataEntrega)}</Td><Td><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${gravidade.classe}`}>{gravidade.texto}</span></Td><Td><div className="flex max-w-xl flex-wrap gap-1.5">{item.inconsistencias.map((inc) => <span key={inc.tipo} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">{inc.texto}</span>)}</div></Td><Td><Link to={`/pedidos/${item.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Eye size={16} />Corrigir</Link></Td></tr> })}</tbody></Table>}
      </div>
    </>}
  </div>
}
