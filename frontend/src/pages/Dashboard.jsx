import { useEffect, useState } from "react"
import {
  ClipboardList,
  Factory,
  PackageCheck,
  TriangleAlert,
  Hammer,
  Truck,
  ChartColumn,
  Columns3,
  Boxes,
  LockKeyhole
} from "lucide-react"

import { api } from "../services/api"
import { CardIndicador } from "./dashboard/components/CardIndicador"
import { SecaoDashboard } from "./dashboard/components/SecaoDashboard"

function CardRestrito({ titulo, descricao, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm opacity-80">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {titulo}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {descricao}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3 text-gray-400">
          {Icon ? <Icon size={22} /> : <LockKeyhole size={22} />}
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [dados, setDados] = useState(null)
  const [baseData, setBaseData] = useState("pedido")
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)

  const usuario = JSON.parse(localStorage.getItem("@usuario") || "{}")

  const isAdmin = usuario?.funcao === "ADMIN"
  const isOperador = usuario?.funcao === "OPERADOR"
  const isVendedor = usuario?.funcao === "VENDEDOR"
  const isVendedorOperador = usuario?.funcao === "VENDEDOR_OPERADOR"

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Operação em Tempo Real
        </h2>

        <span className="text-sm text-gray-500">
          🔄 Atualizado às {ultimaAtualizacao?.toLocaleTimeString("pt-BR")}
        </span>
      </div>

      <SecaoDashboard titulo="Situação Atual">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <CardIndicador
            titulo="Pedidos Abertos"
            valor={dados.pedidos.abertos}
            tipo={dados.pedidos.abertos > 0 ? "info" : "normal"}
            icon={ClipboardList}
            link={isOperador ? "/kanban" : "/pedidos"}
          />

          <CardIndicador
            titulo="Separação p/ Prod."
            valor={dados.pedidos.emSeparacao}
            tipo={dados.pedidos.emSeparacao > 0 ? "info" : "normal"}
            icon={Boxes}
            link="/kanban"
          />

          <CardIndicador
            titulo="Em Produção"
            valor={dados.pedidos.emProducao}
            tipo={dados.pedidos.emProducao > 0 ? "info" : "normal"}
            icon={Factory}
            link="/kanban"
          />

          <CardIndicador
            titulo="Pronto Entrega"
            valor={dados.pedidos.prontoEntrega}
            tipo={dados.pedidos.prontoEntrega > 0 ? "info" : "normal"}
            icon={PackageCheck}
            link={isOperador ? "/kanban" : "/expedicao"}
          />

          <CardIndicador
            titulo="Atrasados"
            valor={dados.pedidos.atrasados}
            tipo={dados.pedidos.atrasados > 0 ? "perigo" : "sucesso"}
            icon={TriangleAlert}
            link="/alertas"
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

          <CardIndicador
            titulo="Expedição"
            valor="Abrir"
            icon={Truck}
            link="/dashboard/expedicao"
          />

          {isAdmin ? (
            <CardIndicador
              titulo="Comercial"
              valor="Abrir"
              icon={ChartColumn}
              link="/dashboard/comercial"
            />
          ) : (
            <CardRestrito
              titulo="Comercial"
              descricao="Indicadores comerciais disponíveis apenas para administradores."
              icon={ChartColumn}
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