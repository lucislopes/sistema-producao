import { useEffect, useState } from "react"
import { api } from "../services/api"
import { BadgeStatus } from "../components/ui/BadgeStatus"


import {
  ClipboardList,
  Factory,
  CheckCircle2,
  CalendarCheck,
  PlayCircle,
  Package,
  Layers,
  User
} from "lucide-react"

export function Kanban() {

  const [kanban, setKanban] = useState({
    ABERTO: [],
    INICIADO: [],
    CONCLUIDO: [],
    CANCELADO: []
  })

  async function carregarKanban() {
    try {

      const response = await api.get("/kanban")

      setKanban(response.data)

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
  }, [])

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

  async function alterarStatus(id, status) {
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
                      Pedido #{servico.plano?.pedido?.numeroPedido}
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

                  <div className="mt-3 flex gap-2">
                    {servico.status === "ABERTO" && (
                      <button
                        onClick={() => alterarStatus(servico.id, "INICIADO")}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm inline-flex items-center gap-2"
                      >
                        <PlayCircle size={15} />
                        Iniciar
                      </button>
                    )}

                    {servico.status === "INICIADO" && (
                      <button
                        onClick={() => alterarStatus(servico.id, "CONCLUIDO")}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm inline-flex items-center gap-2"
                      >
                        <CheckCircle2 size={15} />
                        Concluir
                      </button>
                    )}
                  </div>

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

    </div>
  )
}