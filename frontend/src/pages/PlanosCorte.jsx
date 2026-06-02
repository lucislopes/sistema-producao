import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { api } from "../services/api"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { Button } from "../components/ui/Button"
import { ConfirmModal } from "../components/ui/ConfirmModal"

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
            <Input
              type="text"
              placeholder="Número do plano"
              
              value={numeroPlano}
              onChange={(e) => setNumeroPlano(e.target.value)}
              required
            />

            <Input
              type="number"
              placeholder="Quantidade de chapas"
              value={quantidadeChapas}
              onChange={(e) => setQuantidadeChapas(e.target.value)}
              required
            />

            <Input
              type="text"
              placeholder="Medida encabeçamento"
              value={medidaEncabecamento}
              onChange={(e) => setMedidaEncabecamento(e.target.value)}
            />

            <label className="flex items-center gap-2">
              <Input
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
            <Button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              {editandoId ? "Atualizar Plano" : "Salvar Plano"}
            </Button>

            {editandoId && (
              <Button
                type="button"
                onClick={limparFormulario}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg"
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      )}

      {pedidoId && (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
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
              {planos.map((plano) => (
                <tr key={plano.id} className="border-t">
                  <Td >{plano.numeroPlano}</Td>
                  <Td >{plano.quantidadeChapas}</Td>
                  <Td >
                    {plano.medidaEncabecamento || "-"}
                  </Td>
                  <Td >
                    {plano.compraExterna ? "Sim" : "Não"}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => editarPlano(plano)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                      >
                        Editar
                      </Button>

                      <Link
                        to={`/servicos-plano?pedidoId=${pedidoId}&planoId=${plano.id}`}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        Serviços
                      </Link>

                      <Button 
                        variant="danger"
                        onClick={() => {
                          setPlanoParaExcluir(plano)
                          setModalExcluirAberto(true)
                        }}
                      >
                        Excluir
                      </Button>
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
