import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"

export function Alertas() {
  const [alertas, setAlertas] = useState(null)

  async function carregarAlertas() {
    try {
      const response = await api.get("/alertas")
      setAlertas(response.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar alertas")
    }
  }

  useEffect(() => {
    carregarAlertas()

    const interval = setInterval(() => {
      carregarAlertas()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleDateString("pt-BR")
  }

  if (!alertas) {
    return <div>Carregando...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Alertas Operacionais
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        <ResumoCard
          titulo="Pedidos Atrasados"
          valor={alertas.pedidosAtrasados.length}
          tipo={alertas.pedidosAtrasados.length > 0 ? "perigo" : "normal"}
        />

        <ResumoCard
          titulo="Serviços Pausados"
          valor={alertas.servicosPausados.length}
          tipo={alertas.servicosPausados.length > 0 ? "alerta" : "normal"}
        />

        <ResumoCard
          titulo="Sem Operador"
          valor={alertas.servicosSemOperador.length}
          tipo={alertas.servicosSemOperador.length > 0 ? "info" : "normal"}
        />

        <ResumoCard
          titulo="Aguardando Externo"
          valor={alertas.pedidosAguardandoExterno.length}
          tipo={alertas.pedidosAguardandoExterno.length > 0 ? "alerta" : "normal"}
        />

        <ResumoCard
          titulo="Pronto Entrega"
          valor={alertas.pedidosProntoEntrega.length}
          tipo={alertas.pedidosProntoEntrega.length > 0 ? "info" : "normal"}
        />
      </div>

      <SecaoPedidos
        titulo="Pedidos Atrasados"
        pedidos={alertas.pedidosAtrasados}
        formatarData={formatarData}
      />

      <SecaoServicos
        titulo="Serviços Pausados"
        servicos={alertas.servicosPausados}
      />

      <SecaoServicos
        titulo="Serviços Sem Operador"
        servicos={alertas.servicosSemOperador}
      />

      <SecaoPedidos
        titulo="Pedidos Aguardando Externo"
        pedidos={alertas.pedidosAguardandoExterno}
        formatarData={formatarData}
      />

      <SecaoPedidos
        titulo="Pedidos Prontos para Entrega"
        pedidos={alertas.pedidosProntoEntrega}
        formatarData={formatarData}
      />
    </div>
  )
}

function ResumoCard({ titulo, valor, tipo }) {
  const classes = {
    normal: "bg-white border-gray-200",
    perigo: "bg-red-50 border-red-500",
    alerta: "bg-yellow-50 border-yellow-500",
    info: "bg-blue-50 border-blue-500"
  }

  return (
    <div
      className={`
        rounded-xl shadow-sm border p-4
        ${classes[tipo || "normal"]}
      `}
    >
      <p className="text-sm text-gray-600">
        {titulo}
      </p>

      <strong className="text-2xl font-bold">
        {valor}
      </strong>
    </div>
  )
}

function SecaoPedidos({ titulo, pedidos, formatarData }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">
        {titulo}
      </h2>

      <table className="w-full border text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="text-left p-3 border">Pedido</th>
            <th className="text-left p-3 border">Cliente</th>
            <th className="text-left p-3 border">Entrega</th>
            <th className="text-left p-3 border">Rota</th>
            <th className="text-left p-3 border">Status</th>
            <th className="text-left p-3 border">Ação</th>
          </tr>
        </thead>

        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id}>
              <td className="p-3 border font-bold">
                #{pedido.numeroPedido}
              </td>

              <td className="p-3 border">
                {pedido.cliente?.nome}
              </td>

              <td className="p-3 border">
                {formatarData(pedido.dataEntrega)}
              </td>

              <td className="p-3 border">
                {pedido.rota?.nome || "-"}
              </td>

              <td className="p-3 border">
                {pedido.status}
              </td>

              <td className="p-3 border">
                <Link
                  to={`/pedidos/${pedido.id}`}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}

          {pedidos.length === 0 && (
            <tr>
              <td className="p-4 border" colSpan="6">
                Nenhum item encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function SecaoServicos({ titulo, servicos }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">
        {titulo}
      </h2>

      <table className="w-full border text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="text-left p-3 border">Pedido</th>
            <th className="text-left p-3 border">Cliente</th>
            <th className="text-left p-3 border">Plano</th>
            <th className="text-left p-3 border">Serviço</th>
            <th className="text-left p-3 border">Operador</th>
            <th className="text-left p-3 border">Status</th>
            <th className="text-left p-3 border">Ação</th>
          </tr>
        </thead>

        <tbody>
          {servicos.map((servico) => (
            <tr key={servico.id}>
              <td className="p-3 border font-bold">
                #{servico.plano?.pedido?.numeroPedido}
              </td>

              <td className="p-3 border">
                {servico.plano?.pedido?.cliente?.nome}
              </td>

              <td className="p-3 border">
                {servico.plano?.numeroPlano}
              </td>

              <td className="p-3 border">
                {servico.tipoServico?.nome}
              </td>

              <td className="p-3 border">
                {servico.operador?.nome || "-"}
              </td>

              <td className="p-3 border">
                {servico.status}
              </td>

              <td className="p-3 border">
                <Link
                  to={`/pedidos/${servico.plano?.pedido?.id}`}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}

          {servicos.length === 0 && (
            <tr>
              <td className="p-4 border" colSpan="7">
                Nenhum item encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}