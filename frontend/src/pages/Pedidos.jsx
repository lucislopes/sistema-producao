import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Link } from "react-router-dom"
import { AutocompleteCliente } from "../components/AutocompleteCliente"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import { Table, Th, Td } from "../components/ui/Table"

export function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [rotas, setRotas] = useState([])

  const [editandoId, setEditandoId] = useState(null)
  const [origemPedido, setOrigemPedido] = useState("INTERNO")
  const [numeroPedidoManual, setNumeroPedidoManual] = useState("")  
  const [updatedAtOriginal, setUpdatedAtOriginal] = useState("")

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

  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [paginacao, setPaginacao] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1
  })

  const [modalClienteAberto, setModalClienteAberto] = useState(false)
  const [novoClienteNome, setNovoClienteNome] = useState("")
  const [novoClienteDocumento, setNovoClienteDocumento] = useState("")
  const [novoClienteTelefone, setNovoClienteTelefone] = useState("")
  const [novoClienteEndereco, setNovoClienteEndereco] = useState("")

  const [modalRotaAberto, setModalRotaAberto] = useState(false)
  const [novaRotaNome, setNovaRotaNome] = useState("")
  const [novaRotaValorFrete, setNovaRotaValorFrete] = useState("")

  const [tipoPedido, setTipoPedido] = useState("COM_PRODUCAO")



  async function carregarDados() {
    try {
      const [pedidosRes, clientesRes, funcionariosRes, rotasRes] =
        await Promise.all([
          api.get("/pedidos", {params: {page, limit}}),
          api.get("/clientes"),
          api.get("/funcionarios"),
          api.get("/rotas-entrega")
        ])

        setPedidos(pedidosRes.data.dados)
        setPaginacao(pedidosRes.data.paginacao)
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

  useEffect(() => {
    carregarDados()
  }, [page, limit])

  async function handleSubmit(e) {
    e.preventDefault()

    const dados = {
      origemPedido,
      numeroPedidoManual,
      tipoPedido,
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
      observacoes,
      updatedAt: updatedAtOriginal
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
      alert(
        error.response?.data?.error ||
        "Erro ao salvar pedido"
      )
    }
  }

  async function criarClienteRapido() {
    try {
      if (!novoClienteNome.trim()) {
        alert("Nome do cliente é obrigatório")
        return
      }

      const response = await api.post("/clientes", {
        nome: novoClienteNome,
        documento: novoClienteDocumento,
        telefone: novoClienteTelefone,
        endereco: novoClienteEndereco
      })

      const cliente = response.data

      setClienteId(cliente.id)
      setNomeRecebedor(cliente.nome || "")
      setContatoRecebedor(cliente.telefone || "")
      setEnderecoEntrega(cliente.endereco || "")

      setModalClienteAberto(false)
      setNovoClienteNome("")
      setNovoClienteDocumento("")
      setNovoClienteTelefone("")
      setNovoClienteEndereco("")

      carregarDados()
    } catch (error) {
      console.log(error)
      alert(
        error.response?.data?.error ||
        "Erro ao cadastrar cliente"
      )
    }
  }

  async function criarRotaRapida() {
    try {
      if (!novaRotaNome.trim()) {
        alert("Nome da rota é obrigatório")
        return
      }

      const response = await api.post("/rotas-entrega", {
        nome: novaRotaNome,
        valorFrete: novaRotaValorFrete || 0
      })

      const rota = response.data

      setRotaId(rota.id)
      setValorFrete(rota.valorFrete)

      setModalRotaAberto(false)
      setNovaRotaNome("")
      setNovaRotaValorFrete("")

      carregarDados()
    } catch (error) {
      console.log(error)
      alert(
        error.response?.data?.error ||
        "Erro ao cadastrar rota"
      )
    }
  }

  function editarPedido(pedido) {
    setOrigemPedido(pedido.origemPedido || "INTERNO")
    setNumeroPedidoManual(pedido.numeroPedidoManual || "")
    setTipoPedido(
      pedido.tipoPedido || "COM_PRODUCAO"
    )
      setEditandoId(pedido.id)
    setUpdatedAtOriginal(pedido.updatedAt || "")
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
    setOrigemPedido("INTERNO")
    setNumeroPedidoManual("")
    setTipoPedido("COM_PRODUCAO")
    setEditandoId(null)
    setUpdatedAtOriginal("")
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          value={origemPedido}
          onChange={(e) => {
            setOrigemPedido(e.target.value)

            if (e.target.value === "INTERNO") {
              setNumeroPedidoManual("")
            }
          }}
        >
          <option value="INTERNO">Pedido gerado pelo sistema</option>
          <option value="EXTERNO">Pedido de outro sistema</option>
        </Select>

        {origemPedido === "EXTERNO" ? (
          <Input
            type="text"
            placeholder="Número do pedido externo"
            value={numeroPedidoManual}
            onChange={(e) => setNumeroPedidoManual(e.target.value)}
          />
        ) : (
          <div />
        )}

        <Select
          value={tipoPedido}
          onChange={(e) => setTipoPedido(e.target.value)}
        >
          <option value="COM_PRODUCAO">Pedido com produção</option>
          <option value="DIRETO_ENTREGA">Pedido direto para entrega</option>
        </Select>

          <div className="flex gap-2">
          <div className="flex-1">
            <AutocompleteCliente
              clienteId={clienteId}
              onSelecionar={(cliente) => {
                setClienteId(cliente ? cliente.id : "")

                if (cliente) {
                  if (!nomeRecebedor) {
                    setNomeRecebedor(cliente.nome || "")
                  }

                  if (!contatoRecebedor) {
                    setContatoRecebedor(cliente.telefone || "")
                  }

                  if (!enderecoEntrega) {
                    setEnderecoEntrega(cliente.endereco || "")
                  }
                }
              }}
            />
          </div>

  <Button
    type="button"
    variant="secondary"
    onClick={() => setModalClienteAberto(true)}
  >
    +
  </Button>
</div>

          <Select
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
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
            />

            <span className="text-sm text-gray-500 whitespace-nowrap">
              Data Prevista p/ entrega
            </span>
          </div>

          <Select
            value={tipoEntrega}
            onChange={(e) => setTipoEntrega(e.target.value)}
          >
            <option value="ENTREGA_EMPRESA">
              Empresa Entrega
            </option>
            <option value="CLIENTE_RETIRA">
              Cliente Retira
            </option>
          </Select>

          <Select
            value={responsavelFrete}
            onChange={(e) => setResponsavelFrete(e.target.value)}
          >
            <option value="CLIENTE">
              Frete Cliente
            </option>
            <option value="EMPRESA">
              Frete Empresa
            </option>
          </Select>

          <div className="flex gap-2">
          <div className="flex-1">
            <Select
              value={rotaId}
              onChange={(e) => aplicarRotaSelecionada(e.target.value)}
            >
              <option value="">Selecione a rota</option>
              {rotas.map((rota) => (
                <option key={rota.id} value={rota.id}>
                  {rota.nome}
                </option>
              ))}
            </Select>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setModalRotaAberto(true)}
          >
            ➕ Rota
          </Button>
        </div>

          <Input
            type="number"
            step="0.01"
            placeholder="Valor frete"
            value={valorFrete}
            onChange={(e) => setValorFrete(e.target.value)}
          />

          <Input
            type="number"
            step="0.01"
            placeholder="Valor total"
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Nome recebedor"
            value={nomeRecebedor}
            onChange={(e) => setNomeRecebedor(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Contato recebedor"
            value={contatoRecebedor}
            onChange={(e) => setContatoRecebedor(e.target.value)}
          />

          <Input 
            type="text" 
            placeholder="Endereço entrega" 
            value={enderecoEntrega} 
            onChange={(e) => setEnderecoEntrega(e.target.value)} 
            />

          {editandoId && (
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ABERTO">Aberto</option>
              <option value="EM_SEPARACAO">Em Separação</option>
              <option value="EM_PRODUCAO">Em Produção</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="PRONTO_ENTREGA">Pronto Entrega</option>
              <option value="SAIU_ENTREGA">Saiu Entrega</option>
              <option value="ENTREGUE">Entregue</option>
              <option value="CANCELADO">Cancelado</option>
            </Select>
          )}

          <textarea
            placeholder="Observações"
            className="border p-3 rounded-lg md:col-span-2"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button size="sm"
            variant="primary" 
            type="submit">
              {editandoId ? "Atualizar Pedido" : "Salvar Pedido"}
          </Button>

          {editandoId && (
            <Button size="sm"
              type="button"
              variant = "secondary"
              onClick={limparFormulario}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>

        <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-end">

            <Input
              type="text"
              placeholder="Buscar por número ou cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <Select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="ABERTO">Aberto</option>
              <option value="EM_SEPARACAO">Em Separação</option>
              <option value="EM_PRODUCAO">Em Produção</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="PRONTO_ENTREGA">Pronto Entrega</option>
              <option value="SAIU_ENTREGA">Saiu Entrega</option>
              <option value="ENTREGUE">Entregue</option>
              <option value="CANCELADO">Cancelado</option>
            </Select>

            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />

            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />

            <Select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
            >
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </Select>

            <Button
              size="sm"
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setBusca("")
                setFiltroStatus("")
                setDataInicio("")
                setDataFim("")
              }}
            >
              Limpar
            </Button>

          </div>
        </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Cliente</Th>
              <Th>Vendedor</Th>
              <Th>Entrega</Th>
              <Th>Data</Th> 
              <Th>Status</Th>
              <Th>Ações</Th>
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
                <Td >
                  {pedido.origemPedido === "EXTERNO"
                  ? pedido.numeroPedidoManual
                  : `#${pedido.numeroPedido}`}
                </Td>

                <Td>
                  {pedido.cliente?.nome}
                </Td>

                <Td>
                  {pedido.vendedor?.nome}
                </Td>

                <Td>
                  {pedido.tipoEntrega === "CLIENTE_RETIRA"
                    ? "Cliente Retira"
                    : "Empresa Entrega"}
                </Td>

                <Td>
                  {formatarData(pedido.dataEntrega)}
                </Td>

                <Td >
                    <BadgeStatus status={pedido.status} />
                </Td>

                <Td>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => editarPedido(pedido)}
                    >
                      Editar
                    </Button>

                    <Link
                      to={`/pedidos/${pedido.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Detalhes
                    </Link>

                    {pedido.tipoPedido !== "DIRETO_ENTREGA" && (
                      <Link
                        to={`/planos-corte?pedidoId=${pedido.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                      >
                        Planos
                      </Link>
                    )}
                  </div>
                </Td>
                
              </tr>
            ))}

            {pedidosFiltrados.length === 0 && (
              <tr>
                <Td colSpan="7">
                  Nenhum pedido encontrado.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
        <div className="flex justify-between items-center p-4 no-print">
          <p className="text-sm text-gray-600">
            Página {paginacao.page} de {paginacao.totalPages} — Total: {paginacao.total}
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>

            <Button
              size="sm"
              variant="secondary"
              disabled={page >= paginacao.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>


      </div>

      {modalClienteAberto && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">
          Novo Cliente
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <Input
            type="text"
            placeholder="Nome do cliente"
            value={novoClienteNome}
            onChange={(e) => setNovoClienteNome(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Documento CPF/CNPJ"
            value={novoClienteDocumento}
            onChange={(e) => setNovoClienteDocumento(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Telefone"
            value={novoClienteTelefone}
            onChange={(e) => setNovoClienteTelefone(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Endereço"
            value={novoClienteEndereco}
            onChange={(e) => setNovoClienteEndereco(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setModalClienteAberto(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={criarClienteRapido}
          >
            Salvar Cliente
          </Button>
        </div>
      </div>
    </div>
  )}

    {modalRotaAberto && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4">
          Nova Rota
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <Input
            type="text"
            placeholder="Nome da rota"
            value={novaRotaNome}
            onChange={(e) => setNovaRotaNome(e.target.value)}
          />

          <Input
            type="number"
            step="0.01"
            placeholder="Valor do frete"
            value={novaRotaValorFrete}
            onChange={(e) => setNovaRotaValorFrete(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setModalRotaAberto(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={criarRotaRapida}
          >
            Salvar Rota
          </Button>
        </div>
      </div>
    </div>
  )}

    </div>
  )
}