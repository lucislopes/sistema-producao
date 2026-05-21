import { useEffect, useState } from "react"
import { api } from "../services/api"

export function Expedicao() {

  const [pedidos, setPedidos] = useState([])

  async function carregarPedidos() {
    try {

      const response = await api.get("/expedicao")

      setPedidos(response.data)

    } catch (error) {

      console.log(error)
      alert("Erro ao carregar expedição")
    }
  }

  useEffect(() => {
    carregarPedidos()
  }, [])

  async function alterarStatus(id, status) {
    try {

      await api.put(`/expedicao/${id}/status`, {
        status
      })

      carregarPedidos()

    } catch (error) {

      console.log(error)
      alert("Erro ao alterar status")
    }
  }

  function formatarData(data) {

    if (!data) return "-"

    return new Date(data).toLocaleDateString("pt-BR")
  }

  function obterClasseData(dataEntrega) {

    if (!dataEntrega) {
      return "border-gray-300"
    }

    const hoje = new Date()

    hoje.setHours(0, 0, 0, 0)

    const entrega = new Date(dataEntrega)

    entrega.setHours(0, 0, 0, 0)

    //
    // ATRASADO
    //

    if (entrega < hoje) {
      return "border-red-500 bg-red-50"
    }

    //
    // HOJE
    //

    if (entrega.getTime() === hoje.getTime()) {
      return "border-yellow-500 bg-yellow-50"
    }

    //
    // FUTURO
    //

    return "border-green-400"
  }

  return (
    <div>

      <h1 className="text-3xl font-bold mb-6">
        Expedição
      </h1>

      <div className="grid grid-cols-1 gap-4">

        {pedidos.map((pedido) => (

          <div
            key={pedido.id}
            className={`bg-white rounded-2xl shadow-md p-5 border-2 ${obterClasseData(pedido.dataEntrega)}`}
          >

            <div className="flex justify-between items-start">

              <div>

                <h2 className="text-2xl font-bold">
                  Pedido #{pedido.numeroPedido}
                </h2>

                <p className="text-gray-700">
                  Cliente: {pedido.cliente?.nome}
                </p>

                <p className="text-gray-700">
                  Rota: {pedido.rota?.nome || "-"}
                </p>

                <p className="text-gray-700">
                  Entrega: {formatarData(pedido.dataEntrega)}
                </p>

                <p className="text-gray-700">
                  Status: {pedido.status}
                </p>

                <p className="text-gray-700">
                  Recebedor: {pedido.nomeRecebedor || "-"}
                </p>

                <p className="text-gray-700">
                  Contato: {pedido.contatoRecebedor || "-"}
                </p>

                <p className="text-gray-700">
                  Endereço: {pedido.enderecoEntrega || "-"}
                </p>

              </div>

              <div className="flex flex-col gap-2">

                {pedido.status === "CONCLUIDO" && (

                  <button
                    onClick={() =>
                      alterarStatus(
                        pedido.id,
                        "PRONTO_ENTREGA"
                      )
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Preparar Entrega
                  </button>

                )}

                {pedido.status === "PRONTO_ENTREGA" && (

                  <button
                    onClick={() =>
                      alterarStatus(
                        pedido.id,
                        "SAIU_ENTREGA"
                      )
                    }
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                  >
                    Saiu Entrega
                  </button>

                )}

                {pedido.status === "SAIU_ENTREGA" && (

                  <button
                    onClick={() =>
                      alterarStatus(
                        pedido.id,
                        "ENTREGUE"
                      )
                    }
                    className="bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Finalizar Entrega
                  </button>

                )}

              </div>

            </div>

          </div>

        ))}

        {pedidos.length === 0 && (

          <div className="bg-white rounded-2xl shadow-md p-6">
            Nenhum pedido na expedição.
          </div>

        )}

      </div>

    </div>
  )
}