import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { Button } from "../components/ui/Button"
import { ConfirmModal } from "../components/ui/ConfirmModal"
import {
  SquarePen,
  Eye,
  Trash2,
  ClipboardList,
  UserPlus,
  Route,
  FileText,
  Search,
  Filter,
  Factory,
  Package,
  CheckCircle,
  TriangleAlert,
  CalendarDays,
  Eraser,
  Save,
  X
} from "lucide-react"


export function PlanosCorte() {
  const [pedidos, setPedidos] = useState([])
  const [planos, setPlanos] = useState([])
  const [pedidoId, setPedidoId] = useState("")
  const [editandoId, setEditandoId] = useState(null)
  const [updatedAtOriginal, setUpdatedAtOriginal] = useState("")
  const [numeroPlano, setNumeroPlano] = useState("")
  const [quantidadeChapas, setQuantidadeChapas] = useState("")
  const [medidaEncabecamento, setMedidaEncabecamento] = useState("")
  const [compraExterna, setCompraExterna] = useState(false)
  const [observacoes, setObservacoes] = useState("")
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false)
  const [planoParaExcluir, setPlanoParaExcluir] = useState(null)
  const [searchParams] = useSearchParams()
  const pedidoIdUrl = searchParams.get("pedidoId")


  async function carregarPedidos() {
    const response = await api.get("/pedidos", {
      params: {
        page: 1,
        limit: 100,
        somenteAtivos: true
      }
    })

    setPedidos(response.data.dados || response.data)
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
    if (pedidoIdUrl) {
      setPedidoId(pedidoIdUrl)
    }
  }, [pedidoIdUrl])

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
      observacoes,
      updatedAt: updatedAtOriginal
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
      alert(
        error.response?.data?.error ||
        "Erro ao salvar plano de corte"
      )
    }
  }

  function editarPlano(plano) {
    setEditandoId(plano.id)
    setUpdatedAtOriginal(plano.updatedAt || "")
    setNumeroPlano(plano.numeroPlano)
    setQuantidadeChapas(plano.quantidadeChapas)
    setMedidaEncabecamento(plano.medidaEncabecamento || "")
    setCompraExterna(plano.compraExterna)
    setObservacoes(plano.observacoes || "")
  }

  async function excluirPlano() {
    if (!planoParaExcluir) return

    try {
      await api.delete(`/planos-corte/${planoParaExcluir.id}`)

      setModalExcluirAberto(false)
      setPlanoParaExcluir(null)

      carregarPlanos(pedidoId)
    } catch (error) {
      console.log(error)
      alert("Erro ao excluir plano")
    }
  }

    function limparFormulario() {
      setEditandoId(null)
      setUpdatedAtOriginal("")
      setNumeroPlano("")
      setQuantidadeChapas("")
      setMedidaEncabecamento("")
      setCompraExterna(false)
      setObservacoes("")
    }

    function formatarData(data) {
      if (!data) return "Sem data"

      return new Date(data).toLocaleDateString("pt-BR")
    }

  const pedidoSelecionado = pedidos.find(
    (pedido) => pedido.id === pedidoId
  )

  const pedidoDiretoEntrega =
    pedidoSelecionado?.tipoPedido === "DIRETO_ENTREGA"

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

      const planosOrdenados = [...planos].sort(
        (a, b) => Number(a.numeroPlano) - Number(b.numeroPlano)
      )

      const totalPlanos = planos.length

      const totalChapas = planos.reduce(
        (total, plano) => total + Number(plano.quantidadeChapas || 0),
        0
      )

      const totalCompraExterna = planos.filter(
        (plano) => plano.compraExterna
      ).length


      function ResumoCard({ titulo, valor }) {
        return (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-600">
              {titulo}
            </p>

            <strong className="text-2xl font-bold block mt-1">
              {valor}
            </strong>
          </div>
        )
      }

   return (
    <div>
      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <label className="block mb-2 font-semibold">
          Selecione o pedido
        </label>

        <Select
          value={pedidoId}
          onChange={(e) => {
            setPedidoId(e.target.value)
            limparFormulario()
          }}
        >
          <option value="">Selecione...</option>

          {pedidos.map((pedido) => (
            <option key={pedido.id} value={pedido.id}>
              Pedido {pedido.origemPedido === "EXTERNO" &&
                      pedido.numeroPedidoManual
                        ? pedido.numeroPedidoManual
                        : `#${pedido.numeroPedido}`} - {pedido.cliente?.nome}
            </option>
          ))}
        </Select>

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

            <div>
              <strong>Entrega:</strong>{" "}
              {formatarData(pedidoSelecionado.dataEntrega)}
            </div>

            <div>
              <strong>Chapas:</strong>{" "}
              {pedidoSelecionado.totalChapas || totalChapas || 0}
            </div>
          </div>
        )}
            

      </div>

      {pedidoId && pedidoDiretoEntrega && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-4 rounded-2xl mb-8">
          Este pedido é direto para entrega e não possui plano de corte.
        </div>
      )}

      {pedidoId && !pedidoDiretoEntrega && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-md mb-8"
        >
          <h2 className="text-xl font-bold mb-4">
            {editandoId ? "Editar Plano" : "Novo Plano"}
          </h2>
          {editandoId && (
            <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-yellow-800">
              ✏️ Editando Plano {numeroPlano}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Número do Plano *
              </label>

              <Input
                type="text"
                placeholder="Ex: 1"
                value={numeroPlano}
                onChange={(e) => setNumeroPlano(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Quantidade de Chapas *
              </label>

              <Input
                type="number"
                placeholder="Ex: 32"
                value={quantidadeChapas}
                onChange={(e) => setQuantidadeChapas(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Medida de Encabeçamento
              </label>

              <Input
                type="text"
                placeholder="Ex: 3mm"
                value={medidaEncabecamento}
                onChange={(e) => setMedidaEncabecamento(e.target.value)}
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Compra Externa
              </label>

              <label className="flex items-center gap-2 h-[46px] border border-gray-300 rounded-lg px-3">
                <input
                  type="checkbox"
                  checked={compraExterna}
                  onChange={(e) => setCompraExterna(e.target.checked)}
                  className="h-4 w-4 accent-blue-600 cursor-pointer"
                />

                <span className="text-sm font-medium text-gray-700">
                  Possui compra externa
                </span>
              </label>
            </div>

            <textarea
              placeholder="Observações"
              className="border border-gray-300 p-3 rounded-lg col-span-2"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div className="mt-6 pt-4 flex justify-end gap-2">
            {editandoId && (
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={limparFormulario}
                className="flex items-center gap-2 px-5 py-3"
              >
                Cancelar
              </Button>
            )}

            <Button
              size="sm"
              type="submit"
              variant="primary"
              className="flex items-center gap-2 px-6 py-3"
            >
              {editandoId ? (
                <>
                  <SquarePen size={16} />
                  Atualizar Plano
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar Plano
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {pedidoId && !pedidoDiretoEntrega && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ResumoCard
            titulo="Planos"
            valor={totalPlanos}
          />

          <ResumoCard
            titulo="Total de Chapas"
            valor={totalChapas}
          />

          <ResumoCard
            titulo="Com Compra Externa"
            valor={totalCompraExterna}
          />
        </div>
      )}

      {pedidoId && !pedidoDiretoEntrega && (
        <div className="bg-white shadow-md">
        
          <Table>
            <thead>
              <tr>
                <Th>Plano</Th>
                <Th>Chapas</Th>
                <Th>Encabeçamento</Th>
                <Th>Compra Externa</Th>
                <Th>Ações</Th>
              </tr>
            </thead>

            <tbody>
              {planosOrdenados.map((plano) => (
                <tr key={plano.id} className="border-t">
                  <Td >{plano.numeroPlano}</Td>
                  <Td className="font-bold text-blue-700">
                    {plano.quantidadeChapas}
                  </Td>
                  <Td >
                    {plano.medidaEncabecamento || "-"}
                  </Td>
                  <Td>
                    {plano.compraExterna ? (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                        Sim
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-semibold">
                        Não
                      </span>
                    )}
                  </Td>
                  <Td className="w-[140px]">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        title="Editar plano"
                        onClick={() => editarPlano(plano)}
                      >
                        <SquarePen size={16} />
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        title="Excluir plano"
                        onClick={() => {
                          setPlanoParaExcluir(plano)
                          setModalExcluirAberto(true)
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>

                      <Link
                        title="Serviços"
                        to={`/servicos-plano?pedidoId=${pedidoId}&planoId=${plano.id}`}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <ClipboardList size={16} />
                        Serviços
                      </Link>
                    </div>
                  </Td>
                </tr>
              ))}

              {planos.length === 0 && (
                <tr>
                  <Td colSpan="5">
                    Nenhum plano cadastrado para este pedido.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      <ConfirmModal
        open={modalExcluirAberto}
        title="Excluir plano"
        message={`Deseja excluir o plano "${planoParaExcluir?.numeroPlano}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={excluirPlano}
        onCancel={() => {
          setModalExcluirAberto(false)
          setPlanoParaExcluir(null)
        }}
      />
    </div>
  )
}
