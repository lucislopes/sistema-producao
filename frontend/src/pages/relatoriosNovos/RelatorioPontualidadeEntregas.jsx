import { useEffect, useState } from "react"
import { api } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Table, Td, Th } from "../../components/ui/Table"
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/FeedbackState"
import { CalendarCheck, Clock3, Download, PackageCheck, TriangleAlert } from "lucide-react"

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

function formatarData(valor) {
  if (!valor) return "-"
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}

function numeroPedido(pedido) {
  return pedido.origemPedido === "EXTERNO" && pedido.numeroPedidoManual
    ? pedido.numeroPedidoManual
    : `#${pedido.numeroPedido}`
}

const situacoes = {
  NO_PRAZO: { texto: "No prazo", classe: "bg-green-100 text-green-800" },
  COM_ATRASO: { texto: "Com atraso", classe: "bg-red-100 text-red-800" },
  SEM_REGISTRO_ENTREGA: { texto: "Sem registro da baixa", classe: "bg-yellow-100 text-yellow-800" },
  SEM_DATA_PREVISTA: { texto: "Sem data prevista", classe: "bg-gray-100 text-gray-700" }
}

function Card({ titulo, valor, icon: Icon, classe = "border-gray-200 bg-white text-gray-900" }) {
  return <div className={`rounded-xl border p-4 shadow-sm ${classe}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm opacity-75">{titulo}</p><strong className="mt-1 block text-2xl">{valor}</strong></div><Icon size={25} aria-hidden="true" /></div></div>
}

export function RelatorioPontualidadeEntregas() {
  const mesAtual = periodoMesAtual()
  const [dataInicio, setDataInicio] = useState(mesAtual.inicio)
  const [dataFim, setDataFim] = useState(mesAtual.fim)
  const [vendedorId, setVendedorId] = useState("")
  const [rotaId, setRotaId] = useState("")
  const [vendedores, setVendedores] = useState([])
  const [rotas, setRotas] = useState([])
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  async function carregarRelatorio(filtros = {}) {
    setCarregando(true)
    try {
      const response = await api.get("/relatorios-novos/pontualidade-entregas", {
        params: { dataInicio, dataFim, vendedorId, rotaId, ...filtros }
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
        const [vendedoresRes, rotasRes] = await Promise.all([
          api.get("/funcionarios/vendedores"), api.get("/rotas-entrega")
        ])
        setVendedores(vendedoresRes.data || [])
        setRotas(rotasRes.data || [])
      } catch (error) { console.log(error) }
      carregarRelatorio()
    }
    iniciar()
  }, [])

  function aplicar(event) { event.preventDefault(); carregarRelatorio() }

  function filtroMesAtual() {
    const periodo = periodoMesAtual()
    setDataInicio(periodo.inicio); setDataFim(periodo.fim); setVendedorId(""); setRotaId("")
    carregarRelatorio({ dataInicio: periodo.inicio, dataFim: periodo.fim, vendedorId: "", rotaId: "" })
  }

  function filtroTodoPeriodo() {
    setDataInicio(""); setDataFim(""); setVendedorId(""); setRotaId("")
    carregarRelatorio({ dataInicio: "", dataFim: "", vendedorId: "", rotaId: "" })
  }

  function exportarCSV() {
    const cabecalho = ["Pedido", "Cliente", "Vendedor", "Rota", "Prevista", "Realizada", "Situação", "Dias de diferença"]
    const linhas = dados.map((item) => [numeroPedido(item), item.cliente?.nome, item.vendedor?.nome, item.rota?.nome, formatarData(item.dataEntrega), formatarData(item.dataEntregaReal), situacoes[item.situacao]?.texto, item.diasDiferenca ?? ""])
    const csv = [cabecalho, ...linhas].map((linha) => linha.map((campo) => `"${String(campo ?? "").replace(/"/g, '""')}"`).join(";")).join("\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a"); link.href = url; link.download = "pontualidade-entregas.csv"; link.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h1 className="text-xl font-bold text-blue-950">Pontualidade das Entregas</h1>
        <p className="mt-1 text-sm text-blue-800">Compara a data prevista com a baixa de entrega registrada no histórico. O período considera a data prevista.</p>
      </div>

      <form onSubmit={aplicar} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input type="date" aria-label="Data prevista inicial" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <Input type="date" aria-label="Data prevista final" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          <Select aria-label="Vendedor" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}><option value="">Todos os vendedores</option>{vendedores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</Select>
          <Select aria-label="Rota" value={rotaId} onChange={(e) => setRotaId(e.target.value)}><option value="">Todas as rotas</option>{rotas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</Select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="submit" loading={carregando}>Aplicar filtros</Button>
          <Button type="button" variant="secondary" onClick={filtroMesAtual}>Mês atual</Button>
          <Button type="button" variant="dangerSoft" onClick={filtroTodoPeriodo}>Todo o período</Button>
        </div>
      </form>

      {carregando ? <LoadingState mensagem="Calculando pontualidade..." /> : erro ? <ErrorState onRetry={() => carregarRelatorio()} /> : <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Card titulo="Entregues" valor={resumo?.totalEntregues || 0} icon={PackageCheck} />
          <Card titulo="No prazo" valor={resumo?.noPrazo || 0} icon={CalendarCheck} classe="border-green-200 bg-green-50 text-green-900" />
          <Card titulo="Com atraso" valor={resumo?.comAtraso || 0} icon={TriangleAlert} classe="border-red-200 bg-red-50 text-red-900" />
          <Card titulo="Pontualidade" valor={`${resumo?.percentualNoPrazo || 0}%`} icon={CalendarCheck} classe="border-blue-200 bg-blue-50 text-blue-900" />
          <Card titulo="Média de atraso" valor={`${resumo?.mediaDiasAtraso || 0} dia(s)`} icon={Clock3} />
        </div>

        {(resumo?.semRegistro > 0 || resumo?.semDataPrevista > 0) && <p className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900" role="status">Há {resumo.semRegistro} entrega(s) sem registro histórico da baixa e {resumo.semDataPrevista} sem data prevista. Elas não entram no percentual.</p>}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-gray-900">Detalhamento das entregas</h2><p className="text-sm text-gray-500">Datas e diferença em dias por pedido.</p></div><Button type="button" variant="secondary" disabled={!dados.length} onClick={exportarCSV}><Download size={16} />Exportar CSV</Button></div>
          {dados.length === 0 ? <EmptyState titulo="Nenhuma entrega encontrada" descricao="Altere o período ou os filtros." /> : <Table label="Pontualidade das entregas"><thead><tr><Th>Pedido</Th><Th>Cliente</Th><Th>Vendedor</Th><Th>Rota</Th><Th>Prevista</Th><Th>Realizada</Th><Th>Situação</Th><Th>Diferença</Th></tr></thead><tbody>{dados.map((item) => { const situacao = situacoes[item.situacao] || situacoes.SEM_REGISTRO_ENTREGA; return <tr key={item.id}><Td><strong>{numeroPedido(item)}</strong></Td><Td>{item.cliente?.nome || "-"}</Td><Td>{item.vendedor?.nome || "-"}</Td><Td>{item.rota?.nome || (item.tipoEntrega === "CLIENTE_RETIRA" ? "Cliente retira" : "-")}</Td><Td>{formatarData(item.dataEntrega)}</Td><Td>{formatarData(item.dataEntregaReal)}</Td><Td><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${situacao.classe}`}>{situacao.texto}</span></Td><Td>{item.diasDiferenca == null ? "-" : item.diasDiferenca > 0 ? `+${item.diasDiferenca} dia(s)` : item.diasDiferenca === 0 ? "No dia" : `${Math.abs(item.diasDiferenca)} dia(s) antes`}</Td></tr> })}</tbody></Table>}
        </div>
      </>}
    </div>
  )
}
