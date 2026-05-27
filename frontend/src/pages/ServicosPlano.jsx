import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { BadgeStatus } from "../components/ui/BadgeStatus"

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

  const [searchParams] = useSearchParams()
  const pedidoIdUrl = searchParams.get("pedidoId")
  const planoIdUrl = searchParams.get("planoId")

  async function carregarDadosBase() {
    try {
      const [pedidosRes, tiposRes, operadoresRes] = await Promise.all([

    api.get("/pedidos", {
      params: {
        page: 1,
        limit: 100,
        somenteAtivos: true
      }
    }),

    api.get("/tipos-servico"),

    api.get("/funcionarios/operadores")

  ])

  setPedidos(pedidosRes.data.dados || pedidosRes.data)

  setTiposServico(tiposRes.data)

  setOperadores(operadoresRes.data)

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
    async function carregarInicial() {
      await carregarDadosBase()

      if (pedidoIdUrl) {
        setPedidoId(pedidoIdUrl)

        const response = await api.get(
          `/planos-corte/pedido/${pedidoIdUrl}`
        )

        setPlanos(response.data)

        if (planoIdUrl) {
          setPlanoId(planoIdUrl)
        }
      }
    }

    carregarInicial()
  }, [])

  useEffect(() => {
    if (pedidoId && pedidoId !== pedidoIdUrl) {
      carregarPlanos(pedidoId)
    }
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
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">
              Pedido
            </label>

            <Select
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
            </Select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Plano de Corte
            </label>

            <Select
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
            </Select>
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
            <Select
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
            </Select>

            <Select
              value={operadorId}
              onChange={(e) => setOperadorId(e.target.value)}
            >
              <option value="">Sem operador</option>

              {operadores.map((operador) => (
                <option key={operador.id} value={operador.id}>
                  {operador.nome}
                </option>
              ))}
            </Select>

            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ABERTO">Aberto</option>
              <option value="INICIADO">Iniciado</option>
              <option value="EM_SEPARACAO">Em Separação</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="CANCELADO">Cancelado</option>
            </Select>

            <textarea
              placeholder="Observações"
              className="border p-3 rounded-lg col-span-2"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="submit"
            >
              {editandoId ? "Atualizar Serviço" : "Salvar Serviço"}
            </Button>

            {editandoId && (
              <Button
                type="button"
                onClick={limparFormulario}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      )}

      {planoId && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <Table >
            <thead >
              <tr>
                <Th >Serviço</Th>
                <Th >Operador</Th>
                <Th >Status</Th>
                <Th >Ações</Th>
              </tr>
            </thead>

            <tbody>
              {servicos.map((servico) => (
                <tr key={servico.id} className="border-t">
                  <Td>
                    {servico.tipoServico?.nome}
                  </Td>

                  <Td>
                    {servico.operador?.nome || "-"}
                  </Td>

                  <Td >
                    <BadgeStatus status={servico.status} />
                  </Td>

                  <Td >
                    <Button size="sm" onClick={() => editarServico(servico)}>
                      Editar
                    </Button>

                    <Button size="sm" variant="danger" onClick={() => excluirServico(servico.id)}>
                      Excluir
                    </Button>
                  </Td>
                </tr>
              ))}

              {servicos.length === 0 && (
                <tr>
                  <Td>
                    Nenhum serviço cadastrado para este plano.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  )
}