import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  Factory,
  PlayCircle,
  CheckCircle,
  ClipboardList
} from "lucide-react"

import { api } from "../../services/api"
import { Table, Th } from "../../components/ui/Table"
import { CardIndicador } from "./components/CardIndicador"
import { DashboardFiltro } from "./components/DashboardFiltro"
import { BarraResumo } from "./components/BarraResumo"
import { SecaoDashboard } from "./components/SecaoDashboard"

export function DashboardProducao() {
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
      alert("Erro ao carregar dashboard de produção")
    }
  }

  useEffect(() => {
    carregarDashboard()
    const interval = setInterval(carregarDashboard, 60000)
    return () => clearInterval(interval)
  }, [dataInicio, dataFim, baseData])

  if (!dados) return <div>Carregando...</div>

  const totalServicos =
    dados.servicos.abertos +
    dados.servicos.iniciados +
    dados.servicos.concluidos

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

      <SecaoDashboard titulo="Indicadores da Produção">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CardIndicador
            titulo="Serviços Abertos"
            valor={dados.servicos.abertos}
            icon={ClipboardList}
            link="/kanban"
          />

          <CardIndicador
            titulo="Em Produção"
            valor={dados.servicos.iniciados}
            tipo={dados.servicos.iniciados > 0 ? "info" : "normal"}
            icon={PlayCircle}
            link="/kanban"
          />

          <CardIndicador
            titulo="Concluídos"
            valor={dados.servicos.concluidos}
            tipo="sucesso"
            icon={CheckCircle}
            link="/relatorio-producao"
          />

          <CardIndicador
            titulo="Pedidos em Produção"
            valor={dados.pedidos.emProducao}
            icon={Factory}
            link="/pedidos"
          />
        </div>
      </SecaoDashboard>

      <SecaoDashboard titulo="Distribuição dos Serviços">
        <BarraResumo
          titulo="Serviços por status"
          total={totalServicos}
          itens={[
            { nome: "Abertos", valor: dados.servicos.abertos },
            { nome: "Em Produção", valor: dados.servicos.iniciados },
            { nome: "Concluídos", valor: dados.servicos.concluidos }
          ]}
        />
      </SecaoDashboard>

      <SecaoDashboard titulo="Ranking dos Operadores">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="p-5">
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <Table>
            <thead>
              <tr>
                <Th>Posição</Th>
                <Th>Operador</Th>
                <Th>Serviços Concluídos</Th>
              </tr>
            </thead>

            <tbody>
              {dados.leaderboard?.map((item, index) => (
                <tr key={item.nome} className="border-t">
                  <td className="p-4">
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : `${index + 1}º`}
                  </td>

                  <td className="p-4">{item.nome}</td>
                  <td className="p-4 font-bold">{item.total}</td>
                </tr>
              ))}

              {dados.leaderboard?.length === 0 && (
                <tr>
                  <td className="p-4" colSpan="3">
                    Nenhum serviço concluído ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          </div>
        </div>
      </div>
      </SecaoDashboard>
    </div>
  )
}