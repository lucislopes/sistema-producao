import { useEffect, useState } from "react"
import { api } from "../services/api"

export function ServicosPlano() {
  const [pedidos, setPedidos] = useState([])
  const [planos, setPlanos] = useState([])
  const [servicos, setServicos] = useState([])
  const [tiposServico, setTiposServico] = useState([])
  const [operadores, setOperadores] = useState([])

  const [pedidoId, setPedidoId] = useState("")
  const [planoId, setPlanoId] = useState("")
  const [editandoId, setEditandoId] = useState(null)

  const [tipoServicoId, setTipoServicoId] = useState("")
  const [operadorId, setOperadorId] = useState("")
  const [status, setStatus] = useState("ABERTO")
  const [observacoes, setObservacoes] = useState("")

  async function carregarDadosBase() {
    try {
      const [pedidosRes, tiposRes, funcionariosRes] =
        await Promise.all([
          api.get("/pedidos"),
          api.get("/tipos-servico"),
          api.get("/funcionarios")
        ])

      setPedidos(pedidosRes.data)
      setTiposServico(tiposRes.data)

      setOperadores(
        funcionariosRes.data.filter(
          (f) => f.funcao === "OPERADOR" && f.ativo
        )
      )
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar dados")
    }
  }

  async function carregarPlanos(idPedido) {
    if (!idPedido) {
      setPlanos([])
      setPlanoId("")
      setServicos([])
      return
    }

    try {
      const response = await api.get(
        `/planos-corte/pedido/${idPedido}`
      )

      setPlanos(response.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar planos")
    }
  }

  async function carregarServicos(idPlano) {
    if (!idPlano) {
      setServicos([])
      return
    }

    try {
      const response = await api.get(
        `/servicos-plano/plano/${idPlano}`
      )

      setServicos(response.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar serviços")
    }
  }

  useEffect(() => {
    carregarDadosBase()
  }, [])

  useEffect(() => {
    carregarPlanos(pedidoId)
  }, [pedidoId])

  useEffect(() => {
    carregarServicos(planoId)
  }, [planoId])

  async function handleSubmit(e) {
    e.preventDefault()

    const dados = {
      planoId,
      tipoServicoId,
      operadorId,
      status,
      observacoes
    }

    try {
      if (editandoId) {
        await api.put(`/servicos-plano/${editandoId}`, dados)
      } else {
        await api.post("/servicos-plano", dados)
      }

      limparFormulario()
      carregarServicos(planoId)
    } catch (error) {
      console.log(error)
      alert("Erro ao salvar serviço")
    }
  }

  function editarServico(servico) {
    setEditandoId(servico.id)
    setTipoServicoId(servico.tipoServicoId)
    setOperadorId(servico.operadorId || "")
    setStatus(servico.status)
    setObservacoes(servico.observacoes || "")
  }

  async function excluirServico(id) {
    const confirmar = confirm("Deseja excluir este serviço?")

    if (!confirmar) return

    try {
      await api.delete(`/servicos-plano/${id}`)
      carregarServicos(planoId)
    } catch (error) {
      console.log(error)
      alert("Erro ao excluir serviço")
    }
  }

  function limparFormulario() {
    setEditandoId(null)
    setTipoServicoId("")
    setOperadorId("")
    setStatus("ABERTO")
    setObservacoes("")
  }

  const pedidoSelecionado = pedidos.find(
    (pedido) => pedido.id === pedidoId
  )

  const planoSelecionado = planos.find(
    (plano) => plano.id === planoId
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Serviços do Plano
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">
              Pedido
            </label>

            <select
              className="border p-3 rounded-lg w-full"
              value={pedidoId}
              onChange={(e) => {
                setPedidoId(e.target.value)
                setPlanoId("")
                limparFormulario()
              }}
            >
              <option value="">Selecione o pedido</option>

              {pedidos.map((pedido) => (
                <option key={pedido.id} value={pedido.id}>
                  Pedido #{pedido.numeroPedido} - {pedido.cliente?.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Plano de Corte
            </label>

            <select
              className="border p-3 rounded-lg w-full"
              value={planoId}
              onChange={(e) => {
                setPlanoId(e.target.value)
                limparFormulario()
              }}
              disabled={!pedidoId}
            >
              <option value="">Selecione o plano</option>

              {planos.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.numeroPlano} - {plano.quantidadeChapas} chapas
                </option>
              ))}
            </select>
          </div>
        </div>

        {pedidoSelecionado && (
          <div className="mt-4 text-sm text-gray-700">
            <p>
              <strong>Cliente:</strong> {pedidoSelecionado.cliente?.nome}
            </p>
            <p>
              <strong>Status pedido:</strong> {pedidoSelecionado.status}
            </p>
          </div>
        )}

        {planoSelecionado && (
          <div className="mt-4 text-sm text-gray-700">
            <p>
              <strong>Plano:</strong> {planoSelecionado.numeroPlano}
            </p>
            <p>
              <strong>Chapas:</strong> {planoSelecionado.quantidadeChapas}
            </p>
          </div>
        )}
      </div>

      {planoId && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-md mb-8"
        >
          <h2 className="text-xl font-bold mb-4">
            {editandoId ? "Editar Serviço" : "Novo Serviço"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <select
              className="border p-3 rounded-lg"
              value={tipoServicoId}
              onChange={(e) => setTipoServicoId(e.target.value)}
              required
            >
              <option value="">Selecione o serviço</option>

              {tiposServico.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>

            <select
              className="border p-3 rounded-lg"
              value={operadorId}
              onChange={(e) => setOperadorId(e.target.value)}
            >
              <option value="">Sem operador</option>

              {operadores.map((operador) => (
                <option key={operador.id} value={operador.id}>
                  {operador.nome}
                </option>
              ))}
            </select>

            <select
              className="border p-3 rounded-lg"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ABERTO">Aberto</option>
              <option value="INICIADO">Iniciado</option>
              <option value="PAUSADO">Pausado</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>

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
              {editandoId ? "Atualizar Serviço" : "Salvar Serviço"}
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

      {planoId && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="text-left p-4">Serviço</th>
                <th className="text-left p-4">Operador</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {servicos.map((servico) => (
                <tr key={servico.id} className="border-t">
                  <td className="p-4">
                    {servico.tipoServico?.nome}
                  </td>

                  <td className="p-4">
                    {servico.operador?.nome || "-"}
                  </td>

                  <td className="p-4">
                    {servico.status}
                  </td>

                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => editarServico(servico)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => excluirServico(servico.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}

              {servicos.length === 0 && (
                <tr>
                  <td className="p-4" colSpan="4">
                    Nenhum serviço cadastrado para este plano.
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