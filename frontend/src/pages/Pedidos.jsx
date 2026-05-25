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

  const [historico, setHistorico] = useState([])
  const [pedidoHistorico, setPedidoHistorico] = useState(null)

  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

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
          (f) =>
            (f.funcao === "VENDEDOR" ||
            f.funcao === "VENDEDOR_OPERADOR") &&
            f.ativo
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

  async function carregarHistorico(pedido) {
    try {
      const response = await api.get(`/historico-pedido/${pedido.id}`)

      setHistorico(response.data)
      setPedidoHistorico(pedido)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar histórico")
    }
  }

  function formatarDataHora(data) {
    return new Date(data).toLocaleString("pt-BR")
  }

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleDateString("pt-BR")
  }

  function pedidoAtrasado(pedido) {
    if (!pedido.dataEntrega) return false

    if (
      pedido.status === "ENTREGUE" ||
      pedido.status === "CANCELADO"
    ) {
      return false
    }

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const entrega = new Date(pedido.dataEntrega)
    entrega.setHours(0, 0, 0, 0)

    return entrega < hoje
  }

  function classeStatus(status) {
    const classes = {
      ABERTO: "bg-gray-100 text-gray-700",
      EM_PRODUCAO: "bg-blue-100 text-blue-700",
      PENDENTE_PECA: "bg-orange-100 text-orange-700",
      AGUARDANDO_EXTERNO: "bg-purple-100 text-purple-700",
      PARCIAL: "bg-yellow-100 text-yellow-700",
      CONCLUIDO: "bg-green-100 text-green-700",
      PRONTO_ENTREGA: "bg-cyan-100 text-cyan-700",
      SAIU_ENTREGA: "bg-indigo-100 text-indigo-700",
      ENTREGUE: "bg-emerald-100 text-emerald-700",
      CANCELADO: "bg-red-100 text-red-700"
    }

    return classes[status] || "bg-gray-100 text-gray-700"
  }

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const textoBusca = busca.toLowerCase()

    const bateBusca =
      String(pedido.numeroPedido).includes(textoBusca) ||
      pedido.cliente?.nome?.toLowerCase().includes(textoBusca)

    const bateStatus =
      filtroStatus === "" || pedido.status === filtroStatus

    let batePeriodo = true

    if (dataInicio || dataFim) {
      if (!pedido.dataEntrega) {
        batePeriodo = false
      } else {
        const dataPedido = pedido.dataEntrega.substring(0, 10)

        if (dataInicio && dataPedido < dataInicio) {
          batePeriodo = false
        }

        if (dataFim && dataPedido > dataFim) {
          batePeriodo = false
        }
      }
    }

    return bateBusca && bateStatus && batePeriodo
  })

  const resumoPedidos = {
    total: pedidosFiltrados.length,

    abertos: pedidosFiltrados.filter(
      (p) => p.status === "ABERTO"
    ).length,

    emProducao: pedidosFiltrados.filter(
      (p) => p.status === "EM_PRODUCAO"
    ).length,

    atrasados: pedidosFiltrados.filter(
      (p) => pedidoAtrasado(p)
    ).length,

    entregues: pedidosFiltrados.filter(
      (p) => p.status === "ENTREGUE"
    ).length
  }

  function ResumoCard({ titulo, valor, tipo }) {
    const classes = {
      normal: "bg-white border-gray-200",
      perigo: "bg-red-50 border-red-500",
      sucesso: "bg-green-50 border-green-500",
      info: "bg-blue-50 border-blue-500"
    }

    return (
      <div
        className={`
          rounded-xl shadow-sm border p-4
          ${classes[tipo || "normal"]}
        `}
      >
        <p className="text-sm text-gray-600">
          {titulo}
        </p>

        <strong className="text-2xl font-bold">
          {valor}
        </strong>
      </div>
    )
  }


  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Pedidos
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <ResumoCard
          titulo="Total"
          valor={resumoPedidos.total}
        />

        <ResumoCard
          titulo="Abertos"
          valor={resumoPedidos.abertos}
        />

        <ResumoCard
          titulo="Em Produção"
          valor={resumoPedidos.emProducao}
        />

        <ResumoCard
          titulo="Atrasados"
          valor={resumoPedidos.atrasados}
          tipo={resumoPedidos.atrasados > 0 ? "perigo" : "normal"}
        />

        <ResumoCard
          titulo="Entregues"
          valor={resumoPedidos.entregues}
          tipo="sucesso"
        />
      </div>

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


      <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Buscar por número ou cliente..."
          className="border p-3 rounded-lg"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select
          className="border p-3 rounded-lg"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ABERTO">Aberto</option>
          <option value="EM_PRODUCAO">Em Produção</option>
          <option value="PENDENTE_PECA">Pendente Peça</option>
          <option value="AGUARDANDO_EXTERNO">Aguardando Externo</option>
          <option value="PARCIAL">Parcial</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="PRONTO_ENTREGA">Pronto Entrega</option>
          <option value="SAIU_ENTREGA">Saiu Entrega</option>
          <option value="ENTREGUE">Entregue</option>
          <option value="CANCELADO">Cancelado</option>
        </select>

        <input
          type="date"
          className="border p-3 rounded-lg"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />

        <input
          type="date"
          className="border p-3 rounded-lg"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setBusca("")
          setFiltroStatus("")
          setDataInicio("")
          setDataFim("")
        }}
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-lg"
      >
        Limpar filtros
      </button>
    </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-left p-4">Nº</th>
              <th className="text-left p-4">Cliente</th>
              <th className="text-left p-4">Vendedor</th>
              <th className="text-left p-4">Entrega</th>
              <th className="text-left p-4">Data</th> 
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {pedidosFiltrados.map((pedido) => (
              <tr
                key={pedido.id}
                className={`border-t ${
                  pedidoAtrasado(pedido) ? "bg-red-50" : ""
                }`}
              >
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
                  {formatarData(pedido.dataEntrega)}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${classeStatus(pedido.status)}`}
                  >
                    {pedido.status}
                  </span>
                </td>

                <td className="p-4 flex gap-2">
                <button
                  onClick={() => editarPedido(pedido)}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                >
                  Editar
                </button>

                <button
                  onClick={() => carregarHistorico(pedido)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg"
                >
                  Histórico
                </button>
              </td>
                
              </tr>
            ))}

            {pedidosFiltrados.length === 0 && (
              <tr>
                <td className="p-4" colSpan="7">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pedidoHistorico && (
        <div className="bg-white rounded-2xl shadow-md p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Histórico do Pedido #{pedidoHistorico.numeroPedido}
            </h2>

            <button
              onClick={() => {
                setPedidoHistorico(null)
                setHistorico([])
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg"
            >
              Fechar
            </button>
          </div>

          <div className="relative border-l-2 border-gray-300 ml-3 pl-6 flex flex-col gap-6">

            {historico.map((item) => (

              <div
                key={item.id}
                className="relative"
              >

                <div className="absolute -left-[34px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow">
                </div>

                <div className="bg-gray-50 border rounded-2xl p-4 shadow-sm">

                  <div className="flex justify-between items-start mb-2">

                    <p className="font-bold">
                      {item.descricao}
                    </p>

                    <span className="text-xs text-gray-500">
                      {formatarDataHora(item.createdAt)}
                    </span>

                  </div>

                  <p className="text-sm text-gray-600">
                    Tipo: {item.tipo}
                  </p>

                  <p className="text-sm text-gray-600">
                    Usuário: {
                      item.usuario?.funcionario?.nome || "-"
                    }
                  </p>

                </div>

              </div>

            ))}

            {historico.length === 0 && (
              <p className="text-gray-500">
                Nenhum histórico encontrado.
              </p>
            )}

          </div>
        </div>
      )}


    </div>
  )
}