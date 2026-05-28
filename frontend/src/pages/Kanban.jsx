import { useEffect, useState } from "react"
import { api } from "../services/api"
import { BadgeStatus } from "../components/ui/BadgeStatus"

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
      titulo: "Abertos"
    },
    {
      key: "INICIADO",
      titulo: "Iniciados"
    },
    {
      key: "CONCLUIDO",
      titulo: "Concluídos"
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


  return (
    <div>
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
                  className="bg-white rounded-xl shadow-sm p-3 border"
                >

                <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">
                    {servico.tipoServico?.nome}
                </h3>

                <BadgeStatus status={servico.status} />
                
                </div>

                  <p className="text-gray-600">
                    Pedido #{servico.plano?.pedido?.numeroPedido}
                  </p>

                  <p className="text-gray-600">
                    Cliente: {servico.plano?.pedido?.cliente?.nome}
                  </p>

                  <p className="text-gray-600">
                    Plano: {servico.plano?.numeroPlano}
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
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        Iniciar
                      </button>
                    )}

                    {servico.status === "INICIADO" && (
                      <button
                        onClick={() => alterarStatus(servico.id, "CONCLUIDO")}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                      >
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