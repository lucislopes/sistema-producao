import { useEffect, useState } from "react"
import { api } from "../services/api"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import { useSearchParams } from "react-router-dom"

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

  const [operadores, setOperadores] = useState([])
  const [modalTransferir, setModalTransferir] = useState(false)
  const [servicoSelecionado, setServicoSelecionado] = useState(null)
  const [novoOperadorId, setNovoOperadorId] = useState("")
  const [motivoTransferencia, setMotivoTransferencia] = useState("")
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

  async function carregarKanban() {
    try {
      const [kanbanRes, operadoresRes] = await Promise.all([
        api.get("/kanban", {
          params: {
            busca
          }
        }),
        api.get("/funcionarios/operadores")
      ])

      setKanban(kanbanRes.data)
      setOperadores(operadoresRes.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar kanban")
    }
  }

  useEffect(() => {
    carregarKanban()

    const interval = setInterval(() => {
      carregarKanban()
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

  async function alterarStatus(id, status, mensagemConfirmacao = null) {
    if (mensagemConfirmacao) {
      const confirmar = confirm(mensagemConfirmacao)

      if (!confirmar) return
    }

    try {
      await api.put(`/servicos-plano/status/${id}`, {
        status
      })

      carregarKanban()
    } catch (error) {
      console.log(error)
      alert(
        error.response?.data?.error ||
        "Erro ao alterar status"
      )
    }
  }

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleDateString("pt-BR")
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

  function pedidoAtrasado(pedido) {
    if (!pedido?.dataEntrega) return false

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const entrega = new Date(pedido.dataEntrega)
    entrega.setHours(0, 0, 0, 0)

    return entrega < hoje
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

      carregarKanban()
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

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <ResumoCard titulo="Abertos" valor={totalAbertos} icon={ClipboardList} />
          <ResumoCard titulo="Em Produção" valor={totalIniciados} tipo="info" icon={Factory} />
          <ResumoCard titulo="Concluídos" valor={totalConcluidos} tipo="sucesso" icon={CheckCircle2} />
          <ResumoCard titulo="Concluídos Hoje" valor={totalConcluidosHoje} tipo="sucesso" icon={CalendarCheck} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {colunas.map((coluna) => (

          <div
            key={coluna.key}
            className="
              bg-gray-50 rounded-2xl p-4 min-h-[600px]
              border border-gray-200 shadow-sm
            "
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

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">

              {kanban[coluna.key]?.map((servico) => (

                <div
                  key={servico.id}
                  className={`
                    rounded-xl shadow-sm p-3 border
                    ${
                      pedidoAtrasado(servico.plano?.pedido)
                        ? "bg-red-50 border-red-300"
                        : "bg-white border-gray-200"
                    }
                  `}
                >

                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-bold">
                              {servico.tipoServico?.nome}
                            </h3>

                            <p className="text-sm text-gray-500">
                              {statusAmigavel(servico.status)}
                            </p>
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

                  {podeTransferirOperador && servico.operador && (
                    <button
                      onClick={() => abrirTransferencia(servico)}
                      className="mt-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Transferir operador
                    </button>
                  )}

                  {podeAlterarKanban ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                    {servico.status === "ABERTO" && (
                      <button
                        onClick={() => alterarStatus(servico.id, "INICIADO")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm inline-flex items-center gap-2"
                      >
                        <PlayCircle size={15} />
                        Iniciar
                      </button>
                    )}

                    {servico.status === "INICIADO" && (
                      <>
                        <button
                          onClick={() => alterarStatus(servico.id, "CONCLUIDO")}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm inline-flex items-center gap-2"
                        >
                          <CheckCircle2 size={15} />
                          Concluir
                        </button>

                        <button
                          onClick={() =>
                            alterarStatus(
                              servico.id,
                              "ABERTO",
                              "Deseja voltar este serviço para aguardando?"
                            )
                          }
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm inline-flex items-center gap-2"
                        >
                          <RotateCcw size={15} />
                          Voltar início
                        </button>
                      </>
                    )}

                    {servico.status === "CONCLUIDO" && (
                      <button
                        onClick={() =>
                          alterarStatus(
                            servico.id,
                            "INICIADO",
                            "Deseja reabrir este serviço concluído?"
                          )
                        }
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm inline-flex items-center gap-2"
                      >
                        <RotateCcw size={15} />
                        Reabrir
                      </button>
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
                <div className="text-gray-500 text-sm">
                  Nenhum serviço
                </div>
              )}

            </div>

          </div>

        ))}

      </div>

      {modalTransferir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              Transferir Operador
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Serviço: <strong>{servicoSelecionado?.tipoServico?.nome}</strong>
              <br />
              Operador atual:{" "}
              <strong>
                {servicoSelecionado?.operador?.nome || "Sem operador"}
              </strong>
            </p>

            <div className="grid grid-cols-1 gap-4">
              <select
                value={novoOperadorId}
                onChange={(e) => setNovoOperadorId(e.target.value)}
                className="border border-gray-300 rounded-lg p-3"
              >
                <option value="">Selecione o novo operador</option>
                {operadores.map((operador) => (
                  <option key={operador.id} value={operador.id}>
                    {operador.nome}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Motivo da transferência"
                value={motivoTransferencia}
                onChange={(e) => setMotivoTransferencia(e.target.value)}
                className="border border-gray-300 rounded-lg p-3 min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalTransferir(false)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={transferirOperador}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
              >
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}