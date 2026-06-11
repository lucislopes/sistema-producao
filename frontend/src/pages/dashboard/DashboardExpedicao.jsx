import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  PackageCheck,
  Truck,
  CheckCircle,
  TriangleAlert,
  Clock,
  XCircle,
  Gauge
} from "lucide-react"

import { api } from "../../services/api"
import { CardIndicador } from "./components/CardIndicador"
import { DashboardFiltro } from "./components/DashboardFiltro"
import { SecaoDashboard } from "./components/SecaoDashboard"

export function DashboardExpedicao() {
  const [dados, setDados] = useState(null)
  const [baseData, setBaseData] = useState("entrega")
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
    try {
      const response = await api.get("/dashboard", {
        params: { dataInicio, dataFim, baseData }
      })

      setDados(response.data)
      setUltimaAtualizacao(new Date())
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar dashboard de expedição")
    }
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

      <SecaoDashboard titulo="Indicadores de Expedição">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CardIndicador
            titulo="Pronto Entrega"
            valor={dados.pedidos.prontoEntrega}
            tipo={dados.pedidos.prontoEntrega > 0 ? "info" : "normal"}
            icon={PackageCheck}
            link="/expedicao"
          />

          <CardIndicador
            titulo="Saiu Entrega"
            valor={dados.pedidos.saiuEntrega}
            icon={Truck}
            link="/expedicao"
          />

          <CardIndicador
            titulo="Entregues"
            valor={dados.pedidos.entregues}
            tipo="sucesso"
            icon={CheckCircle}
            link="/relatorio-expedicao"
          />

          <CardIndicador
            titulo="Atrasados"
            valor={dados.pedidos.atrasados}
            tipo={dados.pedidos.atrasados > 0 ? "perigo" : "normal"}
            icon={TriangleAlert}
            link="/alertas"
          />
        </div>
      </SecaoDashboard>

      <SecaoDashboard titulo="SLA das Entregas">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CardIndicador
            titulo="Dentro do Prazo"
            valor={dados.sla.dentroPrazo}
            tipo="sucesso"
            icon={Clock}
            link="/relatorio-expedicao"
          />

          <CardIndicador
            titulo="Fora do Prazo"
            valor={dados.sla.foraPrazo}
            tipo={dados.sla.foraPrazo > 0 ? "perigo" : "normal"}
            icon={XCircle}
            link="/alertas"
          />

          <CardIndicador
            titulo="Total SLA"
            valor={dados.sla.total}
            icon={Gauge}
            link="/relatorio-expedicao"
          />

          <CardIndicador
            titulo="% SLA"
            valor={`${dados.sla.percentual}%`}
            tipo={dados.sla.percentual < 90 ? "perigo" : "sucesso"}
            icon={Gauge}
            link="/relatorio-expedicao"
          />
        </div>
      </SecaoDashboard>

      <SecaoDashboard titulo="Resumo Logístico">
        <div className="bg-white rounded-2xl shadow-md border p-5">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span>Pedidos aguardando expedição</span>
              <strong>{dados.pedidos.prontoEntrega}</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Pedidos em rota de entrega</span>
              <strong>{dados.pedidos.saiuEntrega}</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Pedidos entregues no período</span>
              <strong>{dados.pedidos.entregues}</strong>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span>Entregas fora do prazo</span>
              <strong>{dados.sla.foraPrazo}</strong>
            </div>
          </div>
        </div>
      </SecaoDashboard>
    </div>
  )
}