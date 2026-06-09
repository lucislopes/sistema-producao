import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { Table, Th } from "../components/ui/Table"

export function Dashboard() {
  const [dados, setDados] = useState(null)
  const [baseData, setBaseData] = useState("entrega")

  const hoje = new Date()

  const primeiroDiaMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    1
  )
    .toISOString()
    .substring(0, 10)

  const hojeFormatado = new Date()
    .toISOString()
    .substring(0, 10)

  const [dataInicio, setDataInicio] = useState(primeiroDiaMes)
  const [dataFim, setDataFim] = useState(hojeFormatado)

  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null)

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
        fim.setDate(hoje.getDate() + 7)
      } else {
        inicio.setDate(hoje.getDate() - 7)
        fim = new Date(hoje)
      }
    }

    if (tipo === "15dias") {
      if (baseData === "entrega") {
        inicio = new Date(hoje)
        fim.setDate(hoje.getDate() + 15)
      } else {
        inicio.setDate(hoje.getDate() - 15)
        fim = new Date(hoje)
      }
    }

    if (tipo === "30dias") {
      if (baseData === "entrega") {
        inicio = new Date(hoje)
        fim.setDate(hoje.getDate() + 30)
      } else {
        inicio.setDate(hoje.getDate() - 30)
        fim = new Date(hoje)
      }
    }

    if (tipo === "mes") {
      inicio = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
      )

      fim = new Date(hoje)
    }

    if (tipo === "ano") {
      inicio = new Date(
        hoje.getFullYear(),
        0,
        1
      )

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

      setDados(response.data)
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

  const totalPedidos =
    dados.pedidos.abertos +
    dados.pedidos.emSeparacao +
    dados.pedidos.emProducao +
    dados.pedidos.concluidos +
    dados.pedidos.prontoEntrega +
    dados.pedidos.saiuEntrega +
    dados.pedidos.entregues

  const totalServicos =
    dados.servicos.abertos +
    dados.servicos.iniciados +
    dados.servicos.concluidos

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-md border p-4 mb-6">
        <p className="text-sm text-gray-500 mb-3">
          Indicadores filtrados por:{" "}
          <strong>
            {baseData === "entrega"
              ? "Data prevista de entrega"
              : "Data do pedido"}
          </strong>
        </p>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="border p-3 rounded-lg"
            value={baseData}
            onChange={(e) => setBaseData(e.target.value)}
          >
            <option value="entrega">Data prevista de entrega</option>
            <option value="pedido">Data do pedido</option>
          </select>

          <input
            type="date"
            className="border p-3 rounded-lg"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            type="date"
            className="border p-3 rounded-lg"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <button
            type="button"
            onClick={() => aplicarPeriodo("hoje")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            Hoje
          </button>

          <button
            type="button"
            onClick={() => aplicarPeriodo("semana")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            {baseData === "entrega" ? "Próx. 7 dias" : "Últimos 7 dias"}
          </button>

          <button
            type="button"
            onClick={() => aplicarPeriodo("15dias")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            {baseData === "entrega" ? "Próx. 15 dias" : "Últimos 15 dias"}
          </button>

          <button
            type="button"
            onClick={() => aplicarPeriodo("30dias")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            {baseData === "entrega" ? "Próx. 30 dias" : "Últimos 30 dias"}
          </button>

          <button
            type="button"
            onClick={() => aplicarPeriodo("mes")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            Mês atual
          </button>

          <button
            type="button"
            onClick={() => aplicarPeriodo("ano")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            Ano atual
          </button>
          {ultimaAtualizacao && (
            <p className="text-sm text-gray-500 ml-auto">
              Atualizado às{" "}
              {ultimaAtualizacao.toLocaleTimeString("pt-BR")}
            </p>
          )}
          
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Pedidos</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        <Card titulo="Abertos" valor={dados.pedidos.abertos} link="/pedidos" />

        <Card
          titulo="Em Separação"
          valor={dados.pedidos.emSeparacao}
          tipo={dados.pedidos.emSeparacao > 0 ? "alerta" : "normal"}
          link="/alertas"
        />

        <Card
          titulo="Em Produção"
          valor={dados.pedidos.emProducao}
          link="/pedidos"
        />

        <Card
          titulo="Concluídos"
          valor={dados.pedidos.concluidos}
          link="/expedicao"
        />

        <Card
          titulo="Pronto Entrega"
          valor={dados.pedidos.prontoEntrega}
          tipo={dados.pedidos.prontoEntrega > 0 ? "info" : "normal"}
          link="/expedicao"
        />

        <Card
          titulo="Saiu Entrega"
          valor={dados.pedidos.saiuEntrega}
          link="/expedicao"
        />

        <Card
          titulo="Entregues"
          valor={dados.pedidos.entregues}
          link="/relatorio-expedicao"
        />

        <Card
          titulo="Atrasados"
          valor={dados.pedidos.atrasados}
          tipo={dados.pedidos.atrasados > 0 ? "perigo" : "normal"}
          link="/alertas"
        />
      </div>

      <h2 className="text-xl font-bold mb-4">Serviços</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card titulo="Abertos" valor={dados.servicos.abertos} link="/kanban" />

        <Card
          titulo="Em Produção"
          valor={dados.servicos.iniciados}
          link="/kanban"
        />

        <Card
          titulo="Concluídos"
          valor={dados.servicos.concluidos}
          link="/relatorio-producao"
        />
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">SLA Entregas</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card
          titulo="Dentro Prazo"
          valor={dados.sla.dentroPrazo}
          link="/relatorio-expedicao"
        />

        <Card
          titulo="Fora Prazo"
          valor={dados.sla.foraPrazo}
          tipo={dados.sla.foraPrazo > 0 ? "perigo" : "normal"}
          link="/alertas"
        />

        <Card
          titulo="Total SLA"
          valor={dados.sla.total}
          link="/relatorio-expedicao"
        />

        <Card
          titulo="% SLA"
          valor={`${dados.sla.percentual}%`}
          tipo={dados.sla.percentual < 90 ? "perigo" : "sucesso"}
          link="/relatorio-expedicao"
        />
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Resumo Financeiro</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Card
          titulo="Aberto"
          valor={formatarMoeda(dados.financeiro.aberto)}
          link="/relatorio-pedidos"
        />

        <Card
          titulo="Produção"
          valor={formatarMoeda(dados.financeiro.producao)}
          link="/relatorio-pedidos"
        />

        <Card
          titulo="Concluído"
          valor={formatarMoeda(dados.financeiro.concluido)}
          link="/relatorio-pedidos"
        />

        <Card
          titulo="Entregue"
          valor={formatarMoeda(dados.financeiro.entregue)}
          link="/relatorio-pedidos"
        />

        <Card
          titulo="Total"
          valor={formatarMoeda(dados.financeiro.total)}
          tipo="info"
          link="/relatorio-pedidos"
        />

        <Card
          titulo="Ticket Médio"
          valor={formatarMoeda(dados.financeiro.ticketMedio)}
          tipo="sucesso"
          link="/relatorio-pedidos"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <BarraResumo
          titulo="Distribuição de Pedidos"
          total={totalPedidos}
          itens={[
            { nome: "Abertos", valor: dados.pedidos.abertos },
            { nome: "Em Separação", valor: dados.pedidos.emSeparacao },
            { nome: "Produção", valor: dados.pedidos.emProducao },
            { nome: "Concluídos", valor: dados.pedidos.concluidos },
            { nome: "Pronto Entrega", valor: dados.pedidos.prontoEntrega },
            { nome: "Saiu Entrega", valor: dados.pedidos.saiuEntrega },
            { nome: "Entregues", valor: dados.pedidos.entregues }
          ]}
        />

        <BarraResumo
          titulo="Distribuição de Serviços"
          total={totalServicos}
          itens={[
            { nome: "Abertos", valor: dados.servicos.abertos },
            { nome: "Em Produção", valor: dados.servicos.iniciados },
            { nome: "Concluídos", valor: dados.servicos.concluidos }
          ]}
        />
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Ranking Operadores</h2>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
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
  )
}

function Card({ titulo, valor, tipo, link }) {
  const classes = {
    normal: "bg-white border-gray-200",
    perigo: "bg-red-50 border-red-500",
    alerta: "bg-yellow-50 border-yellow-500",
    sucesso: "bg-green-50 border-green-500",
    info: "bg-blue-50 border-blue-500"
  }

  const conteudo = (
    <>
      <p className="text-sm text-gray-600 truncate">{titulo}</p>
      <strong className="text-2xl font-bold block mt-1">{valor}</strong>
    </>
  )

  if (link) {
    return (
      <Link
        to={link}
        className={`
          rounded-xl shadow-sm border p-4 block
          hover:scale-[1.02] transition
          ${classes[tipo || "normal"]}
        `}
      >
        {conteudo}
      </Link>
    )
  }

  return (
    <div
      className={`
        rounded-xl shadow-sm border p-4
        ${classes[tipo || "normal"]}
      `}
    >
      {conteudo}
    </div>
  )
}

function BarraResumo({ titulo, total, itens }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border p-5">
      <h3 className="font-bold mb-4">{titulo}</h3>

      <div className="flex flex-col gap-3">
        {itens.map((item) => {
          const percentual =
            total > 0
              ? Math.round((item.valor / total) * 100)
              : 0

          return (
            <div key={item.nome}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.nome}</span>
                <span>
                  {item.valor} ({percentual}%)
                </span>
              </div>

              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{
                    width: `${percentual}%`
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}