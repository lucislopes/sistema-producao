import { useEffect, useState } from "react"
import { api } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Table, Td, Th } from "../../components/ui/Table"
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/FeedbackState"
import { CalendarDays, Download, Search, ShoppingBag, TriangleAlert, UserRoundCheck, UsersRound, WalletCards } from "lucide-react"

function hojeISO() {
  const data = new Date()
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`
}

function inicioMesISO() {
  const data = new Date()
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR") : "Sem compra válida"
}

function Card({ titulo, valor, icon: Icon, classe = "border-gray-200 bg-white text-gray-900" }) {
  return <div className={`rounded-xl border p-4 shadow-sm ${classe}`}><div className="flex items-center justify-between gap-3"><div><p className="text-sm opacity-75">{titulo}</p><strong className="mt-1 block text-2xl">{valor}</strong></div><Icon size={25} aria-hidden="true" /></div></div>
}

export function RelatorioGerencialClientes() {
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)
  const [dataInicio, setDataInicio] = useState(inicioMesISO)
  const [dataFim, setDataFim] = useState(hojeISO)
  const [busca, setBusca] = useState("")
  const [minimoDiasSemComprar, setMinimoDiasSemComprar] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  async function carregarRelatorio(filtros = {}) {
    setCarregando(true)
    try {
      const response = await api.get("/relatorios-novos/clientes", {
        params: { dataInicio, dataFim, busca, minimoDiasSemComprar, ...filtros }
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

  useEffect(() => { carregarRelatorio() }, [])

  function aplicar(event) { event.preventDefault(); carregarRelatorio() }

  function todoPeriodo() {
    setDataInicio(""); setDataFim("")
    carregarRelatorio({ dataInicio: "", dataFim: "" })
  }

  function limpar() {
    const inicio = inicioMesISO(); const fim = hojeISO()
    setDataInicio(inicio); setDataFim(fim); setBusca(""); setMinimoDiasSemComprar(0)
    carregarRelatorio({ dataInicio: inicio, dataFim: fim, busca: "", minimoDiasSemComprar: 0 })
  }

  function exportarCSV() {
    const cabecalho = ["Posição", "Cliente", "Telefone", "Pedidos válidos", "Valor comprado", "Ticket médio", "Entregues", "Ativos", "Atrasados", "Cancelados", "Última compra geral", "Dias sem comprar"]
    const linhas = dados.map((item, indice) => [indice + 1, item.nome, item.telefone, item.pedidosValidos, item.valorComprado, item.ticketMedio, item.entregues, item.ativos, item.atrasadosAtuais, item.cancelados, formatarData(item.ultimoPedido), item.diasSemComprar ?? "-"])
    const csv = [cabecalho, ...linhas].map((linha) => linha.map((campo) => `"${String(campo ?? "").replace(/"/g, '""')}"`).join(";")).join("\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a"); link.href = url; link.download = "gerencial-clientes.csv"; link.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h1 className="text-xl font-bold text-blue-950">Gerencial de Clientes</h1>
        <p className="mt-1 text-sm text-blue-800">Compare compras, recorrência e pedidos em aberto. A última compra considera todo o histórico do cliente.</p>
      </div>

      <form onSubmit={aplicar} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..." className="pl-9" /></div>
          <Input aria-label="Data inicial" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          <Input aria-label="Data final" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          <Select aria-label="Tempo sem comprar" value={minimoDiasSemComprar} onChange={(e) => setMinimoDiasSemComprar(Number(e.target.value))}><option value={0}>Todos os clientes</option><option value={30}>Sem comprar há 30+ dias</option><option value={60}>Sem comprar há 60+ dias</option><option value={90}>Sem comprar há 90+ dias</option><option value={180}>Sem comprar há 180+ dias</option></Select>
          <Button type="submit" loading={carregando}>Aplicar filtros</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={todoPeriodo}><CalendarDays size={16} />Todo o período</Button><Button type="button" variant="dangerSoft" onClick={limpar}>Limpar</Button></div>
      </form>

      {carregando ? <LoadingState mensagem="Analisando o histórico dos clientes..." /> : erro ? <ErrorState onRetry={() => carregarRelatorio()} /> : <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Card titulo="Clientes no período" valor={resumo?.totalClientes || 0} icon={UsersRound} />
          <Card titulo="Valor comprado" valor={formatarMoeda(resumo?.valorTotal)} icon={WalletCards} classe="border-green-200 bg-green-50 text-green-900" />
          <Card titulo="Ticket médio" valor={formatarMoeda(resumo?.ticketMedio)} icon={ShoppingBag} />
          <Card titulo="Clientes recorrentes" valor={resumo?.clientesRecorrentes || 0} icon={UserRoundCheck} classe="border-blue-200 bg-blue-50 text-blue-900" />
          <Card titulo="Clientes com atrasos" valor={resumo?.clientesComAtrasos || 0} icon={TriangleAlert} classe="border-red-200 bg-red-50 text-red-900" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-gray-900">Ranking de clientes</h2><p className="text-sm text-gray-500">Ordenado pelo valor comprado no período; cancelados não entram no valor nem no ticket.</p></div><Button type="button" variant="secondary" disabled={!dados.length} onClick={exportarCSV}><Download size={16} />Exportar CSV</Button></div>
          {dados.length === 0 ? <EmptyState titulo="Nenhum cliente encontrado" descricao="Não há compras correspondentes aos filtros selecionados." /> : <Table label="Ranking gerencial de clientes"><thead><tr><Th>#</Th><Th>Cliente</Th><Th>Pedidos</Th><Th>Valor comprado</Th><Th>Ticket médio</Th><Th>Entregues</Th><Th>Ativos</Th><Th>Atrasados</Th><Th>Cancelados</Th><Th>Última compra</Th><Th>Inatividade</Th></tr></thead><tbody>{dados.map((item, indice) => <tr key={item.clienteId}><Td><strong>{indice + 1}º</strong></Td><Td><strong>{item.nome}</strong>{item.telefone && <span className="block text-xs text-gray-500">{item.telefone}</span>}</Td><Td>{item.pedidosValidos}</Td><Td><strong>{formatarMoeda(item.valorComprado)}</strong></Td><Td>{formatarMoeda(item.ticketMedio)}</Td><Td>{item.entregues}</Td><Td>{item.ativos}</Td><Td><span className={item.atrasadosAtuais ? "font-bold text-red-700" : "text-gray-600"}>{item.atrasadosAtuais}</span></Td><Td>{item.cancelados}</Td><Td>{formatarData(item.ultimoPedido)}</Td><Td>{item.diasSemComprar == null ? "-" : `${item.diasSemComprar} dia(s)`}</Td></tr>)}</tbody></Table>}
        </div>
      </>}
    </div>
  )
}
