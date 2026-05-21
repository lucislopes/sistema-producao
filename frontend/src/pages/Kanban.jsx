import { useEffect, useState } from "react"
import { api } from "../services/api"

export function Kanban() {

  const [kanban, setKanban] = useState({
    ABERTO: [],
    INICIADO: [],
    PAUSADO: [],
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
      key: "PAUSADO",
      titulo: "Pausados"
    },

    {
      key: "CONCLUIDO",
      titulo: "Concluídos"
    }
  ]

  return (
    <div>

      <h1 className="text-3xl font-bold mb-6">
        Kanban Produção
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">

        {colunas.map((coluna) => (

          <div
            key={coluna.key}
            className="bg-gray-100 rounded-2xl p-4 min-h-[600px]"
          >

            <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
            <span>{coluna.titulo}</span>

            <span className="bg-gray-800 text-white text-sm px-3 py-1 rounded-full">
                {kanban[coluna.key]?.length || 0}
            </span>
            </h2>

            <div className="flex flex-col gap-4">

              {kanban[coluna.key]?.map((servico) => (

                <div
                  key={servico.id}
                  className="bg-white rounded-2xl shadow-md p-4 border"
                >

                <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">
                    {servico.tipoServico?.nome}
                </h3>

                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {servico.status}
                </span>
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