import { useEffect, useState } from "react"
import { api } from "../services/api"

export function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [rotas, setRotas] = useState([])

  const [editandoId, setEditandoId] = useState(null)

  const [clienteId, setClienteId] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [dataEntrega, setDataEntrega] = useState("")
  const [tipoEntrega, setTipoEntrega] = useState("ENTREGA_EMPRESA")
  const [responsavelFrete, setResponsavelFrete] = useState("CLIENTE")
  const [rotaId, setRotaId] = useState("")
  const [valorFrete, setValorFrete] = useState("")
  const [valorTotal, setValorTotal] = useState("")
  const [nomeRecebedor, setNomeRecebedor] = useState("")
  const [contatoRecebedor, setContatoRecebedor] = useState("")
  const [enderecoEntrega, setEnderecoEntrega] = useState("")
  const [status, setStatus] = useState("ABERTO")
  const [observacoes, setObservacoes] = useState("")

  async function carregarDados() {
    try {
      const [pedidosRes, clientesRes, funcionariosRes, rotasRes] =
        await Promise.all([
          api.get("/pedidos"),
          api.get("/clientes"),
          api.get("/funcionarios"),
          api.get("/rotas-entrega")
        ])

      setPedidos(pedidosRes.data)
      setClientes(clientesRes.data)
      setVendedores(
        funcionariosRes.data.filter(
          (f) => f.funcao === "VENDEDOR" && f.ativo
        )
      )
      setRotas(rotasRes.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar dados")
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()

    const dados = {
      clienteId,
      vendedorId,
      dataEntrega,
      tipoEntrega,
      responsavelFrete,
      rotaId,
      valorFrete,
      valorTotal,
      nomeRecebedor,
      contatoRecebedor,
      enderecoEntrega,
      status,
      observacoes
    }

    try {
      if (editandoId) {
        await api.put(`/pedidos/${editandoId}`, dados)
      } else {
        await api.post("/pedidos", dados)
      }

      limparFormulario()
      carregarDados()
    } catch (error) {
      console.log(error)
      alert("Erro ao salvar pedido")
    }
  }

  function editarPedido(pedido) {
    setEditandoId(pedido.id)
    setClienteId(pedido.clienteId)
    setVendedorId(pedido.vendedorId)
    setDataEntrega(
      pedido.dataEntrega
        ? pedido.dataEntrega.substring(0, 10)
        : ""
    )
    setTipoEntrega(pedido.tipoEntrega)
    setResponsavelFrete(pedido.responsavelFrete)
    setRotaId(pedido.rotaId || "")
    setValorFrete(pedido.valorFrete || "")
    setValorTotal(pedido.valorTotal || "")
    setNomeRecebedor(pedido.nomeRecebedor || "")
    setContatoRecebedor(pedido.contatoRecebedor || "")
    setEnderecoEntrega(pedido.enderecoEntrega || "")
    setStatus(pedido.status)
    setObservacoes(pedido.observacoes || "")
  }

  function limparFormulario() {
    setEditandoId(null)
    setClienteId("")
    setVendedorId("")
    setDataEntrega("")
    setTipoEntrega("ENTREGA_EMPRESA")
    setResponsavelFrete("CLIENTE")
    setRotaId("")
    setValorFrete("")
    setValorTotal("")
    setNomeRecebedor("")
    setContatoRecebedor("")
    setEnderecoEntrega("")
    setStatus("ABERTO")
    setObservacoes("")
  }

  function aplicarRotaSelecionada(id) {
    setRotaId(id)

    const rota = rotas.find((r) => r.id === id)

    if (rota) {
      setValorFrete(rota.valorFrete)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Pedidos
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md mb-8"
      >
        <h2 className="text-xl font-bold mb-4">
          {editandoId ? "Editar Pedido" : "Novo Pedido"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <select
            className="border p-3 rounded-lg"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
          >
            <option value="">Selecione o cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
            ))}
          </select>

          <select
            className="border p-3 rounded-lg"
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            required
          >
            <option value="">Selecione o vendedor</option>
            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nome}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="border p-3 rounded-lg"
            value={dataEntrega}
            onChange={(e) => setDataEntrega(e.target.value)}
          />

          <select
            className="border p-3 rounded-lg"
            value={tipoEntrega}
            onChange={(e) => setTipoEntrega(e.target.value)}
          >
            <option value="ENTREGA_EMPRESA">
              Empresa Entrega
            </option>
            <option value="CLIENTE_RETIRA">
              Cliente Retira
            </option>
          </select>

          <select
            className="border p-3 rounded-lg"
            value={responsavelFrete}
            onChange={(e) => setResponsavelFrete(e.target.value)}
          >
            <option value="CLIENTE">
              Frete Cliente
            </option>
            <option value="EMPRESA">
              Frete Empresa
            </option>
          </select>

          <select
            className="border p-3 rounded-lg"
            value={rotaId}
            onChange={(e) => aplicarRotaSelecionada(e.target.value)}
          >
            <option value="">Selecione a rota</option>
            {rotas.map((rota) => (
              <option key={rota.id} value={rota.id}>
                {rota.nome}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="0.01"
            placeholder="Valor frete"
            className="border p-3 rounded-lg"
            value={valorFrete}
            onChange={(e) => setValorFrete(e.target.value)}
          />

          <input
            type="number"
            step="0.01"
            placeholder="Valor total"
            className="border p-3 rounded-lg"
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
          />

          <input
            type="text"
            placeholder="Nome recebedor"
            className="border p-3 rounded-lg"
            value={nomeRecebedor}
            onChange={(e) => setNomeRecebedor(e.target.value)}
          />

          <input
            type="text"
            placeholder="Contato recebedor"
            className="border p-3 rounded-lg"
            value={contatoRecebedor}
            onChange={(e) => setContatoRecebedor(e.target.value)}
          />

          <input
            type="text"
            placeholder="Endereço entrega"
            className="border p-3 rounded-lg col-span-2"
            value={enderecoEntrega}
            onChange={(e) => setEnderecoEntrega(e.target.value)}
          />

          <select
            className="border p-3 rounded-lg"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ABERTO">Aberto</option>
            <option value="EM_PRODUCAO">Em Produção</option>
            <option value="PARCIAL">Parcial</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="ENTREGUE">Entregue</option>
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
            {editandoId ? "Atualizar Pedido" : "Salvar Pedido"}
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

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-left p-4">Nº</th>
              <th className="text-left p-4">Cliente</th>
              <th className="text-left p-4">Vendedor</th>
              <th className="text-left p-4">Entrega</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="border-t">
                <td className="p-4">
                  {pedido.numeroPedido}
                </td>

                <td className="p-4">
                  {pedido.cliente?.nome}
                </td>

                <td className="p-4">
                  {pedido.vendedor?.nome}
                </td>

                <td className="p-4">
                  {pedido.tipoEntrega === "CLIENTE_RETIRA"
                    ? "Cliente Retira"
                    : "Empresa Entrega"}
                </td>

                <td className="p-4">
                  {pedido.status}
                </td>

                <td className="p-4">
                  <button
                    onClick={() => editarPedido(pedido)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}

            {pedidos.length === 0 && (
              <tr>
                <td className="p-4" colSpan="6">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}