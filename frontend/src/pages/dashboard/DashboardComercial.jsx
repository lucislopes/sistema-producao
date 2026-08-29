import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  FileText,
  Factory,
  CheckCircle,
  PackageCheck,
  DollarSign,
  Receipt,
  ShoppingCart,
  Users,
  UserCheck
} from "lucide-react"

import { api } from "../../services/api"
import { Table, Td, Th } from "../../components/ui/Table"
import { CardIndicador } from "./components/CardIndicador"
import { DashboardFiltro } from "./components/DashboardFiltro"
import { SecaoDashboard } from "./components/SecaoDashboard"
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/FeedbackState"

export function DashboardComercial() {
  const [dados, setDados] = useState(null)
  const [baseData, setBaseData] = useState("pedido")
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)
  const [erroCarregamento, setErroCarregamento] = useState("")

  const hoje = new Date()

  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .substring(0, 10)

  const hojeFormatado = new Date().toISOString().substring(0, 10)

  const [dataInicio, setDataInicio] = useState(primeiroDiaMes)
  const [dataFim, setDataFim] = useState(hojeFormatado)

  function formatarDataFiltro(data) {
    return data.toISOString().substring(0, 10)
  }

  function aplicarPeriodo(tipo) {
  const hoje = new Date()

  let inicio = new Date(hoje)
  let fim = new Date(hoje)

  if (tipo === "hoje") {
    inicio = new Date(hoje)
    fim = new Date(hoje)
  }

  if (tipo === "semana") {
    if (baseData === "entrega") {
      inicio = new Date(hoje)
      fim = new Date(hoje)
      fim.setDate(fim.getDate() + 7)
    } else {
      inicio = new Date(hoje)
      fim = new Date(hoje)
      inicio.setDate(inicio.getDate() - 7)
    }
  }

  if (tipo === "15dias") {
    if (baseData === "entrega") {
      inicio = new Date(hoje)
      fim = new Date(hoje)
      fim.setDate(fim.getDate() + 15)
    } else {
      inicio = new Date(hoje)
      fim = new Date(hoje)
      inicio.setDate(inicio.getDate() - 15)
    }
  }

  if (tipo === "30dias") {
    if (baseData === "entrega") {
      inicio = new Date(hoje)
      fim = new Date(hoje)
      fim.setDate(fim.getDate() + 30)
    } else {
      inicio = new Date(hoje)
      fim = new Date(hoje)
      inicio.setDate(inicio.getDate() - 30)
    }
  }

  if (tipo === "mes") {
    inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    fim = new Date(hoje)
  }

  if (tipo === "ano") {
    inicio = new Date(hoje.getFullYear(), 0, 1)
    fim = new Date(hoje)
  }

  setDataInicio(formatarDataFiltro(inicio))
  setDataFim(formatarDataFiltro(fim))
}

  async function carregarDashboard() {
    setErroCarregamento("")
    try {
      const response = await api.get("/dashboard", {
        params: { dataInicio, dataFim, baseData }
      })

      setDados(response.data)
      setUltimaAtualizacao(new Date())
    } catch (error) {
      console.log(error)
      setErroCarregamento("Não foi possível carregar os indicadores comerciais.")
      alert("Erro ao carregar dashboard comercial")
    }
  }

  function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  useEffect(() => {
    carregarDashboard()
    const interval = setInterval(carregarDashboard, 60000)
    return () => clearInterval(interval)
  }, [dataInicio, dataFim, baseData])

  if (erroCarregamento && !dados) return <ErrorState descricao={erroCarregamento} onRetry={carregarDashboard} />
  if (!dados) return <LoadingState mensagem="Carregando indicadores comerciais..." />

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          <ArrowLeft size={18} />
          Voltar para Dashboard
        </Link>
      </div>

      <DashboardFiltro
        baseData={baseData}
        setBaseData={setBaseData}
        dataInicio={dataInicio}
        setDataInicio={setDataInicio}
        dataFim={dataFim}
        setDataFim={setDataFim}
        aplicarPeriodo={aplicarPeriodo}
        ultimaAtualizacao={ultimaAtualizacao}
      />

      <SecaoDashboard titulo="Indicadores Financeiros">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <CardIndicador
            titulo="Aberto"
            valor={formatarMoeda(dados.financeiro.aberto)}
            icon={FileText}
            link="/relatorio-pedidos"
          />

          <CardIndicador
            titulo="Produção"
            valor={formatarMoeda(dados.financeiro.producao)}
            icon={Factory}
            link="/relatorio-pedidos"
          />

          <CardIndicador
            titulo="Concluído"
            valor={formatarMoeda(dados.financeiro.concluido)}
            icon={CheckCircle}
            link="/relatorio-pedidos"
          />

          <CardIndicador
            titulo="Entregue"
            valor={formatarMoeda(dados.financeiro.entregue)}
            tipo="sucesso"
            icon={PackageCheck}
            link="/relatorio-pedidos"
          />

          <CardIndicador
            titulo="Total"
            valor={formatarMoeda(dados.financeiro.total)}
            tipo="info"
            icon={DollarSign}
            link="/relatorio-pedidos"
          />

          <CardIndicador
            titulo="Ticket Médio"
            valor={formatarMoeda(dados.financeiro.ticketMedio)}
            tipo="sucesso"
            icon={Receipt}
            link="/relatorio-pedidos"
          />
        </div>
      </SecaoDashboard>

      <SecaoDashboard titulo="Indicadores Comerciais">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <CardIndicador
            titulo="Pedidos no Período"
            valor={dados.comercial?.totalPedidos || 0}
            icon={ShoppingCart}
            link="/relatorio-pedidos"
          />

          <CardIndicador
            titulo="Clientes Atendidos"
            valor={dados.comercial?.clientesAtendidos || 0}
            icon={Users}
            link="/clientes"
          />

          <CardIndicador
            titulo="Vendedores Ativos"
            valor={dados.comercial?.vendedoresAtivos || 0}
            icon={UserCheck}
            link="/funcionarios"
          />
        </div>
      </SecaoDashboard>

      <SecaoDashboard titulo="Resumo Comercial">
        <div className="bg-white rounded-2xl shadow-md border p-5">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span>Pedidos abertos no período</span>
              <strong>{dados.pedidosPeriodo?.abertos || 0}</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Pedidos em produção no período</span>
              <strong>{dados.pedidosPeriodo?.emProducao || 0}</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Pedidos entregues no período</span>
              <strong>{dados.pedidosPeriodo?.entregues || 0}</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Ticket médio no período</span>
              <strong>{formatarMoeda(dados.financeiro.ticketMedio)}</strong>
            </div>
          </div>
        </div>
      </SecaoDashboard>

      <SecaoDashboard titulo="Ranking de Vendedores">
        <div className="rounded-2xl bg-white shadow-sm">
          <Table label="Ranking de vendedores">
            <thead className="bg-gray-100">
              <tr>
                <Th>#</Th>
                <Th>Vendedor</Th>
                <Th>Pedidos</Th>
                <Th>Valor Vendido</Th>
                <Th>Ticket Médio</Th>
              </tr>
            </thead>

            <tbody>
              {(dados.comercial?.rankingVendedores || []).map((item, index) => (
                <tr key={item.vendedorId} className="border-t">
                  <Td className="font-bold">
                    {index + 1}º
                  </Td>

                  <Td>
                    {item.nome}
                  </Td>

                  <Td>
                    {item.pedidos}
                  </Td>

                  <Td className="font-semibold">
                    {formatarMoeda(item.valorTotal)}
                  </Td>

                  <Td>
                    {formatarMoeda(item.ticketMedio)}
                  </Td>
                </tr>
              ))}

              {(dados.comercial?.rankingVendedores || []).length === 0 && (
                <tr>
                  <Td colSpan="5" className="p-6 text-center text-gray-500">
                    <EmptyState
                      compact
                      titulo="Nenhum vendedor encontrado no período"
                      descricao="Altere o período acima para consultar outros resultados."
                    />
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </SecaoDashboard>

      <SecaoDashboard titulo="Top Clientes">
        <div className="rounded-2xl bg-white shadow-sm">
          <Table label="Ranking de clientes">
            <thead className="bg-gray-100">
              <tr>
                <Th>#</Th>
                <Th>Cliente</Th>
                <Th>Pedidos</Th>
                <Th>Valor Total</Th>
              </tr>
            </thead>

            <tbody>
              {(dados.comercial?.rankingClientes || []).map((item, index) => (
                <tr key={item.clienteId} className="border-t">
                  <Td className="font-bold">
                    {index + 1}º
                  </Td>

                  <Td>
                    {item.nome}
                  </Td>

                  <Td>
                    {item.pedidos}
                  </Td>

                  <Td className="font-semibold">
                    {formatarMoeda(item.valorTotal)}
                  </Td>
                </tr>
              ))}

              {(dados.comercial?.rankingClientes || []).length === 0 && (
                <tr>
                  <Td colSpan="4" className="p-6 text-center text-gray-500">
                    <EmptyState
                      compact
                      titulo="Nenhum cliente encontrado no período"
                      descricao="Altere o período acima para consultar outros resultados."
                    />
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </SecaoDashboard>
    </div>
  )
}
