import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"

export function Dashboard() {
  const [dados, setDados] = useState(null)

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

  function aplicarPeriodo(tipo) {
    const hoje = new Date()
    const fim = hoje.toISOString().substring(0, 10)

    let inicio = new Date()

    if (tipo === "hoje") {
      inicio = hoje
    }

    if (tipo === "semana") {
      inicio.setDate(hoje.getDate() - 7)
    }

    if (tipo === "mes") {
      inicio = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
      )
    }

    if (tipo === "trimestre") {
      inicio.setMonth(hoje.getMonth() - 3)
    }

    if (tipo === "semestre") {
      inicio.setMonth(hoje.getMonth() - 6)
    }

    if (tipo === "ano") {
      inicio = new Date(
        hoje.getFullYear(),
        0,
        1
      )
    }

    setDataInicio(inicio.toISOString().substring(0, 10))
    setDataFim(fim)
  }

  async function carregarDashboard() {
    try {
      const response = await api.get("/dashboard", {
        params: {
          dataInicio,
          dataFim
        }
      })

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
    }, 30000)

    return () => clearInterval(interval)
  }, [dataInicio, dataFim])

  if (!dados) {
    return <div>Carregando...</div>
  }

  const totalPedidos =
    dados.pedidos.abertos +
    dados.pedidos.emProducao +
    dados.pedidos.concluidos +
    dados.pedidos.prontoEntrega +
    dados.pedidos.saiuEntrega +
    dados.pedidos.entregues

  const totalServicos =
    dados.servicos.abertos +
    dados.servicos.iniciados +
    dados.servicos.pausados +
    dados.servicos.concluidos

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <div className="bg-white rounded-2xl shadow-md border p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
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
            onClick={() => aplicarPeriodo("hoje")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            Hoje
          </button>

          <button
            onClick={() => aplicarPeriodo("semana")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            7 Dias
          </button>

          <button
            onClick={() => aplicarPeriodo("mes")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            Mês
          </button>

          <button
            onClick={() => aplicarPeriodo("trimestre")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            Tri
          </button>

          <button
            onClick={() => aplicarPeriodo("semestre")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            Sem
          </button>

          <button
            onClick={() => aplicarPeriodo("ano")}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg"
          >
            Ano
          </button>

          <button
            onClick={carregarDashboard}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg ml-auto"
          >
            Atualizar
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">
        Pedidos
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        <Card
          titulo="Abertos"
          valor={dados.pedidos.abertos}
          link="/pedidos"
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

      <h2 className="text-xl font-bold mb-4">
        Serviços
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card
          titulo="Abertos"
          valor={dados.servicos.abertos}
          link="/kanban"
        />

        <Card
          titulo="Iniciados"
          valor={dados.servicos.iniciados}
          link="/kanban"
        />

        <Card
          titulo="Pausados"
          valor={dados.servicos.pausados}
          tipo={dados.servicos.pausados > 0 ? "alerta" : "normal"}
          link="/alertas"
        />

        <Card
          titulo="Concluídos"
          valor={dados.servicos.concluidos}
          link="/relatorio-producao"
        />
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">
        SLA Entregas
      </h2>

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

      <h2 className="text-xl font-bold mt-8 mb-4">
        Resumo Financeiro
      </h2>

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
            { nome: "Iniciados", valor: dados.servicos.iniciados },
            { nome: "Pausados", valor: dados.servicos.pausados },
            { nome: "Concluídos", valor: dados.servicos.concluidos }
          ]}
        />
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">
        Ranking Operadores
      </h2>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-left p-4">Posição</th>
              <th className="text-left p-4">Operador</th>
              <th className="text-left p-4">Serviços Concluídos</th>
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

                <td className="p-4">
                  {item.nome}
                </td>

                <td className="p-4 font-bold">
                  {item.total}
                </td>
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
        </table>
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
      <p className="text-sm text-gray-600 truncate">
        {titulo}
      </p>

      <strong className="text-2xl font-bold block mt-1">
        {valor}
      </strong>
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
      <h3 className="font-bold mb-4">
        {titulo}
      </h3>

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
                <span>{item.valor} ({percentual}%)</span>
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