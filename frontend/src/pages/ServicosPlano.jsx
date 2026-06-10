import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import {
  SquarePen,
  Trash2,
  Save,
  X,
  ClipboardList,
  PlayCircle,
  CheckCircle2,
  Clock
} from "lucide-react"


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
      operadorId: operadorId || null,
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
      await carregarServicos(planoId)
    } catch (error) {
      console.log(error)
      alert(
        error.response?.data?.error ||
        "Erro ao salvar serviço"
      )
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

  function statusServicoTexto(status) {
    const mapa = {
      ABERTO: "Aberto",
      INICIADO: "Em Produção",
      CONCLUIDO: "Concluído",
      CANCELADO: "Cancelado"
    }

    return mapa[status] || status
  }

  function statusPedidoTexto(status) {
    const mapa = {
      ABERTO: "Aberto",
      EM_PRODUCAO: "Em Produção",
      PRONTO_ENTREGA: "Pronto Entrega",
      SAIU_ENTREGA: "Saiu Entrega",
      ENTREGUE: "Entregue",
      CANCELADO: "Cancelado"
    }

    return mapa[status] || status
  }

  function ResumoCard({ titulo, valor, icon: Icon, tipo = "normal" }) {
    const classes = {
      normal: {
        card: "bg-white border-gray-200",
        icon: "bg-gray-100 text-gray-700"
      },
      info: {
        card: "bg-blue-50 border-blue-300",
        icon: "bg-blue-100 text-blue-700"
      },
      sucesso: {
        card: "bg-green-50 border-green-300",
        icon: "bg-green-100 text-green-700"
      }
    }

    const estilo = classes[tipo] || classes.normal

    return (
      <div className={`rounded-xl shadow-sm border p-4 ${estilo.card}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">{titulo}</p>
            <strong className="text-2xl font-bold block mt-1">
              {valor}
            </strong>
          </div>

          {Icon && (
            <div className={`p-3 rounded-xl ${estilo.icon}`}>
              <Icon size={24} />
            </div>
          )}
        </div>
      </div>
    )
  }

  const totalServicos = servicos.length

  const abertos = servicos.filter(
    (servico) => servico.status === "ABERTO"
  ).length

  const iniciados = servicos.filter(
    (servico) => servico.status === "INICIADO"
  ).length

  const concluidos = servicos.filter(
    (servico) => servico.status === "CONCLUIDO"
  ).length

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
                  Pedido {pedido.origemPedido === "EXTERNO" &&
                          pedido.numeroPedidoManual
                            ? pedido.numeroPedidoManual
                            : `#${pedido.numeroPedido}`} - {pedido.cliente?.nome}
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
          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-gray-700">
            <div>
              <strong>Cliente:</strong>{" "}
              {pedidoSelecionado.cliente?.nome || "-"}
            </div>

            <div>
              <strong>Status:</strong>{" "}
              <span className="ml-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {statusPedidoTexto(pedidoSelecionado.status)}
              </span>
            </div>

            {planoSelecionado && (
              <>
                <div>
                  <strong>Plano:</strong>{" "}
                  {planoSelecionado.numeroPlano}
                </div>

                <div>
                  <strong>Chapas:</strong>{" "}
                  {planoSelecionado.quantidadeChapas}
                </div>
              </>
            )}
          </div>
        )}

        {planoId && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <ResumoCard
              titulo="Serviços"
              valor={totalServicos}
              icon={ClipboardList}
            />

            <ResumoCard
              titulo="Abertos"
              valor={abertos}
              icon={Clock}
            />

            <ResumoCard
              titulo="Em Produção"
              valor={iniciados}
              tipo="info"
              icon={PlayCircle}
            />

            <ResumoCard
              titulo="Concluídos"
              valor={concluidos}
              tipo="sucesso"
              icon={CheckCircle2}
            />
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

          {editandoId && (
            <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm font-medium text-yellow-800">
              ✏️ Editando Serviço
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tipo de Serviço *
              </label>

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
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Operador
              </label>

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
            </div>

            {editandoId && (
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ABERTO">Aberto</option>
                <option value="INICIADO">Em Produção</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </Select>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Observações
              </label>

              <textarea
                placeholder="Observações do serviço..."
                rows={2}
                className="w-full border border-gray-300 p-3 rounded-lg resize-none"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              size="sm"
              type="submit"
              variant="primary"
              className="flex items-center gap-2 px-6 py-3"
            >
              {editandoId ? (
                <>
                  <SquarePen size={16} />
                  Atualizar Serviço
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar Serviço
                </>
              )}
            </Button>

            {editandoId && (
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={limparFormulario}
                className="flex items-center gap-2 px-5 py-3"
              >
                <X size={16} />
                Cancelar
              </Button>
            )}
          </div>
        </form>
      )}

      {planoId && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-6 pb-3">
            <h2 className="text-xl font-bold">
              Serviços Cadastrados
            </h2>

            <p className="text-sm text-gray-600">
              {servicos.length} serviço{servicos.length === 1 ? "" : "s"} cadastrado{servicos.length === 1 ? "" : "s"} neste plano.
            </p>
          </div>


    <div className="px-6 pb-6">
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <Table >
            <thead >
              <tr>
                <Th >Serviço</Th>
                <Th >Operador</Th>
                <Th >Status</Th>
                <Th>Observações</Th>
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

                  <Td className="max-w-[280px] truncate">
                    {servico.observacoes || "-"}
                  </Td>
                  
                  <Td className="w-[140px]">
                    <div className="flex gap-2">

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => editarServico(servico)}
                      >
                        <SquarePen size={16} />
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => excluirServico(servico.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}

              {servicos.length === 0 && (
                <tr>
                  <Td colSpan="4" className="text-center text-gray-500 py-6">
                    Nenhum serviço cadastrado para este plano.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        </div>
        </div>
      )}
    </div>
  )
}
