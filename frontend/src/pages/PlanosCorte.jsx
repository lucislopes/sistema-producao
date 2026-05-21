import { useEffect, useState } from "react"
import { api } from "../services/api"

export function PlanosCorte() {
  const [pedidos, setPedidos] = useState([])
  const [planos, setPlanos] = useState([])

  const [pedidoId, setPedidoId] = useState("")
  const [editandoId, setEditandoId] = useState(null)

  const [numeroPlano, setNumeroPlano] = useState("")
  const [quantidadeChapas, setQuantidadeChapas] = useState("")
  const [medidaEncabecamento, setMedidaEncabecamento] = useState("")
  const [compraExterna, setCompraExterna] = useState(false)
  const [observacoes, setObservacoes] = useState("")

  async function carregarPedidos() {
    const response = await api.get("/pedidos")
    setPedidos(response.data)
  }

  async function carregarPlanos(idPedido) {
    if (!idPedido) {
      setPlanos([])
      return
    }

    const response = await api.get(`/planos-corte/pedido/${idPedido}`)
    setPlanos(response.data)
  }

  useEffect(() => {
    carregarPedidos()
  }, [])

  useEffect(() => {
    carregarPlanos(pedidoId)
  }, [pedidoId])

  async function handleSubmit(e) {
    e.preventDefault()

    const dados = {
      pedidoId,
      numeroPlano,
      quantidadeChapas,
      medidaEncabecamento,
      compraExterna,
      observacoes
    }

    try {
      if (editandoId) {
        await api.put(`/planos-corte/${editandoId}`, dados)
      } else {
        await api.post("/planos-corte", dados)
      }

      limparFormulario()
      carregarPlanos(pedidoId)
      carregarPedidos()
    } catch (error) {
      console.log(error)
      alert("Erro ao salvar plano de corte")
    }
  }

  function editarPlano(plano) {
    setEditandoId(plano.id)
    setNumeroPlano(plano.numeroPlano)
    setQuantidadeChapas(plano.quantidadeChapas)
    setMedidaEncabecamento(plano.medidaEncabecamento || "")
    setCompraExterna(plano.compraExterna)
    setObservacoes(plano.observacoes || "")
  }

  async function excluirPlano(id) {
    const confirmar = confirm("Deseja excluir este plano?")

    if (!confirmar) return

    try {
      await api.delete(`/planos-corte/${id}`)
      carregarPlanos(pedidoId)
    } catch (error) {
      console.log(error)
      alert("Erro ao excluir plano")
    }
  }

  function limparFormulario() {
    setEditandoId(null)
    setNumeroPlano("")
    setQuantidadeChapas("")
    setMedidaEncabecamento("")
    setCompraExterna(false)
    setObservacoes("")
  }

  const pedidoSelecionado = pedidos.find(
    (pedido) => pedido.id === pedidoId
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Planos de Corte
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <label className="block mb-2 font-semibold">
          Selecione o pedido
        </label>

        <select
          className="border p-3 rounded-lg w-full"
          value={pedidoId}
          onChange={(e) => {
            setPedidoId(e.target.value)
            limparFormulario()
          }}
        >
          <option value="">Selecione...</option>

          {pedidos.map((pedido) => (
            <option key={pedido.id} value={pedido.id}>
              Pedido #{pedido.numeroPedido} - {pedido.cliente?.nome}
            </option>
          ))}
        </select>

        {pedidoSelecionado && (
          <div className="mt-4 text-sm text-gray-700">
            <p>
              <strong>Status:</strong> {pedidoSelecionado.status}
            </p>
            <p>
              <strong>Data entrega:</strong>{" "}
              {pedidoSelecionado.dataEntrega
                ? pedidoSelecionado.dataEntrega.substring(0, 10)
                : "Sem data"}
            </p>
          </div>
        )}
      </div>

      {pedidoId && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-md mb-8"
        >
          <h2 className="text-xl font-bold mb-4">
            {editandoId ? "Editar Plano" : "Novo Plano"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Número do plano"
              className="border p-3 rounded-lg"
              value={numeroPlano}
              onChange={(e) => setNumeroPlano(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Quantidade de chapas"
              className="border p-3 rounded-lg"
              value={quantidadeChapas}
              onChange={(e) => setQuantidadeChapas(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Medida encabeçamento"
              className="border p-3 rounded-lg"
              value={medidaEncabecamento}
              onChange={(e) => setMedidaEncabecamento(e.target.value)}
            />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={compraExterna}
                onChange={(e) => setCompraExterna(e.target.checked)}
              />
              Compra externa
            </label>

            <textarea
              placeholder="Observações"
              className="border p-3 rounded-lg col-span-2"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              {editandoId ? "Atualizar Plano" : "Salvar Plano"}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={limparFormulario}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {pedidoId && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="text-left p-4">Plano</th>
                <th className="text-left p-4">Chapas</th>
                <th className="text-left p-4">Encabeçamento</th>
                <th className="text-left p-4">Compra Externa</th>
                <th className="text-left p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {planos.map((plano) => (
                <tr key={plano.id} className="border-t">
                  <td className="p-4">{plano.numeroPlano}</td>
                  <td className="p-4">{plano.quantidadeChapas}</td>
                  <td className="p-4">
                    {plano.medidaEncabecamento || "-"}
                  </td>
                  <td className="p-4">
                    {plano.compraExterna ? "Sim" : "Não"}
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => editarPlano(plano)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => excluirPlano(plano.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}

              {planos.length === 0 && (
                <tr>
                  <td className="p-4" colSpan="5">
                    Nenhum plano cadastrado para este pedido.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}