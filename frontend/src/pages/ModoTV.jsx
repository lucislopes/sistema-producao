import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Factory, Layers3, Maximize, Minimize, MonitorPlay, PackageCheck, Pause, Play, RefreshCw, Truck, UserRoundCheck, UsersRound } from "lucide-react"

const INTERVALO_ATUALIZACAO = 30000
const INTERVALO_ROTACAO = 20000
const INTERVALO_PAGINACAO = 8000
const ITENS_POR_PAGINA = 6

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Sem previsão"
}

function formatarHora(valor) {
  return valor ? new Date(valor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"
}

function CartaoResumo({ titulo, valor, icon: Icon, tom = "azul", detalhe }) {
  const tons = {
    azul: "border-blue-400/30 bg-blue-500/10 text-blue-200",
    amarelo: "border-yellow-400/30 bg-yellow-500/10 text-yellow-200",
    vermelho: "border-red-400/40 bg-red-500/15 text-red-200",
    verde: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    cinza: "border-slate-500/40 bg-slate-800 text-slate-200"
  }
  return <div className={`rounded-2xl border p-5 ${tons[tom]}`}><div className="flex items-start justify-between gap-4"><div><p className="text-base font-medium opacity-80">{titulo}</p><strong className="mt-2 block text-5xl font-black tracking-tight text-white">{valor}</strong>{detalhe && <p className="mt-2 text-sm opacity-80">{detalhe}</p>}</div><Icon size={34} strokeWidth={1.8} aria-hidden="true" /></div></div>
}

function SeloPrazo({ item }) {
  if (item.diasPrazo === null) return <span className="rounded-full bg-slate-700 px-3 py-1 text-sm font-bold text-slate-200">Sem previsão</span>
  if (item.diasPrazo < 0) return <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-black text-white">{Math.abs(item.diasPrazo)} dia(s) atrasado</span>
  if (item.diasPrazo === 0) return <span className="rounded-full bg-orange-400 px-3 py-1 text-sm font-black text-slate-950">Entrega hoje</span>
  if (item.diasPrazo <= 3) return <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-black text-slate-950">Entrega em {item.diasPrazo} dia(s)</span>
  return <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-bold text-blue-200">{item.diasPrazo} dias</span>
}

function LinhaFila({ item, compacta = false }) {
  return <div className={`grid items-center gap-4 rounded-xl border ${item.atrasado ? "border-red-500/40 bg-red-500/10" : "border-slate-700 bg-slate-800/70"} ${compacta ? "grid-cols-[1.1fr_1.5fr_1fr_auto] px-4 py-3" : "grid-cols-[1fr_1.4fr_1fr_1fr_auto] px-5 py-4"}`}>
    <div><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pedido</span><strong className="block text-xl text-white">{item.pedido}</strong></div>
    <div className="min-w-0"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cliente</span><strong className="block truncate text-lg text-white">{item.cliente}</strong></div>
    <div><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Serviço / plano</span><strong className="block truncate text-base text-white">{item.servico} · {item.plano}</strong></div>
    {!compacta && <div><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Operador</span><strong className={`block text-base ${item.operador ? "text-white" : "text-yellow-300"}`}>{item.operador || "Aguardando"}</strong></div>}
    <div className="text-right"><SeloPrazo item={item} /><span className="mt-1 block text-xs text-slate-400">{formatarData(item.dataEntrega)}</span></div>
  </div>
}

function LinhaExpedicao({ item }) {
  const tipo = item.tipoEntrega === "CLIENTE_RETIRA" ? "Cliente retira" : item.rota || "Entrega da empresa"
  return <div className={`grid grid-cols-[1fr_1.5fr_1.1fr_1fr_auto] items-center gap-4 rounded-xl border px-5 py-4 ${item.atrasado ? "border-red-500/40 bg-red-500/10" : "border-slate-700 bg-slate-800/70"}`}>
    <div><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pedido</span><strong className="block text-xl text-white">{item.pedido}</strong></div>
    <div className="min-w-0"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cliente</span><strong className="block truncate text-lg text-white">{item.cliente}</strong></div>
    <div><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Modalidade / rota</span><strong className="block truncate text-base text-white">{tipo}</strong></div>
    <div><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Andamento</span><strong className={item.status === "SAIU_ENTREGA" ? "block text-base text-blue-200" : "block text-base text-emerald-200"}>{item.status === "SAIU_ENTREGA" ? "Saiu para entrega" : "Pronto"}</strong></div>
    <div className="text-right"><SeloPrazo item={item} /><span className="mt-1 block text-xs text-slate-400">{formatarData(item.dataEntrega)}</span></div>
  </div>
}

function totalPaginas(itens) {
  return Math.max(1, Math.ceil(itens.length / ITENS_POR_PAGINA))
}

function paginaDe(itens, pagina) {
  const paginaValida = pagina % totalPaginas(itens)
  return itens.slice(paginaValida * ITENS_POR_PAGINA, (paginaValida + 1) * ITENS_POR_PAGINA)
}

export function ModoTV() {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const [painel, setPainel] = useState(0)
  const [rotacaoPausada, setRotacaoPausada] = useState(false)
  const [telaCheia, setTelaCheia] = useState(Boolean(document.fullscreenElement))
  const [paginaExecucao, setPaginaExecucao] = useState(0)
  const [paginaAguardando, setPaginaAguardando] = useState(0)
  const [paginaExpedicao, setPaginaExpedicao] = useState(0)

  const carregar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setAtualizando(true)
    try {
      const response = await api.get("/modo-tv")
      setDados(response.data)
      setErro(false)
    } catch (error) { console.log(error); setErro(true) }
    finally { if (!silencioso) setAtualizando(false) }
  }, [])

  useEffect(() => {
    carregar()
    const intervalo = setInterval(() => { if (!document.hidden) carregar({ silencioso: true }) }, INTERVALO_ATUALIZACAO)
    return () => clearInterval(intervalo)
  }, [carregar])

  useEffect(() => {
    if (rotacaoPausada) return undefined
    const intervalo = setInterval(() => setPainel((atual) => (atual + 1) % 3), INTERVALO_ROTACAO)
    return () => clearInterval(intervalo)
  }, [rotacaoPausada])

  useEffect(() => {
    if (rotacaoPausada) return undefined
    const intervalo = setInterval(() => {
      if (painel === 1) {
        setPaginaExecucao((atual) => atual + 1)
        setPaginaAguardando((atual) => atual + 1)
      }
      if (painel === 2) setPaginaExpedicao((atual) => atual + 1)
    }, INTERVALO_PAGINACAO)
    return () => clearInterval(intervalo)
  }, [painel, rotacaoPausada])

  useEffect(() => {
    function aoAlterarTelaCheia() { setTelaCheia(Boolean(document.fullscreenElement)) }
    document.addEventListener("fullscreenchange", aoAlterarTelaCheia)
    return () => document.removeEventListener("fullscreenchange", aoAlterarTelaCheia)
  }, [])

  async function alternarTelaCheia() {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }

  const resumo = dados?.resumo || {}
  const fila = dados?.fila || []
  const emExecucao = fila.filter((item) => item.status === "INICIADO")
  const aguardando = fila.filter((item) => item.status === "ABERTO")
  const expedicao = dados?.expedicao || []
  const expedicaoResumo = dados?.expedicaoResumo || {}

  return <div className="min-h-screen bg-slate-950 text-white">
    <header className="flex min-h-20 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3">
      <div className="flex items-center gap-4"><div className="rounded-xl bg-blue-600 p-3"><MonitorPlay size={30} /></div><div><h1 className="text-2xl font-black tracking-tight">Operação · Modo TV</h1><p className="text-sm text-slate-400">Painel {painel + 1} de 3 · atualização a cada 30s · troca a cada 20s</p></div></div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ${erro ? "bg-red-500/20 text-red-300" : "bg-emerald-500/15 text-emerald-300"}`}><span className={`h-2.5 w-2.5 rounded-full ${erro ? "bg-red-400" : "bg-emerald-400"}`} />{erro ? "Sem conexão" : `Atualizado ${formatarHora(dados?.atualizadoEm)}`}</div>
        <button type="button" onClick={() => carregar()} className="rounded-lg border border-slate-700 p-3 text-slate-200 hover:bg-slate-800" aria-label="Atualizar agora"><RefreshCw size={21} className={atualizando ? "animate-spin" : ""} /></button>
        <button type="button" onClick={() => setRotacaoPausada((atual) => !atual)} className="rounded-lg border border-slate-700 p-3 text-slate-200 hover:bg-slate-800" aria-label={rotacaoPausada ? "Retomar rotação" : "Pausar rotação"}>{rotacaoPausada ? <Play size={21} /> : <Pause size={21} />}</button>
        <button type="button" onClick={alternarTelaCheia} className="rounded-lg border border-slate-700 p-3 text-slate-200 hover:bg-slate-800" aria-label={telaCheia ? "Sair da tela cheia" : "Entrar em tela cheia"}>{telaCheia ? <Minimize size={21} /> : <Maximize size={21} />}</button>
        <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800"><ArrowLeft size={18} />Sair</Link>
      </div>
    </header>

    <main className="p-6">
      {!dados && !erro && <div className="flex min-h-[70vh] items-center justify-center text-2xl text-slate-300"><RefreshCw className="mr-3 animate-spin" />Carregando produção...</div>}
      {!dados && erro && <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4"><AlertTriangle size={52} className="text-red-400" /><p className="text-2xl font-bold">Não foi possível atualizar o painel</p><button onClick={() => carregar()} className="rounded-xl bg-blue-600 px-6 py-3 font-bold">Tentar novamente</button></div>}

      {dados && painel === 0 && <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4"><CartaoResumo titulo="Em separação" valor={resumo.pedidosSeparacao} icon={Layers3} /><CartaoResumo titulo="Em produção" valor={resumo.pedidosProducao} icon={Factory} tom="azul" /><CartaoResumo titulo="Prontos para entrega" valor={resumo.pedidosProntos} icon={PackageCheck} tom="verde" /><CartaoResumo titulo="Pedidos atrasados" valor={resumo.pedidosAtrasados} icon={AlertTriangle} tom={resumo.pedidosAtrasados ? "vermelho" : "cinza"} /></section>
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-5"><CartaoResumo titulo="Serviços aguardando" valor={resumo.servicosAbertos} icon={Clock3} tom="amarelo" /><CartaoResumo titulo="Serviços em execução" valor={resumo.servicosIniciados} icon={Factory} /><CartaoResumo titulo="Concluídos hoje" valor={resumo.concluidosHoje} icon={CheckCircle2} tom="verde" /><CartaoResumo titulo="Chapas nos planos" valor={resumo.chapasAtivas} icon={Layers3} /><CartaoResumo titulo="Operadores ativos" valor={resumo.operadoresAtivos} icon={UsersRound} /></section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-black">Prioridades agora</h2><p className="text-slate-400">Serviços com prazo mais urgente aparecem primeiro</p></div><span className="rounded-full bg-slate-800 px-4 py-2 font-bold text-slate-300">{fila.length} na fila</span></div><div className="space-y-3">{fila.slice(0, 6).map((item) => <LinhaFila key={item.id} item={item} compacta />)}{fila.length === 0 && <p className="py-10 text-center text-xl text-emerald-300">Nenhum serviço aguardando ou em execução.</p>}</div></section>
      </div>}

      {dados && painel === 1 && <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-blue-500/30 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-black text-blue-200">Em execução</h2><p className="text-slate-400">Serviços que já possuem trabalho iniciado</p></div><span className="rounded-full bg-blue-500 px-4 py-2 text-xl font-black">{emExecucao.length}</span></div><div className="space-y-3">{paginaDe(emExecucao, paginaExecucao).map((item) => <LinhaFila key={item.id} item={item} compacta />)}{emExecucao.length === 0 && <p className="py-12 text-center text-xl text-slate-400">Nenhum serviço em execução.</p>}</div>{emExecucao.length > ITENS_POR_PAGINA && <p className="mt-3 text-center text-sm text-slate-400">Página {(paginaExecucao % totalPaginas(emExecucao)) + 1} de {totalPaginas(emExecucao)} · troca automática</p>}</section>
        <section className="rounded-2xl border border-yellow-500/30 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-black text-yellow-200">Aguardando início</h2><p className="text-slate-400">Ordenado pelo prazo de entrega do pedido</p></div><span className="rounded-full bg-yellow-400 px-4 py-2 text-xl font-black text-slate-950">{aguardando.length}</span></div><div className="space-y-3">{paginaDe(aguardando, paginaAguardando).map((item) => <LinhaFila key={item.id} item={item} compacta />)}{aguardando.length === 0 && <p className="py-12 text-center text-xl text-slate-400">Nenhum serviço aguardando.</p>}</div>{aguardando.length > ITENS_POR_PAGINA && <p className="mt-3 text-center text-sm text-slate-400">Página {(paginaAguardando % totalPaginas(aguardando)) + 1} de {totalPaginas(aguardando)} · troca automática</p>}</section>
      </div>}

      {dados && painel === 2 && <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-5"><CartaoResumo titulo="Fila da expedição" valor={expedicaoResumo.total || 0} icon={Truck} /><CartaoResumo titulo="Retiradas prontas" valor={expedicaoResumo.retiradasProntas || 0} icon={UserRoundCheck} tom="verde" /><CartaoResumo titulo="Entregas prontas" valor={expedicaoResumo.entregasProntas || 0} icon={PackageCheck} tom="verde" /><CartaoResumo titulo="Saiu para entrega" valor={expedicaoResumo.saiuEntrega || 0} icon={Truck} /><CartaoResumo titulo="Atrasados" valor={expedicaoResumo.atrasados || 0} icon={AlertTriangle} tom={expedicaoResumo.atrasados ? "vermelho" : "cinza"} /></section>
        <section className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-black text-emerald-200">Expedição</h2><p className="text-slate-400">Prontos, retiradas e pedidos que já saíram para entrega</p></div><div className="flex gap-2"><span className="rounded-full bg-orange-400 px-4 py-2 font-black text-slate-950">{expedicaoResumo.entregaHoje || 0} para hoje</span><span className="rounded-full bg-slate-800 px-4 py-2 font-bold text-slate-200">{expedicao.length} total</span></div></div><div className="space-y-3">{paginaDe(expedicao, paginaExpedicao).map((item) => <LinhaExpedicao key={item.id} item={item} />)}{expedicao.length === 0 && <p className="py-12 text-center text-xl text-emerald-300">Nenhum pedido aguardando expedição.</p>}</div>{expedicao.length > ITENS_POR_PAGINA && <p className="mt-3 text-center text-sm text-slate-400">Página {(paginaExpedicao % totalPaginas(expedicao)) + 1} de {totalPaginas(expedicao)} · troca automática a cada 8 segundos</p>}</section>
      </div>}
    </main>

    <div className="fixed bottom-0 left-0 flex h-1 w-full">{[0, 1, 2].map((indice) => <button key={indice} type="button" aria-label={`Mostrar painel ${indice + 1}`} onClick={() => setPainel(indice)} className={`h-full flex-1 ${painel === indice ? "bg-blue-500" : "bg-slate-800"}`} />)}</div>
  </div>
}
