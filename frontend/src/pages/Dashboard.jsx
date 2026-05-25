import { useEffect, useState } from "react"
import { api } from "../services/api"

export function Dashboard() {
  const [dados, setDados] = useState(null)

  async function carregarDashboard() {
    try {
      const response = await api.get("/dashboard")
      setDados(response.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar dashboard")
    }
  }

  useEffect(() => {
    carregarDashboard()
    const interval = setInterval(() => {
      carregarDashboard()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!dados) {
    return <div>Carregando...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Dashboard
      </h1>

      <h2 className="text-xl font-bold mb-4">
        Pedidos
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        <Card titulo="Abertos" valor={dados.pedidos.abertos} />
        <Card titulo="Em Produção" valor={dados.pedidos.emProducao} />
        <Card titulo="Concluídos" valor={dados.pedidos.concluidos} />
        <Card
          titulo="Pronto Entrega"
          valor={dados.pedidos.prontoEntrega}
          tipo={dados.pedidos.prontoEntrega > 0 ? "info" : "normal"}
        />
        <Card titulo="Saiu Entrega" valor={dados.pedidos.saiuEntrega} />
        <Card titulo="Entregues" valor={dados.pedidos.entregues} />
        
        <Card
          titulo="Atrasados"
          valor={dados.pedidos.atrasados}
          tipo={dados.pedidos.atrasados > 0 ? "perigo" : "normal"}
        />
      </div>

      <h2 className="text-xl font-bold mb-4">
        Serviços
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card titulo="Abertos" valor={dados.servicos.abertos} />
        <Card titulo="Iniciados" valor={dados.servicos.iniciados} />
        <Card
          titulo="Pausados"
          valor={dados.servicos.pausados}
          tipo={dados.servicos.pausados > 0 ? "alerta" : "normal"}
        />
        <Card titulo="Concluídos" valor={dados.servicos.concluidos} />
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">
      SLA Entregas
    </h2>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <Card
        titulo="Dentro Prazo"
        valor={dados.sla.dentroPrazo}
      />

      <Card
        titulo="Fora Prazo"
        valor={dados.sla.foraPrazo}
        tipo={dados.sla.foraPrazo > 0 ? "perigo" : "normal"}
      />

      <Card
        titulo="Total SLA"
        valor={dados.sla.total}
      />

      <Card
        titulo="% SLA"
        valor={`${dados.sla.percentual}%`}
        tipo={dados.sla.percentual < 90 ? "perigo" : "sucesso"}
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
                  {index + 1}º
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

function Card({ titulo, valor, tipo }) {
  const classes = {
    normal: "bg-white border-gray-200",
    perigo: "bg-red-50 border-red-500",
    alerta: "bg-yellow-50 border-yellow-500",
    sucesso: "bg-green-50 border-green-500",
    info: "bg-blue-50 border-blue-500"
  }

  return (
    <div
      className={`
        rounded-xl shadow-sm border p-4
        ${classes[tipo || "normal"]}
      `}
    >
      <p className="text-sm text-gray-600 truncate">
        {titulo}
      </p>

      <strong className="text-2xl font-bold block mt-1">
        {valor}
      </strong>
    </div>
  )
}