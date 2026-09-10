import { useEffect, useRef, useState } from "react"
import { api } from "../services/api"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import { useSearchParams } from "react-router-dom"
import { Button } from "../components/ui/Button"
import { Modal } from "../components/ui/Modal"
import { Select } from "../components/ui/Select"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackState"
import { ConfirmModal } from "../components/ui/ConfirmModal"

import {
  ClipboardList,
  Factory,
  CheckCircle2,
  CalendarCheck,
  PlayCircle,
  Package,
  Layers,
  User,
  RotateCcw
} from "lucide-react"

export function Kanban() {
  const [faseSelecionada, setFaseSelecionada] = useState("ABERTO")
  const navegacaoFases = useRef(null)

  const [operadores, setOperadores] = useState([])
  const [modalTransferir, setModalTransferir] = useState(false)
  const [servicoSelecionado, setServicoSelecionado] = useState(null)
  const [novoOperadorId, setNovoOperadorId] = useState("")
  const [motivoTransferencia, setMotivoTransferencia] = useState("")
  const [observacoesAbertas, setObservacoesAbertas] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [alterandoId, setAlterandoId] = useState(null)
  const [confirmacao, setConfirmacao] = useState(null)
  const [searchParams] = useSearchParams()
  const busca = searchParams.get("busca") || ""

  const usuarioLogado = JSON.parse(localStorage.getItem("@usuario") || "{}")

  const podeAlterarKanban =
    usuarioLogado.funcao === "ADMIN" ||
    usuarioLogado.funcao === "OPERADOR" ||
    usuarioLogado.funcao === "VENDEDOR_OPERADOR"

  const podeTransferirOperador =
    usuarioLogado.funcao === "ADMIN"


  const [kanban, setKanban] = useState({
    ABERTO: [],
    INICIADO: [],
    CONCLUIDO: [],
    CANCELADO: []
  })

  async function carregarOperadores() {
    try {
      const operadoresRes = await api.get("/funcionarios/operadores")
      setOperadores(operadoresRes.data)
    } catch (error) {
      console.log(error)
    }
  }

  async function carregarKanban({ silencioso = false } = {}) {
    if (!silencioso) setCarregando(true)

    try {
      const kanbanRes = await api.get("/kanban", {
        params: { busca }
      })

      setKanban(kanbanRes.data)
      setErro(false)
    } catch (error) {
      console.log(error)
      if (!silencioso) setErro(true)
    } finally {
      if (!silencioso) setCarregando(false)
    }
  }

  useEffect(() => {
    carregarOperadores()
  }, [])

  useEffect(() => {
    carregarKanban()

    const interval = setInterval(() => {
      if (!document.hidden) carregarKanban({ silencioso: true })
    }, 30000)

    return () => clearInterval(interval)
  }, [busca])

  const colunas = [
    {
      key: "ABERTO",
      titulo: "Aguardando"
    },
    {
      key: "INICIADO",
      titulo: "Em Produção"
    },
    {
      key: "CONCLUIDO",
      titulo: "Finalizados"
    },
  ]

  function alterarStatus(id, status, mensagemConfirmacao = null) {
    if (mensagemConfirmacao) {
      setConfirmacao({ id, status, mensagem: mensagemConfirmacao })
      return
    }

    executarAlteracaoStatus(id, status)
  }

  async function executarAlteracaoStatus(id, status) {
    if (alterandoId) return
    setAlterandoId(id)

    try {
      await api.put(`/servicos-plano/status/${id}`, {
        status
      })

      await carregarKanban({ silencioso: true })
      setConfirmacao(null)
    } catch (error) {
      console.log(error)
      alert(
        error.response?.data?.error ||
        "Erro ao alterar status"
      )
    } finally {
      setAlterandoId(null)
    }
  }

  function formatarData(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)

    const [ano, mes, dia] = dataTexto.split("-")

    return `${dia}/${mes}/${ano}`
  }

  function statusAmigavel(status) {
    const statusMap = {
      ABERTO: "⏳ Aguardando início",
      INICIADO: "🏭 Em produção",
      CONCLUIDO: "✅ Concluído",
      CANCELADO: "❌ Cancelado"
    }

    return statusMap[status] || status
  }

  function abrirTransferencia(servico) {
    setServicoSelecionado(servico)
    setNovoOperadorId("")
    setMotivoTransferencia("")
    setModalTransferir(true)
  }

  function obterSituacaoPrazoPedido(pedido) {
    if (!pedido?.dataEntrega) return "SEM_DATA"

    const statusParaContarAtraso = [
      "ABERTO",
      "EM_SEPARACAO",
      "EM_PRODUCAO"
    ]

    if (!statusParaContarAtraso.includes(pedido.status)) {
      return "FINALIZADO_PRODUCAO"
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const entregaTexto = String(pedido.dataEntrega).substring(0, 10)
    const [ano, mes, dia] = entregaTexto.split("-").map(Number)
    const entrega = new Date(ano, mes - 1, dia)

    if (entrega < hoje) return "ATRASADO"
    if (entrega.getTime() === hoje.getTime()) return "ULTIMO_DIA"

    return "NO_PRAZO"
  }

  function pedidoAtrasado(pedido) {
    return obterSituacaoPrazoPedido(pedido) === "ATRASADO"
  }

  function pedidoUltimoDia(pedido) {
    return obterSituacaoPrazoPedido(pedido) === "ULTIMO_DIA"
  }

  function obterPrioridade(pedido) {
    return pedido?.prioridade || "NORMAL"
  }

  function classePrioridade(prioridade) {
    const classes = {
      BAIXA: "bg-gray-100 text-gray-700",
      NORMAL: "bg-blue-100 text-blue-700",
      ALTA: "bg-yellow-100 text-yellow-700",
      URGENTE: "bg-red-100 text-red-700"
    }

    return classes[prioridade] || classes.NORMAL
  }

  const totalAbertos = kanban.ABERTO?.length || 0
  const totalIniciados = kanban.INICIADO?.length || 0
  const totalConcluidos = kanban.CONCLUIDO?.length || 0

  const totalConcluidosHoje = (kanban.CONCLUIDO || []).filter((servico) => {
    if (!servico.dataFim) return false

    const hoje = new Date().toISOString().substring(0, 10)
    return String(servico.dataFim).substring(0, 10) === hoje
  }).length

  function ResumoCard({ titulo, valor, icon: Icon, tipo = "normal" }) {
    const classes = {
      normal: "bg-white border-gray-200 text-gray-700",
      info: "bg-blue-50 border-blue-300 text-blue-700",
      sucesso: "bg-green-50 border-green-300 text-green-700"
    }

    return (
      <div className={`border rounded-xl p-4 shadow-sm ${classes[tipo]}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm">{titulo}</p>
            <strong className="text-2xl font-bold block mt-1">
              {valor}
            </strong>
          </div>

          {Icon && <Icon size={26} />}
        </div>
      </div>
    )
  }

  function obterNumeroPedido(pedido) {
    if (
      pedido?.origemPedido === "EXTERNO" &&
      pedido?.numeroPedidoManual
    ) {
      return pedido.numeroPedidoManual
    }

    return `#${pedido?.numeroPedido}`
  }

  async function transferirOperador() {
    if (!novoOperadorId) {
      alert("Selecione o novo operador")
      return
    }

    if (!motivoTransferencia.trim()) {
      alert("Informe o motivo da transferência")
      return
    }

    try {
      await api.patch(
        `/servicos-plano/${servicoSelecionado.id}/transferir-operador`,
        {
          novoOperadorId,
          motivo: motivoTransferencia
        }
      )

      setModalTransferir(false)
      setServicoSelecionado(null)
      setNovoOperadorId("")
      setMotivoTransferencia("")

      await carregarKanban({ silencioso: true })
    } catch (error) {
      console.log(error)

      alert(
        error.response?.data?.error ||
        "Erro ao transferir operador"
      )
    }
  }

  async function liberarOperador(id) {
    const confirmar = confirm(
      "Deseja liberar este operador e devolver o serviço para aberto?"
    )

    if (!confirmar) return

    try {
      await api.patch(
        `/servicos-plano/${id}/liberar-operador`
      )

      carregarKanban()
    } catch (error) {
      console.log(error)

      alert(
        error.response?.data?.error ||
        "Erro ao liberar operador"
      )
    }
  }

  function alternarObservacao(id) {
    setObservacoesAbertas((atual) => ({
      ...atual,
      [id]: !atual[id]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <ResumoCard titulo="Abertos" valor={totalAbertos} icon={ClipboardList} />
          <ResumoCard titulo="Em Produção" valor={totalIniciados} tipo="info" icon={Factory} />
          <ResumoCard titulo="Concluídos" valor={totalConcluidos} tipo="sucesso" icon={CheckCircle2} />
          <ResumoCard titulo="Concluídos Hoje" valor={totalConcluidosHoje} tipo="sucesso" icon={CalendarCheck} />
      </div>
      {carregando ? (
        <LoadingState mensagem="Carregando quadro de produção..." />
      ) : erro ? (
        <ErrorState onRetry={() => carregarKanban()} />
      ) : (
      <>
      <nav ref={navegacaoFases} aria-label="Fases da produção" className="sticky top-0 z-10 grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm xl:hidden">
        {colunas.map((coluna) => (
          <button
            key={coluna.key}
            type="button"
            aria-pressed={faseSelecionada === coluna.key}
            aria-controls={`fase-${coluna.key}`}
            onClick={() => {
              setFaseSelecionada(coluna.key)
              navegacaoFases.current?.scrollIntoView({ block: "start" })
            }}
            className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:text-sm ${faseSelecionada === coluna.key
              ? coluna.key === "ABERTO" ? "bg-gray-800 text-white" : coluna.key === "INICIADO" ? "bg-blue-700 text-white" : "bg-green-700 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            <span>{coluna.titulo}</span>
            <span className="rounded-full bg-white/20 px-2 text-sm">{kanban[coluna.key]?.length || 0}</span>
          </button>
        ))}
      </nav>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {colunas.map((coluna) => (

          <div
            key={coluna.key}
            id={`fase-${coluna.key}`}
            className={`
              ${faseSelecionada === coluna.key ? "block" : "hidden"} xl:block min-w-0
              bg-gray-50 rounded-2xl p-3 sm:p-4 xl:min-h-[600px]
              border border-t-4 shadow-sm
              ${coluna.key === "ABERTO" ? "border-gray-300 border-t-gray-600" : coluna.key === "INICIADO" ? "border-blue-200 border-t-blue-600" : "border-green-200 border-t-green-600"}
            `}
          >

            <h2
              className={`
                text-xl font-bold mb-4 flex justify-between items-center
                ${
                  coluna.key === "ABERTO"
                    ? "text-gray-700"
                    : coluna.key === "INICIADO"
                    ? "text-blue-700"
                    : "text-green-700"
                }
              `}
            >
            <span>{coluna.titulo}</span>

            <span className="bg-gray-800 text-white text-sm px-3 py-1 rounded-full">
                {kanban[coluna.key]?.length || 0}
            </span>
            </h2>

            <div className="grid grid-cols-1 gap-3">

              {kanban[coluna.key]?.map((servico) => (

                <div
                  key={servico.id}
                  className={`
                    min-w-0 break-words rounded-xl p-4 border border-l-4 shadow-sm transition-shadow hover:shadow-md
                    ${
                      pedidoAtrasado(servico.plano?.pedido)
                        ? "bg-white border-gray-200 border-l-red-500"
                        : pedidoUltimoDia(servico.plano?.pedido)
                        ? "bg-white border-gray-200 border-l-yellow-500"
                        : "bg-white border-gray-200 border-l-blue-400"
                    }
                  `}
                >

                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <div>
                            <h3 className="text-lg font-bold">
                              {servico.tipoServico?.nome}
                            </h3>

                          </div>

                          <BadgeStatus status={servico.status} />
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${classePrioridade(
                              obterPrioridade(servico.plano?.pedido)
                            )}`}
                          >
                            {obterPrioridade(servico.plano?.pedido)}
                          </span>

                          {pedidoAtrasado(servico.plano?.pedido) && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                              ATRASADO
                            </span>
                          )}

                          {pedidoUltimoDia(servico.plano?.pedido) && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white">
                              ÚLTIMO DIA
                            </span>
                          )}
                        </div>

                  <p className="text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Package size={16} />
                      Pedido {obterNumeroPedido(servico.plano?.pedido)}
                    </span>
                  </p>

                  <p className="text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <User size={16} />
                    {servico.plano?.pedido?.cliente?.nome || "Cliente não informado"}
                  </span>
                </p>

                  <p className="text-gray-600">
                    Entrega: {formatarData(servico.plano?.pedido?.dataEntrega)}
                  </p>

                  <p className="text-gray-600">
                    <span className="inline-flex items-center gap-2">
                      <Layers size={16} />
                      Plano: {servico.plano?.numeroPlano}
                    </span>
                  </p>

                  <p className="text-gray-600">
                    Operador: {
                      servico.operador?.nome || "Sem operador"
                    }
                  </p>

                  {servico.observacoes && (
                    <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-900">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <strong className="text-xs uppercase tracking-wide">
                          Observação
                        </strong>

                        {servico.observacoes.length > 50 && (
                          <button
                            type="button"
                            onClick={() => alternarObservacao(servico.id)}
                            className="text-xs font-semibold text-yellow-800 hover:underline"
                          >
                            {observacoesAbertas[servico.id] ? "Ver menos" : "Ver mais"}
                          </button>
                        )}
                      </div>

                      <p
                        className={
                          servico.observacoes.length > 50 &&
                          !observacoesAbertas[servico.id]
                            ? "max-h-10 overflow-hidden"
                            : ""
                        }
                      >
                        {servico.observacoes}
                      </p>
                    </div>
                  )}

                  {podeTransferirOperador && servico.operador && (
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => abrirTransferencia(servico)}
                      className="mt-3"
                    >
                      Transferir operador
                    </Button>
                  )}

                  {podeAlterarKanban ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                    {servico.status === "ABERTO" && (
                      <Button
                        size="sm"
                        loading={alterandoId === servico.id}
                        onClick={() => alterarStatus(servico.id, "INICIADO")}
                      >
                        <PlayCircle size={15} />
                        Iniciar
                      </Button>
                    )}

                    {servico.status === "INICIADO" && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          loading={alterandoId === servico.id}
                          onClick={() =>
                            alterarStatus(
                              servico.id,
                              "CONCLUIDO",
                              `Deseja realmente concluir este serviço?

                        Serviço: ${servico.tipoServico?.nome || "-"}
                        Plano: ${servico.plano?.numeroPlano || "-"}
                        Pedido: ${obterNumeroPedido(servico.plano?.pedido)}
                        Cliente: ${servico.plano?.pedido?.cliente?.nome || "-"}

                        Se este for o último serviço pendente, o pedido será enviado automaticamente para a Expedição.

                        Esta ação poderá ser revertida somente por um administrador.`
                            )
                          }
                        >
                          <CheckCircle2 size={15} />
                          Concluir
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          loading={alterandoId === servico.id}
                          onClick={() =>
                            alterarStatus(
                              servico.id,
                              "ABERTO",
                              "Deseja voltar este serviço para aguardando?"
                            )
                          }
                        >
                          <RotateCcw size={15} />
                          Voltar início
                        </Button>
                      </>
                    )}

                    {servico.status === "CONCLUIDO" && (
                      <Button
                        size="sm"
                        variant="warning"
                        loading={alterandoId === servico.id}
                        onClick={() =>
                          alterarStatus(
                            servico.id,
                            "INICIADO",
                            "Deseja reabrir este serviço concluído?"
                          )
                        }
                      >
                        <RotateCcw size={15} />
                        Reabrir
                      </Button>
                    )}
                    </div>
                    ) : (
                      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
                        Somente consulta
                      </div>
                    )}

                </div>

              ))}

              {kanban[coluna.key]?.length === 0 && (
                <EmptyState titulo="Nenhum serviço" descricao="Não há itens nesta etapa." compact />
              )}

            </div>

          </div>

        ))}

      </div>
      </>
      )}

      {modalTransferir && (
        <Modal open title="Transferir operador" width="max-w-lg" onClose={() => setModalTransferir(false)}>
            <p className="text-sm text-gray-600 mb-4">
              Serviço: <strong>{servicoSelecionado?.tipoServico?.nome}</strong>
              <br />
              Operador atual:{" "}
              <strong>
                {servicoSelecionado?.operador?.nome || "Sem operador"}
              </strong>
            </p>

            <div className="grid grid-cols-1 gap-4">
              <Select
                aria-label="Novo operador"
                value={novoOperadorId}
                onChange={(e) => setNovoOperadorId(e.target.value)}
              >
                <option value="">Selecione o novo operador</option>
                {operadores.map((operador) => (
                  <option key={operador.id} value={operador.id}>
                    {operador.nome}
                  </option>
                ))}
              </Select>

              <textarea
                placeholder="Motivo da transferência"
                value={motivoTransferencia}
                onChange={(e) => setMotivoTransferencia(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalTransferir(false)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="warning"
                onClick={transferirOperador}
              >
                Transferir
              </Button>
            </div>
        </Modal>
      )}

      <ConfirmModal
        open={Boolean(confirmacao)}
        title={confirmacao?.status === "CONCLUIDO" ? "Concluir serviço" : "Confirmar alteração"}
        message={confirmacao?.mensagem}
        confirmText={confirmacao?.status === "CONCLUIDO" ? "Concluir serviço" : "Confirmar"}
        variant={confirmacao?.status === "CONCLUIDO" ? "success" : "warning"}
        onCancel={() => setConfirmacao(null)}
        onConfirm={() => executarAlteracaoStatus(confirmacao.id, confirmacao.status)}
      />

    </div>
  )
}
