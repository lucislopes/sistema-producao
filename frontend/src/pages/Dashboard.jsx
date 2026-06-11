import { useEffect, useState } from "react"
import {
  ClipboardList,
  Factory,
  PackageCheck,
  TriangleAlert,
  DollarSign,
  Gauge,
  Hammer,
  Truck,
  ChartColumn,
  Columns3
} from "lucide-react"

import { api } from "../services/api"
import { CardIndicador } from "./dashboard/components/CardIndicador"
import { DashboardFiltro } from "./dashboard/components/DashboardFiltro"
import { SecaoDashboard } from "./dashboard/components/SecaoDashboard"

export function Dashboard() {
  const [dados, setDados] = useState(null)
  const [baseData, setBaseData] = useState("pedido")
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)
  const usuario = JSON.parse(localStorage.getItem("@usuario"))
  const isOperador = usuario?.funcao === "OPERADOR"

  function formatarDataLocal(data) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, "0")
    const dia = String(data.getDate()).padStart(2, "0")

    return `${ano}-${mes}-${dia}`
  }

  const hoje = new Date()

  const primeiroDiaMes = formatarDataLocal(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  )

  const hojeFormatado = formatarDataLocal(hoje)

  const [dataInicio, setDataInicio] = useState(primeiroDiaMes)
  const [dataFim, setDataFim] = useState(hojeFormatado)

  function formatarDataFiltro(data) {
    return formatarDataLocal(data)
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
        params: {
          dataInicio,
          dataFim,
          baseData
        }
      })

      setDados(response.data)
      setUltimaAtualizacao(new Date())
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar dashboard")
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

    const interval = setInterval(() => {
      carregarDashboard()
    }, 60000)

    return () => clearInterval(interval)
  }, [dataInicio, dataFim, baseData])

  if (!dados) {
    return <div>Carregando...</div>
  }

  return (
    <div>
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

      <SecaoDashboard titulo="Indicadores Gerais">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <CardIndicador
            titulo="Pedidos Abertos"
            valor={dados.pedidos.abertos}
            icon={ClipboardList}
            link="/pedidos"
          />

          <CardIndicador
            titulo="Em Produção"
            valor={dados.pedidos.emProducao}
            icon={Factory}
            link="/pedidos"
          />

          <CardIndicador
            titulo="Pronto Entrega"
            valor={dados.pedidos.prontoEntrega}
            tipo={dados.pedidos.prontoEntrega > 0 ? "info" : "normal"}
            icon={PackageCheck}
            link="/expedicao"
          />

          <CardIndicador
            titulo="Atrasados"
            valor={dados.pedidos.atrasados}
            tipo={dados.pedidos.atrasados > 0 ? "perigo" : "normal"}
            icon={TriangleAlert}
            link="/alertas"
          />

          {!isOperador && (
            <CardIndicador
              titulo="Faturamento"
              valor={formatarMoeda(dados.financeiro.total)}
              tipo="info"
              icon={DollarSign}
              link="/relatorio-pedidos"
            />
          )}

          <CardIndicador
            titulo="SLA"
            valor={`${dados.sla.percentual}%`}
            tipo={dados.sla.percentual < 90 ? "perigo" : "sucesso"}
            icon={Gauge}
            link="/relatorio-expedicao"
          />
        </div>
      </SecaoDashboard>

      <SecaoDashboard titulo="Acessos Rápidos">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <CardIndicador
            titulo="Produção"
            valor="Abrir"
            icon={Hammer}
            link="/dashboard/producao"
          />

          {!isOperador && (
            <CardIndicador
              titulo="Expedição"
              valor="Abrir"
              icon={Truck}
              link="/dashboard/expedicao"
            />
          )}

          {!isOperador && (
            <CardIndicador
              titulo="Comercial"
              valor="Abrir"
              icon={ChartColumn}
              link="/dashboard/comercial"
            />
          )}

          <CardIndicador
            titulo="Kanban"
            valor="Abrir"
            icon={Columns3}
            link="/kanban"
          />
        </div>
      </SecaoDashboard>
    </div>
  )
}