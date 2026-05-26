import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import { Table, Th, Td } from "../components/ui/Table"

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

      <strong className="text-xl font-bold">
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

      <Table>
        <thead>
          <tr>
            <Th >Pedido</Th>
            <Th >Cliente</Th>
            <Th >Entrega</Th>
            <Th >Rota</Th>
            <Th >Status</Th>
            <Th >Ação</Th>
          </tr>
        </thead>

        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id}>
              <Td>
                #{pedido.numeroPedido}
              </Td>

              <Td >
                {pedido.cliente?.nome}
              </Td>

              <Td >
                {formatarData(pedido.dataEntrega)}
              </Td>

              <Td >
                {pedido.rota?.nome || "-"}
              </Td>

              <Td >
                <BadgeStatus status={pedido.status} />
              </Td>

              <Td >
                <Link
                  to={`/pedidos/${pedido.id}`}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Ver
                </Link>
              </Td>
            </tr>
          ))}

          {pedidos.length === 0 && (
            <tr>
              <Td colSpan="7">
                Nenhum item encontrado.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  )
}

function SecaoServicos({ titulo, servicos }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">
        {titulo}
      </h2>

      <Table>
        <thead>
          <tr>
            <Th >Pedido</Th>
            <Th >Cliente</Th>
            <Th >Plano</Th>
            <Th >Serviço</Th>
            <Th >Operador</Th>
            <Th >Status</Th>
            <Th >Ação</Th>
          </tr>
        </thead>

        <tbody>
          {servicos.map((servico) => (
            <tr key={servico.id}>
              <Td >
                #{servico.plano?.pedido?.numeroPedido}
              </Td>

              <Td>
                {servico.plano?.pedido?.cliente?.nome}
              </Td>

              <Td>
                {servico.plano?.numeroPlano}
              </Td>

              <Td >
                {servico.tipoServico?.nome}
              </Td>

              <Td >
                {servico.operador?.nome || "-"}
              </Td>

              <Td >
                <BadgeStatus status={servico.status} />
              </Td>

              <Td >
                <Link
                  to={`/pedidos/${servico.plano?.pedido?.id}`}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Ver
                </Link>
              </Td>
            </tr>
          ))}

          {servicos.length === 0 && (
            <tr>
              <Td colSpan="7">
                Nenhum item encontrado.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  )
}