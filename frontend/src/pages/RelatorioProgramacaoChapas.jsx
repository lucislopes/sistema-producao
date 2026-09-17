import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { EmptyState, ErrorState, LoadingState } from "../components/ui/FeedbackState"

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
  const [vendedores, setVendedores] = useState([])

  const [dataFim, setDataFim] = useState("")
  const [vendedorId, setVendedorId] = useState("")
  const [cliente, setCliente] = useState("")
  const [limiteChapasDia, setLimiteChapasDia] = useState(null)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

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
    if (limiteChapasDia == null) return { texto: "Sem limite", classe: "bg-gray-100 text-gray-700", linha: "" }
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
    setCarregando(true)
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

      setLimiteChapasDia(response.data.limiteChapasDia ?? null)
      setDados(response.data.dados || [])
      setResumo(response.data.resumo || null)
      setPaginacao(
        response.data.paginacao || {
          total: 0,
          page: 1,
          limit,
          totalPages: 1
        }
      )
      setErro(false)
    } catch (error) {
      console.log(error)
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarVendedores()
  }, [])

  useEffect(() => {
    carregarRelatorio(page)
    // A paginação reaplica os filtros selecionados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const disponivel = limiteChapasDia == null ? "Sem limite" : limiteChapasDia - Number(dia.chapas || 0)
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
      PRONTO_ENTREGA: "Pronto para expedição",
      SAIU_ENTREGA: "Saiu para entrega",
      ENTREGUE: "Entregue"
    }

    return mapa[status] || status || "-"
  }

  function situacaoProducaoClasse(status) {
    const mapa = {
      ABERTO: "bg-gray-100 text-gray-700 border-gray-300",
      EM_SEPARACAO: "bg-orange-100 text-orange-700 border-orange-300",
      EM_PRODUCAO: "bg-yellow-100 text-yellow-800 border-yellow-300",
      CONCLUIDO: "bg-green-100 text-green-700 border-green-300",
      PRONTO_ENTREGA: "bg-blue-100 text-blue-700 border-blue-300",
      SAIU_ENTREGA: "bg-purple-100 text-purple-700 border-purple-300",
      ENTREGUE: "bg-emerald-100 text-emerald-700 border-emerald-300"
    }

    return mapa[status] || "bg-gray-100 text-gray-700 border-gray-300"
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-blue-950">Programação de chapas</h1>
          <p className="mt-1 text-sm text-blue-800">
            Programação futura por data de entrega, começando de hoje em diante.
          </p>
        </div>

        <Button
          type="button"
          onClick={exportarCSV}
          variant="success"
          disabled={!dados.length}
        >
          <Download size={18} />
          Exportar página em CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Card titulo="Chapas Programadas" valor={resumo?.totalChapas || 0} icon={Package} />
        <Card titulo="Pedidos" valor={resumo?.totalPedidos || 0} icon={ClipboardList} />
        <Card titulo="Planos" valor={resumo?.totalPlanos || 0} icon={ClipboardList} />
        <Card titulo="Metros" valor={resumo?.totalMetrosEncabecamento || 0} icon={Ruler} decimal />
        <Card titulo="Dias Programados" valor={resumo?.diasProgramados || 0} icon={CalendarDays} />
        <Card titulo="Média/Dia" valor={resumo?.mediaDia || 0} icon={TrendingUp} decimal />
        <Card titulo="Limite Atual" valor={limiteChapasDia ?? "Desativado"} icon={TriangleAlert} />
      </div>

      <form onSubmit={(event) => { event.preventDefault(); buscar() }} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4">
          <Input
            aria-label="Programar até"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            placeholder="Até"
          />

          <Input
            aria-label="Cliente"
            type="text"
            placeholder="Cliente..."
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />

          <Select
            aria-label="Vendedor"
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

          <div className="text-sm text-gray-700 rounded-lg border p-3">
            Limite de chapas/dia: <strong>{limiteChapasDia ?? "Desativado"}</strong>
            <p className="text-xs text-gray-500">Editado pelo administrador em Configurações.</p>
          </div>

          <Select
            aria-label="Dias por página"
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
            type="submit"
            loading={carregando}
          >
            <Search size={18} />
            Buscar
          </Button>

          <Button
            type="button"
            variant="dangerSoft"
            onClick={limparFiltros}
          >
            <Eraser size={18} />
            Limpar
          </Button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          O período sempre começa em hoje. A data informada serve apenas como limite final.
        </p>
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Pedidos concluídos continuam consumindo a capacidade programada do dia; somente cancelamentos liberam o saldo.
        </p>
      </form>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">
          Programação por Dia
        </h2>

        {carregando ? (
          <LoadingState mensagem="Carregando a programação de chapas..." />
        ) : erro ? (
          <ErrorState mensagem="Não foi possível carregar a programação de chapas." onRetry={() => carregarRelatorio(page)} />
        ) : dados.length === 0 ? (
          <EmptyState titulo="Nenhuma programação encontrada" descricao="Não há produção pendente no período ou nos filtros informados." />
        ) : (
          <>
        <Table>
          <thead>
            <tr>
              <Th>Data Entrega</Th>
              <Th>Pedidos</Th>
              <Th>Planos</Th>
              <Th>Chapas</Th>
              <Th>Encabeçamento</Th>
              <Th>Limite</Th>
              <Th>Saldo</Th>
              <Th>Situação</Th>
              <Th>Detalhes</Th>
            </tr>
          </thead>

          <tbody>
            {dados.map((dia) => {
              const disponivel = limiteChapasDia == null ? "Sem limite" : limiteChapasDia - Number(dia.chapas || 0)
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
                  <Td>{limiteChapasDia ?? "Desativado"}</Td>
                  <Td
                    className={
                      disponivel < 0
                        ? "font-bold text-red-700"
                        : "font-bold text-green-700"
                    }
                  >
                    {limiteChapasDia == null ? "Sem limite" : disponivel < 0
                      ? `${Math.abs(disponivel)} acima`
                      : `${disponivel} disponível`}
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

          </tbody>
        </Table>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Página {paginacao.page} de {paginacao.totalPages} — Total: {paginacao.total} dia(s)
          </p>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((paginaAtual) => paginaAtual - 1)}
            >
              Anterior
            </Button>

            <Button
              variant="secondary"
              disabled={page >= paginacao.totalPages}
              onClick={() => setPage((paginaAtual) => paginaAtual + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
          </>
        )}
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
            {typeof valor === "string" ? valor : numero.toLocaleString("pt-BR", {
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
