import { useEffect, useState } from "react"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { BadgePrazo } from "../components/ui/BadgePrazo"
import { BadgeStatus } from "../components/ui/BadgeStatus"

export function RelatorioPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [empresa, setEmpresa] = useState(null)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [pedido, setPedido] = useState("")
  const [cliente, setCliente] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [status, setStatus] = useState("")

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  const [paginacao, setPaginacao] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1
  })
  function exportarCSV() {
  const cabecalho = [
    "Pedido",
    "Cliente",
    "Vendedor",
    "Data Entrega",
    "Endereco",
    "Status",
    "Prazo",
    "Valor"
  ]

  const linhas = pedidos.map((item) => [
    `#${item.numeroPedido}`,
    item.cliente?.nome || "",
    item.vendedor?.nome || "",
    formatarData(item.dataEntrega),
    item.enderecoEntrega || item.cliente?.endereco || "",
    item.status || "",
    item.situacaoPrazo || "",
    item.valorTotal || ""
  ])

  const csv = [
    cabecalho,
    ...linhas
  ]
    .map((linha) =>
      linha
        .map((campo) =>
          `"${String(campo).replace(/"/g, '""')}"`
        )
        .join(";")
    )
    .join("\n")

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = "relatorio-pedidos.csv"
  link.click()

  URL.revokeObjectURL(url)
}

  async function carregarVendedores() {
    try {
      const response = await api.get("/funcionarios/operadores")

      setVendedores(
        response.data.filter(
          (f) =>
            f.funcao === "VENDEDOR" ||
            f.funcao === "VENDEDOR_OPERADOR"
        )
      )
    } catch (error) {
      console.log(error)
    }
  }

  async function carregarRelatorio(pagina = page) {
    try {
      const [relatorioResponse, empresaResponse] = await Promise.all([
        api.get("/relatorio-pedidos", {
          params: {
            dataInicio,
            dataFim,
            pedido,
            cliente,
            vendedorId,
            status,
            page: pagina,
            limit
          }
        }),

        api.get("/configuracao-empresa")
      ])

      setPedidos(relatorioResponse.data.dados)
      setPaginacao(relatorioResponse.data.paginacao)

      setEmpresa(empresaResponse.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar relatório de pedidos")
    }
  }

  useEffect(() => {
    carregarVendedores()
    carregarRelatorio(1)
  }, [])

  useEffect(() => {
    carregarRelatorio(page)
  }, [page, limit])

  function buscar() {
    setPage(1)
    carregarRelatorio(1)
  }

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setPedido("")
    setCliente("")
    setVendedorId("")
    setStatus("")
    setPage(1)
  }

  function imprimir() {
    window.print()
  }

  function formatarData(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-")
    return `${dia}/${mes}/${ano}`
  }

  function formatarMoeda(valor) {
    if (!valor) return "-"

    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6 no-print">
      <div className="flex gap-2">
        <Button variant="success" onClick={exportarCSV}>
            Exportar CSV
        </Button>

        <Button variant="dark" onClick={imprimir}>
            Imprimir
        </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <Input
            type="number"
            placeholder="Número pedido"
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />

          <Select
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
          >
            <option value="">Todos os vendedores</option>

            {vendedores.map((vendedor) => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nome}
              </option>
            ))}
          </Select>

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="secondary" onClick={buscar}>
            Buscar
          </Button>

          <Button variant="secondary" onClick={limparFiltros}>
            Limpar
          </Button>
        </div>
      </div>

      <CabecalhoImpressao
        empresa={empresa}
        titulo="Relatório de Pedidos"
        periodoInicio={dataInicio}
        periodoFim={dataFim}
        extra={
          status
            ? `Status filtrado: ${status}`
            : ""
        }
      />

      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">
            Listagem de Pedidos
          </h2>

          <p className="text-gray-600">
            Total encontrado: {paginacao.total}
          </p>
        </div>

        <Table>
          <thead>
            <tr>
              <Th>Pedido</Th>
              <Th>Cliente</Th>
              <Th>Vendedor</Th>
              <Th>Data Entrega</Th>
              <Th>Endereço</Th>
              <Th>Status</Th>
              <Th>Prazo</Th>
              <Th>Valor</Th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map((item) => (
              <tr key={item.id}>
                <td className="p-3 border font-bold">
                  #{item.numeroPedido}
                </td>

                <td className="p-3 border">
                  {item.cliente?.nome}
                </td>

                <td className="p-3 border">
                  {item.vendedor?.nome}
                </td>

                <td className="p-3 border">
                  {formatarData(item.dataEntrega)}
                </td>

                <td className="p-3 border">
                  {item.enderecoEntrega || item.cliente?.endereco || "-"}
                </td>

                <td className="p-3 border">
                  <BadgeStatus status={item.status} />
                </td>

                <td className="p-3 border">
                  <BadgePrazo prazo={item.situacaoPrazo} />
                </td>

                <td className="p-3 border">
                  {formatarMoeda(item.valorTotal)}
                </td>
              </tr>
            ))}

            {pedidos.length === 0 && (
              <tr>
                <td className="p-4 border" colSpan="8">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        <div className="flex justify-between items-center mt-4 no-print">
          <p className="text-sm text-gray-600">
            Página {paginacao.page} de {paginacao.totalPages} — Total: {paginacao.total}
          </p>

          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>

            <Button variant="secondary" disabled={page >= paginacao.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}