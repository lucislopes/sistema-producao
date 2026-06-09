import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  FileText,
  Factory,
  CheckCircle,
  PackageCheck,
  DollarSign,
  Receipt
} from "lucide-react"

import { api } from "../../services/api"
import { CardIndicador } from "./components/CardIndicador"
import { DashboardFiltro } from "./components/DashboardFiltro"
import { SecaoDashboard } from "./components/SecaoDashboard"

export function DashboardComercial() {
  const [dados, setDados] = useState(null)
  const [baseData, setBaseData] = useState("pedido")
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)

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

    if (tipo === "semana") inicio.setDate(hoje.getDate() - 7)
    if (tipo === "15dias") inicio.setDate(hoje.getDate() - 15)
    if (tipo === "30dias") inicio.setDate(hoje.getDate() - 30)

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
    try {
      const response = await api.get("/dashboard", {
        params: { dataInicio, dataFim, baseData }
      })

      setDados(response.data)
      setUltimaAtualizacao(new Date())
    } catch (error) {
      console.log(error)
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

  if (!dados) return <div>Carregando...</div>

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

      <SecaoDashboard titulo="Resumo Comercial">
        <div className="bg-white rounded-2xl shadow-md border p-5">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span>Pedidos abertos</span>
              <strong>{dados.pedidos.abertos}</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Pedidos em produção</span>
              <strong>{dados.pedidos.emProducao}</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Pedidos entregues</span>
              <strong>{dados.pedidos.entregues}</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Ticket médio no período</span>
              <strong>{formatarMoeda(dados.financeiro.ticketMedio)}</strong>
            </div>
          </div>
        </div>
      </SecaoDashboard>
    </div>
  )
}