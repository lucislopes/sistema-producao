import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Link } from "react-router-dom"
import { AutocompleteCliente } from "../components/AutocompleteCliente"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import { Table, Th, Td } from "../components/ui/Table"

import {
  SquarePen,
  Eye,
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


function ResumoCard({ titulo, valor, tipo, icon: Icon }) {
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {titulo}
          </p>

          <strong className="text-2xl font-bold">
            {valor}
          </strong>
        </div>

        {Icon && (
          <div className="bg-white/70 p-3 rounded-xl">
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  )
}

function OpcaoCard({
  name,
  checked,
  onChange,
  titulo,
  descricao,
  icon: Icon
}) {
  return (
    <label
      className={`
        flex items-start gap-3 rounded-xl border p-4 cursor-pointer
        transition hover:bg-gray-50
        ${checked ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-gray-200 bg-white"}
      `}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1"
      />

      {Icon && (
        <div
          className={`
            rounded-lg p-2
            ${checked ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}
          `}
        >
          <Icon size={18} />
        </div>
      )}

      <div>
        <strong className="block text-sm text-gray-900">
          {titulo}
        </strong>

        <p className="text-sm text-gray-500 mt-1">
          {descricao}
        </p>
      </div>
    </label>
  )
}

function SecaoFormulario({ numero, titulo, descricao, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900">
          {numero}. {titulo}
        </h3>

        {descricao && (
          <p className="text-sm text-gray-500 mt-1">
            {descricao}
          </p>
        )}
      </div>

      {children}
    </section>
  )
}

function Campo({ label, obrigatorio, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {obrigatorio && <span className="text-red-500"> *</span>}
      </label>

      {children}
    </div>
  )
}


export function Pedidos() {
  const [pedidos, setPedidos] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [rotas, setRotas] = useState([])

  const [editandoId, setEditandoId] = useState(null)
  const [origemPedido, setOrigemPedido] = useState("EXTERNO")
  const [numeroPedidoManual, setNumeroPedidoManual] = useState("")  
  const [updatedAtOriginal, setUpdatedAtOriginal] = useState("")

  const [clienteId, setClienteId] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [dataEntrega, setDataEntrega] = useState("")
  const [tipoEntrega, setTipoEntrega] = useState("ENTREGA_EMPRESA")
  const [responsavelFrete, setResponsavelFrete] = useState("CLIENTE")
  const [rotaId, setRotaId] = useState("")
  const [valorFrete, setValorFrete] = useState("")
  const [valorFretePadrao, setValorFretePadrao] = useState("")
  const [valorFreteCobrado, setValorFreteCobrado] = useState("")
  const [motivoAlteracaoFrete, setMotivoAlteracaoFrete] = useState("")
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

  const [totalChapas, setTotalChapas] = useState("")
  const [quantidadeChapasDiretoEntrega, setQuantidadeChapasDiretoEntrega] = useState("")

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
          api.get("/funcionarios/vendedores"),
          api.get("/rotas-entrega")
        ])

        setPedidos(pedidosRes.data.dados)
        setPaginacao(pedidosRes.data.paginacao)
        setClientes(clientesRes.data)
        setVendedores(funcionariosRes.data)
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

  const freteAlterado =
  tipoEntrega === "ENTREGA_EMPRESA" &&
  valorFretePadrao !== "" &&
  valorFreteCobrado !== "" &&
  Number(valorFreteCobrado) !== Number(valorFretePadrao)

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

      responsavelFrete:
        tipoEntrega === "CLIENTE_RETIRA" ? null : responsavelFrete,

      rotaId:
        tipoEntrega === "CLIENTE_RETIRA" ? null : rotaId,

      valorFrete:
        tipoEntrega === "CLIENTE_RETIRA" ? null : valorFreteCobrado,

      valorFretePadrao:
        tipoEntrega === "CLIENTE_RETIRA" ? null : valorFretePadrao,

      valorFreteCobrado:
        tipoEntrega === "CLIENTE_RETIRA" ? null : valorFreteCobrado,

      freteAlterado:
        tipoEntrega === "CLIENTE_RETIRA" ? false : freteAlterado,

      motivoAlteracaoFrete:
        freteAlterado ? motivoAlteracaoFrete : null,

      valorTotal,

      ...(tipoPedido === "DIRETO_ENTREGA"
      ? {
          quantidadeChapasDiretoEntrega:
                Number(quantidadeChapasDiretoEntrega)
            }
          : {}),

      nomeRecebedor:
        tipoEntrega === "CLIENTE_RETIRA" ? null : nomeRecebedor,

      contatoRecebedor:
        tipoEntrega === "CLIENTE_RETIRA" ? null : contatoRecebedor,

      enderecoEntrega:
        tipoEntrega === "CLIENTE_RETIRA" ? null : enderecoEntrega,
      status,
      observacoes,
      updatedAt: updatedAtOriginal
    }

    if (freteAlterado && !motivoAlteracaoFrete.trim()) {
      alert("Informe o motivo da alteração do frete")
      return
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
    setResponsavelFrete(pedido.responsavelFrete || "CLIENTE")
    setRotaId(pedido.rotaId || "")
    setValorFrete(pedido.valorFrete || "")
    setValorFretePadrao(pedido.valorFretePadrao || pedido.rota?.valorFrete || pedido.valorFrete || "")
    setValorFreteCobrado(pedido.valorFreteCobrado || pedido.valorFrete || "")
    setMotivoAlteracaoFrete(pedido.motivoAlteracaoFrete || "")
    setValorTotal(pedido.valorTotal || "")
    setTotalChapas(pedido.totalChapas || "")
    setNomeRecebedor(pedido.nomeRecebedor || "")
    setContatoRecebedor(pedido.contatoRecebedor || "")
    setEnderecoEntrega(pedido.enderecoEntrega || "")
    setStatus(pedido.status)
    setObservacoes(pedido.observacoes || "")
  }

  function limparFormulario() {
    setOrigemPedido("EXTERNO")
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
    setValorFretePadrao("")
    setValorFreteCobrado("")
    setMotivoAlteracaoFrete("")
    setValorTotal("")
    setTotalChapas("")
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
      setValorFretePadrao(rota.valorFrete)
      setValorFreteCobrado(rota.valorFrete)
      setMotivoAlteracaoFrete("")
    } else {
      setValorFrete("")
      setValorFretePadrao("")
      setValorFreteCobrado("")
      setMotivoAlteracaoFrete("")
    }
  }

  function formatarDataHora(data) {
    return new Date(data).toLocaleString("pt-BR")
  }

  function formatarData(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-")

    return `${dia}/${mes}/${ano}`
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

  
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <ResumoCard
          titulo="Total"
          valor={resumoPedidos.total}
          icon={Package}
        />

        <ResumoCard
          titulo="Abertos"
          valor={resumoPedidos.abertos}
          icon={ClipboardList}
        />

        <ResumoCard
          titulo="Em Produção"
          valor={resumoPedidos.emProducao}
          icon={Factory}
        />

        <ResumoCard
          titulo="Atrasados"
          valor={resumoPedidos.atrasados}
          tipo={resumoPedidos.atrasados > 0 ? "perigo" : "normal"}
          icon={TriangleAlert}
        />

        <ResumoCard
          titulo="Entregues"
          valor={resumoPedidos.entregues}
          tipo="sucesso"
          icon={CheckCircle}
        />
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md mb-8"
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText size={22} />
            {editandoId ? "Editar Pedido" : "Novo Pedido"}
          </h2>

          <span className="text-sm text-gray-500">
            Campos com * são obrigatórios
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <SecaoFormulario
            numero="1"
            titulo="Origem do pedido"
            descricao="Informe se o pedido veio de outro sistema ou foi gerado diretamente no sistema."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <OpcaoCard
                name="origemPedido"
                checked={origemPedido === "EXTERNO"}
                onChange={() => setOrigemPedido("EXTERNO")}
                titulo="Pedido de outro sistema"
                descricao="Usa um número externo informado manualmente."
                icon={FileText}
              />

              <OpcaoCard
                name="origemPedido"
                checked={origemPedido === "INTERNO"}
                onChange={() => {
                  setOrigemPedido("INTERNO")
                  setNumeroPedidoManual("")
                }}
                titulo="Pedido gerado pelo sistema"
                descricao="Usa a numeração automática do sistema."
                icon={ClipboardList}
              />
            </div>

            {origemPedido === "EXTERNO" && (
              <div className="mt-4">
                <Campo label="Número do pedido externo" obrigatorio>
                  <Input
                    type="text"
                    placeholder="Ex.: 12345/2026"
                    value={numeroPedidoManual}
                    onChange={(e) => setNumeroPedidoManual(e.target.value)}
                    required
                  />
                </Campo>
              </div>
            )}
          </SecaoFormulario>

          <SecaoFormulario
            numero="2"
            titulo="Fluxo do pedido"
            descricao="Define se o pedido passará pela produção ou irá direto para expedição."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <OpcaoCard
                name="tipoPedido"
                checked={tipoPedido === "COM_PRODUCAO"}
                onChange={() => {
                  setTipoPedido("COM_PRODUCAO")
                  setQuantidadeChapasDiretoEntrega("")
                }}
                titulo="Pedido com produção"
                descricao="Vai para plano de corte, serviços e painel do operador."
                icon={Factory}
              />

              <OpcaoCard
                name="tipoPedido"
                checked={tipoPedido === "DIRETO_ENTREGA"}
                onChange={() => setTipoPedido("DIRETO_ENTREGA")}
                titulo="Direto para entrega"
                descricao="Não passa pela produção. Entra direto na expedição."
                icon={Package}
              />
            </div>

            {tipoPedido === "DIRETO_ENTREGA" && (
              <div className="mt-4">
                <Campo label="Quantidade de chapas" obrigatorio>
                  <Input
                    type="number"
                    placeholder="Informe a quantidade de chapas"
                    value={quantidadeChapasDiretoEntrega}
                    onChange={(e) => setQuantidadeChapasDiretoEntrega(e.target.value)}
                    required
                  />
                </Campo>
              </div>
            )}
          </SecaoFormulario>

          <SecaoFormulario
            numero="3"
            titulo="Dados principais"
            descricao="Dados comerciais básicos do pedido."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Cliente" obrigatorio>
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
                    title="Cadastrar cliente"
                  >
                    <UserPlus size={18} />
                  </Button>
                </div>
              </Campo>

              <Campo label="Vendedor" obrigatorio>
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
              </Campo>

              <Campo label="Data prevista para entrega">
                <Input
                  type="date"
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                />
              </Campo>

              <Campo label="Valor total do pedido">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                />
              </Campo>

              {editandoId && (
                <Campo label="Status">
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
                </Campo>
              )}
            </div>
          </SecaoFormulario>

          <SecaoFormulario
            numero="4"
            titulo="Entrega"
            descricao="Informe se a empresa entregará ou se o cliente fará a retirada."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <OpcaoCard
                name="tipoEntrega"
                checked={tipoEntrega === "ENTREGA_EMPRESA"}
                onChange={() => {
                  setTipoEntrega("ENTREGA_EMPRESA")
                  setResponsavelFrete("CLIENTE")
                }}
                titulo="Empresa entrega"
                descricao="Habilita rota, frete e dados do recebedor."
                icon={Route}
              />

              <OpcaoCard
                name="tipoEntrega"
                checked={tipoEntrega === "CLIENTE_RETIRA"}
                onChange={() => {
                  setTipoEntrega("CLIENTE_RETIRA")
                  setResponsavelFrete("")
                  setRotaId("")
                  setValorFrete("")
                  setNomeRecebedor("")
                  setContatoRecebedor("")
                  setEnderecoEntrega("")
                }}
                titulo="Cliente retira"
                descricao="Remove rota, frete e endereço de entrega."
                icon={Package}
              />
            </div>

            {tipoEntrega === "ENTREGA_EMPRESA" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Campo label="Responsável pelo frete">
                  <Select
                    value={responsavelFrete}
                    onChange={(e) => setResponsavelFrete(e.target.value)}
                  >
                    <option value="CLIENTE">Frete Cliente</option>
                    <option value="EMPRESA">Frete Empresa</option>
                  </Select>
                </Campo>

                <Campo label="Rota">
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
                      title="Cadastrar rota"
                    >
                      <Route size={18} />
                    </Button>
                  </div>
                </Campo>

                <Campo label="Valor do frete">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={valorFreteCobrado}
                    onChange={(e) => {
                      setValorFreteCobrado(e.target.value)
                      setValorFrete(e.target.value)
                    }}
                  />
                </Campo>

                {freteAlterado && (
                  <div className="md:col-span-2 rounded-xl bg-yellow-50 border border-yellow-300 p-4 text-sm text-yellow-800">
                    <strong>Atenção:</strong> o frete cobrado está diferente do valor da rota.

                    <div className="mt-2">
                      Valor da rota: <strong>R$ {valorFretePadrao}</strong>
                      {" | "}
                      Valor cobrado: <strong>R$ {valorFreteCobrado}</strong>
                    </div>

                    <div className="mt-3">
                      <Campo label="Motivo da alteração do frete" obrigatorio>
                        <textarea
                          className="w-full border border-yellow-300 p-3 rounded-lg min-h-[80px]"
                          placeholder="Ex.: desconto autorizado, cliente negociou, rota especial..."
                          value={motivoAlteracaoFrete}
                          onChange={(e) => setMotivoAlteracaoFrete(e.target.value)}
                          required
                        />
                      </Campo>
                    </div>
                  </div>
                )}

                <Campo label="Nome do recebedor">
                  <Input
                    type="text"
                    placeholder="Nome completo"
                    value={nomeRecebedor}
                    onChange={(e) => setNomeRecebedor(e.target.value)}
                  />
                </Campo>

                <Campo label="Contato do recebedor">
                  <Input
                    type="text"
                    placeholder="Telefone ou WhatsApp"
                    value={contatoRecebedor}
                    onChange={(e) => setContatoRecebedor(e.target.value)}
                  />
                </Campo>

                <Campo label="Endereço de entrega">
                  <Input
                    type="text"
                    placeholder="Endereço completo"
                    value={enderecoEntrega}
                    onChange={(e) => setEnderecoEntrega(e.target.value)}
                  />
                </Campo>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                Cliente retira: rota, frete, recebedor, contato e endereço serão ignorados no salvamento.
              </div>
            )}
          </SecaoFormulario>

          <div className="xl:col-span-2">
            <Campo label="Observações">
              <textarea
                placeholder="Informações adicionais sobre o pedido..."
                className="w-full border border-gray-300 p-3 rounded-lg min-h-[90px]"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </Campo>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end gap-2">
          {editandoId && (
            <Button
              size="sm"
              type="button"
              variant="secondary"
              className="flex items-center gap-2 px-3 py-3"
              onClick={limparFormulario}
            >
              <X size={16} />
              Cancelar
            </Button>
          )}

          <Button
            size="sm"
            variant="primary"
            type="submit"
            className="flex items-center gap-2 px-6 py-3"
          >
            {editandoId ? (
              <>
                <SquarePen size={16} />
                Atualizar Pedido
              </>
            ) : (
              <>
                <Save size={16} />
                Salvar Pedido
              </>
            )}
          </Button>
        </div>
      </form>

        <div className="bg-white p-4 rounded-2xl shadow-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-end">

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <Input
                type="text"
                placeholder="Buscar por número ou cliente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <Filter
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <Select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="pl-10"
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
            </div>

            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="pl-10"
              />
            </div>

            <div>

              <Select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </Select>
            </div>

            <Button
              size="sm"
              type="button"
              variant=""
             className="
              w-full flex items-center justify-center gap-2 py-3
              bg-red-50
              text-red-700
              border
              border-red-200
              hover:bg-red-100
                 "
              title="Limpar filtros"
              onClick={() => {
                setBusca("")
                setFiltroStatus("")
                setDataInicio("")
                setDataFim("")
              }}
            >
              <Eraser size={16} />
              Limpar
            </Button>

          </div>
        </div>

      <div className="bg-white shadow-md">
        <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Cliente</Th>
              <Th>Vendedor</Th>
              <Th>Tipo Entrega</Th>
              <Th>Data Entrega</Th>
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
                      <SquarePen size={16} />
                    </Button>

                    <Link
                      to={`/pedidos/${pedido.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Eye size={16} />
                    </Link>

                    {pedido.tipoPedido !== "DIRETO_ENTREGA" && (
                      <Link
                        to={`/planos-corte?pedidoId=${pedido.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                      >
                        <ClipboardList size={16} /> Planos
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

        <div className="flex justify-end gap-2 mt-6" size="sm">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setModalClienteAberto(false)}
          >
            Cancelar
          </Button>

            <Button
              size="sm"
              variant="primary"
              type="button"
              onClick={criarClienteRapido}
              className="flex items-center gap-2 px-6 py-3"
            >
              <Save size={16} />
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
            <Save size={16} />
            Salvar Rota
          </Button>
        </div>
      </div>
    </div>
  )}

    </div>
  )
}