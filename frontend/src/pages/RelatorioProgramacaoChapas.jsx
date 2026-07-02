import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"

import {
  CalendarDays,
  ClipboardList,
  Download,
  Eraser,
  Package,
  Ruler,
  Search,
  TriangleAlert,
  TrendingUp
} from "lucide-react"

export function RelatorioProgramacaoChapas() {
  const [dados, setDados] = useState([])
  const [resumo, setResumo] = useState(null)
  const [porVendedor, setPorVendedor] = useState([])
  const [vendedores, setVendedores] = useState([])

  const [dataFim, setDataFim] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [cliente, setCliente] = useState("")
  const [limiteChapasDia, setLimiteChapasDia] = useState(90)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)

  const [paginacao, setPaginacao] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1
  })

    function formatarData(data) {
        if (!data) return "-"

        const texto = String(data).substring(0, 10)

        if (texto.includes("-")) {
            const [ano, mes, dia] = texto.split("-")
            return `${dia}/${mes}/${ano}`
        }

        const dataObj = new Date(data)

        return dataObj.toLocaleDateString("pt-BR")
        }

  function formatarNumero(valor, casas = 0) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas
    })
  }

  function calcularSituacaoDia(chapas) {
    const total = Number(chapas || 0)

    if (total > limiteChapasDia) {
      return {
        texto: "Excedido",
        classe: "bg-red-100 text-red-700 border-red-300",
        linha: "bg-red-50"
      }
    }

    if (total >= limiteChapasDia * 0.8) {
      return {
        texto: "Atenção",
        classe: "bg-yellow-100 text-yellow-800 border-yellow-300",
        linha: "bg-yellow-50"
      }
    }

    return {
      texto: "Livre",
      classe: "bg-green-100 text-green-700 border-green-300",
      linha: ""
    }
  }

  async function carregarVendedores() {
    try {
      const response = await api.get("/funcionarios/vendedores")
      setVendedores(response.data)
    } catch (error) {
      console.log(error)
    }
  }

  async function carregarRelatorio(pagina = page, filtros = {}) {
    try {
      const response = await api.get("/relatorio-programacao-chapas", {
        params: {
          dataFim,
          vendedorId,
          cliente,
          page: pagina,
          limit,
          ...filtros
        }
      })

      setDados(response.data.dados || [])
      setResumo(response.data.resumo || null)
      setPorVendedor(response.data.porVendedor || [])
      setPaginacao(
        response.data.paginacao || {
          total: 0,
          page: 1,
          limit,
          totalPages: 1
        }
      )
    } catch (error) {
      console.log(error)

      alert(
        error.response?.data?.error ||
          "Erro ao carregar programação de chapas."
      )
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
    setDataFim("")
    setVendedorId("")
    setCliente("")
    setLimiteChapasDia(90)
    setPage(1)

    carregarRelatorio(1, {
      dataFim: "",
      vendedorId: "",
      cliente: ""
    })
  }

  function exportarCSV() {
    const linhas = []

    dados.forEach((dia) => {
      const disponivel = limiteChapasDia - Number(dia.chapas || 0)
      const situacao = calcularSituacaoDia(dia.chapas)

      dia.itens.forEach((pedido) => {
        linhas.push([
          formatarData(dia.data),
          dia.chapas,
          dia.metrosEncabecamento || 0,
          dia.pedidos,
          limiteChapasDia,
          disponivel,
          situacao.texto,
          pedido.numeroPedidoFormatado,
          pedido.cliente?.nome || "",
          pedido.vendedor?.nome || "",
          pedido.status || "",
          pedido.totalChapas || 0
        ])
      })
    })

    const cabecalho = [
      "Data Entrega",
      "Chapas Dia",
      "Metros Encabeçamento",
      "Pedidos Dia",
      "Limite",
      "Disponível",
      "Situação",
      "Pedido",
      "Cliente",
      "Vendedor",
      "Status",
      "Chapas Pedido"
    ]

    const csv = [cabecalho, ...linhas]
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n")

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "programacao-producao.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  function situacaoProducaoTexto(status) {
    const mapa = {
      ABERTO: "Aguardando produção",
      EM_SEPARACAO: "Em separação",
      EM_PRODUCAO: "Em produção",
      CONCLUIDO: "Produção concluída",
      PRONTO_ENTREGA: "Pronto para expedição"
    }

    return mapa[status] || status || "-"
  }

  function situacaoProducaoClasse(status) {
    const mapa = {
      ABERTO: "bg-gray-100 text-gray-700 border-gray-300",
      EM_SEPARACAO: "bg-orange-100 text-orange-700 border-orange-300",
      EM_PRODUCAO: "bg-yellow-100 text-yellow-800 border-yellow-300",
      CONCLUIDO: "bg-green-100 text-green-700 border-green-300",
      PRONTO_ENTREGA: "bg-blue-100 text-blue-700 border-blue-300"
    }

    return mapa[status] || "bg-gray-100 text-gray-700 border-gray-300"
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600">
            Programação futura por data de entrega, começando de hoje em diante.
          </p>
        </div>

        <Button
          type="button"
          onClick={exportarCSV}
          className="bg-green-700 text-white px-5 py-3 rounded-lg flex items-center gap-2"
        >
          <Download size={18} />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card titulo="Chapas Programadas" valor={resumo?.totalChapas || 0} icon={Package} />
        <Card titulo="Pedidos" valor={resumo?.totalPedidos || 0} icon={ClipboardList} />
        <Card titulo="Dias Programados" valor={resumo?.diasProgramados || 0} icon={CalendarDays} />
        <Card titulo="Média/Dia" valor={resumo?.mediaDia || 0} icon={TrendingUp} decimal />
        <Card titulo="Limite Atual" valor={limiteChapasDia} icon={TriangleAlert} />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4">
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            placeholder="Até"
          />

          <Input
            type="text"
            placeholder="Cliente..."
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

          <Input
            type="number"
            min={1}
            value={limiteChapasDia}
            onChange={(e) =>
              setLimiteChapasDia(Number(e.target.value) || 90)
            }
            placeholder="Limite chapas/dia"
          />

          <Select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
          >
            <option value={25}>25 dias</option>
            <option value={50}>50 dias</option>
            <option value={100}>100 dias</option>
          </Select>

          <Button
            type="button"
            onClick={buscar}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Search size={18} />
            Buscar
          </Button>

          <Button
            type="button"
            variant=""
            onClick={limparFiltros}
            className="bg-red-50 text-red-700 border border-red-200 px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-red-100"
          >
            <Eraser size={18} />
            Limpar
          </Button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          O período sempre começa em hoje. A data informada serve apenas como limite final.
        </p>
      </div>

      {/*

      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Chapas por Vendedor
        </h2>

        <div className="space-y-2">
          {porVendedor.map((item) => (
            <div
              key={item.nome}
              className="flex justify-between border-b border-gray-100 py-2 text-sm"
            >
              <span>{item.nome}</span>

              <strong>
                {formatarNumero(item.chapas)} chapa(s) — {item.pedidos} pedido(s)
              </strong>
            </div>
          ))}

          {porVendedor.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhum dado por vendedor.
            </p>
          )}
        </div>
      </div>
      */}

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">
          Programação por Dia
        </h2>

        <Table>
          <thead>
            <tr>
              <Th>Data Entrega</Th>
              <Th>Pedidos</Th>
              <Th>Planos</Th>
              <Th>Chapas</Th>
              <Th>Encabeçamento</Th>
              <Th>Limite</Th>
              <Th>Disponível</Th>
              <Th>Situação</Th>
              <Th>Detalhes</Th>
            </tr>
          </thead>

          <tbody>
            {dados.map((dia) => {
              const disponivel = limiteChapasDia - Number(dia.chapas || 0)
              const situacao = calcularSituacaoDia(dia.chapas)

              return (
                <tr key={dia.data} className={situacao.linha}>
                  <Td className="font-bold">{formatarData(dia.data)}</Td>
                  <Td>{dia.pedidos}</Td>
                  <Td>{dia.planos || 0}</Td>
                  <Td>
                    <div className="flex justify-center">
                      <div className="bg-blue-600 text-white rounded-xl px-5 py-2 shadow-lg min-w-[70px] text-center">
                        <div className="text-2xl font-bold leading-none">
                          {formatarNumero(dia.chapas)}
                        </div>

                        <div className="text-[10px] uppercase tracking-wide opacity-90">
                          chapas
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td className="font-semibold text-purple-700">
                    {formatarNumero(dia.metrosEncabecamento || 0, 2)} m
                  </Td>
                  <Td>{limiteChapasDia}</Td>
                  <Td
                    className={
                      disponivel < 0
                        ? "font-bold text-red-700"
                        : "font-bold text-green-700"
                    }
                  >
                    {disponivel}
                  </Td>
                  <Td>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${situacao.classe}`}
                    >
                      {situacao.texto}
                    </span>
                  </Td>
                  <Td>
                    <div className="space-y-2">
                      {dia.itens.map((pedido) => (
                        <div
                          key={pedido.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="flex flex-wrap gap-3 items-center">
                            <Link
                              to={`/pedidos/${pedido.id}`}
                              className="font-bold text-blue-700 hover:underline"
                            >
                              Pedido {pedido.numeroPedidoFormatado}
                            </Link>

                            <span>{pedido.cliente?.nome || "-"}</span>

                            <span className="text-gray-500">
                              Vendedor: {pedido.vendedor?.nome || "-"}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${situacaoProducaoClasse(pedido.status)}`}
                            >
                              {situacaoProducaoTexto(pedido.status)}
                            </span>

                            <strong>
                              {formatarNumero(pedido.totalChapas)} chapa(s)
                            </strong>

                            {pedido.metrosEncabecamento > 0 && (
                              <span className="inline-flex items-center gap-1 text-purple-700 font-semibold">
                                <Ruler size={15} />
                                {formatarNumero(pedido.metrosEncabecamento, 2)} m
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Td>
                </tr>
              )
            })}

            {dados.length === 0 && (
              <tr>
                <Td colSpan="9">
                  Nenhuma programação encontrada.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Página {paginacao.page} de {paginacao.totalPages} — Total: {paginacao.total} dia(s)
          </p>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>

            <Button
              variant="secondary"
              disabled={page >= paginacao.totalPages}
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

function Card({ titulo, valor, icon: Icon, decimal = false }) {
  const numero = Number(valor || 0)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{titulo}</p>

          <strong className="text-3xl font-bold text-gray-800">
            {numero.toLocaleString("pt-BR", {
              minimumFractionDigits: decimal ? 1 : 0,
              maximumFractionDigits: decimal ? 1 : 0
            })}
          </strong>
        </div>

        {Icon && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl">
            <Icon size={26} />
          </div>
        )}
      </div>
    </div>
  )
}