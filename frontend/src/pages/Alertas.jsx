import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import { BadgeStatus } from "../components/ui/BadgeStatus"
import { Table, Th, Td } from "../components/ui/Table"
import { ErrorState, LoadingState } from "../components/ui/FeedbackState"
import { Button } from "../components/ui/Button"
import {
  Bell,
  TriangleAlert,
  UserX,
  Package,
  PackageCheck,
  Eye,
  RefreshCw
} from "lucide-react"

function obterNumeroPedido(pedido) {
  if (
    pedido?.origemPedido === "EXTERNO" &&
    pedido?.numeroPedidoManual
  ) {
    return pedido.numeroPedidoManual
  }

  return `#${pedido?.numeroPedido}`
}

export function Alertas() {
  const [alertas, setAlertas] = useState(null)
  const [erroCarregamento, setErroCarregamento] = useState("")
  const [atualizando, setAtualizando] = useState(false)
  const [atualizadoEm, setAtualizadoEm] = useState(null)

  async function carregarAlertas() {
    setErroCarregamento("")
    setAtualizando(true)
    try {
      const response = await api.get("/alertas")
      setAlertas(response.data)
      setAtualizadoEm(new Date())
    } catch (error) {
      console.log(error)
      setErroCarregamento("Não foi possível carregar os alertas operacionais.")
    } finally {
      setAtualizando(false)
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

    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-")

    return `${dia}/${mes}/${ano}`
  }

  function calcularDiasAtraso(data) {
    if (!data) return 0
    const hoje = new Date()
    const hojeUtc = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-").map(Number)
    return Math.max(0, Math.floor((hojeUtc - Date.UTC(ano, mes - 1, dia)) / 86400000))
  }

  if (erroCarregamento && !alertas) return <ErrorState descricao={erroCarregamento} onRetry={carregarAlertas} />
  if (!alertas) return <LoadingState mensagem="Carregando alertas operacionais..." />

    const totalAlertas =
      alertas.pedidosAtrasados.length +
      alertas.servicosSemOperador.length +
      alertas.pedidosEmSeparacao.length +
      alertas.pedidosProntoEntrega.length

    return (
      
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-950">Central de alertas</h1>
            <p className="mt-1 text-sm text-blue-800">
              Monitoramento automático a cada 30 segundos.
              {atualizadoEm && ` Última atualização: ${atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}.`}
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={carregarAlertas} loading={atualizando}>
            <RefreshCw size={17} />
            Atualizar agora
          </Button>
        </div>

        {erroCarregamento && alertas && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {erroCarregamento} Os dados anteriores continuam visíveis.
          </div>
        )}
        {totalAlertas === 0 && (
          <div className="bg-green-50 border border-green-300 text-green-800 rounded-xl p-4 mb-6">
            ✅ Tudo certo. Nenhum alerta crítico no momento.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ResumoCard
            titulo="Ocorrências"
            valor={totalAlertas}
            tipo={totalAlertas > 0 ? "perigo" : "normal"}
            icon={Bell}
          />

          <ResumoCard
            titulo="Pedidos Atrasados"
            valor={alertas.pedidosAtrasados.length}
            tipo={alertas.pedidosAtrasados.length > 0 ? "perigo" : "normal"}
            icon={TriangleAlert}
            href="#pedidos-atrasados"
          />

          <ResumoCard
            titulo="Sem Operador"
            valor={alertas.servicosSemOperador.length}
            tipo={alertas.servicosSemOperador.length > 0 ? "info" : "normal"}
            icon={UserX}
            href="#servicos-sem-operador"
          />

          <ResumoCard
            titulo="Separação p/ Prod."
            valor={alertas.pedidosEmSeparacao.length}
            tipo={alertas.pedidosEmSeparacao.length > 0 ? "alerta" : "normal"}
            icon={Package}
            href="#pedidos-separacao"
          />

          <ResumoCard
            titulo="Pronto Entrega"
            valor={alertas.pedidosProntoEntrega.length}
            tipo={alertas.pedidosProntoEntrega.length > 0 ? "sucesso" : "normal"}
            icon={PackageCheck}
            href="#pedidos-prontos"
          />
        </div>

        {alertas.pedidosAtrasados.length > 0 && (
          <SecaoPedidos
            titulo="Pedidos Atrasados"
            pedidos={alertas.pedidosAtrasados}
            formatarData={formatarData}
            calcularDiasAtraso={calcularDiasAtraso}
            id="pedidos-atrasados"
            exibirAtraso
          />
        )}
        {alertas.servicosSemOperador.length > 0 && (
          <SecaoServicos
            titulo="Serviços Sem Operador"
            servicos={alertas.servicosSemOperador}
            formatarData={formatarData}
            id="servicos-sem-operador"
          />
        )}
        {alertas.pedidosEmSeparacao.length > 0 && (
          <SecaoPedidos
            titulo="Pedidos em Separação para Produção"
            pedidos={alertas.pedidosEmSeparacao}
            formatarData={formatarData}
            id="pedidos-separacao"
          />
        )}
        {alertas.pedidosProntoEntrega.length > 0 && (
          <SecaoPedidos
            titulo="Pedidos Prontos para Entrega"
            pedidos={alertas.pedidosProntoEntrega}
            formatarData={formatarData}
            id="pedidos-prontos"
          />
        )}
      </div>
    )
  }

  function ResumoCard({ titulo, valor, tipo = "normal", icon: Icon, href }) {
    const classes = {
      normal: {
        card: "bg-white border-gray-200",
        icon: "bg-gray-100 text-gray-700"
      },
      perigo: {
        card: "bg-red-50 border-red-300",
        icon: "bg-red-100 text-red-700"
      },
      alerta: {
        card: "bg-yellow-50 border-yellow-300",
        icon: "bg-yellow-100 text-yellow-700"
      },
      info: {
        card: "bg-blue-50 border-blue-300",
        icon: "bg-blue-100 text-blue-700"
      },
      sucesso: {
        card: "bg-green-50 border-green-300",
        icon: "bg-green-100 text-green-700"
      }
    }

    const estilo = classes[tipo] || classes.normal

    const Component = href ? "a" : "div"

    return (
      <Component href={href} className={`rounded-xl shadow-sm border p-4 ${estilo.card} ${href ? "transition hover:-translate-y-0.5 hover:shadow-md" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-600">{titulo}</p>
            <strong className="text-2xl font-bold block mt-1">
              {valor}
            </strong>
          </div>

          {Icon && (
            <div className={`p-3 rounded-xl ${estilo.icon}`}>
              <Icon size={24} />
            </div>
          )}
        </div>
      </Component>
    )
  }

function SecaoPedidos({ titulo, pedidos, formatarData, calcularDiasAtraso, exibirAtraso = false, id }) {
  return (
    <section id={id} className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">
        {titulo} <span className="text-sm font-medium text-gray-500">({pedidos.length})</span>
      </h2>

      <Table>
        <thead>
          <tr>
            <Th>Pedido</Th>
            <Th>Cliente</Th>
            <Th>Entrega</Th>
            {exibirAtraso && <Th>Atraso</Th>}
            <Th>Rota</Th>
            <Th>Status</Th>
            <Th>Ação</Th>
          </tr>
        </thead>

        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido.id}>
              <Td>
                {obterNumeroPedido(pedido)}
              </Td>

              <Td>
                {pedido.cliente?.nome}
              </Td>

              <Td>
                {formatarData(pedido.dataEntrega)}
              </Td>

              {exibirAtraso && (
                <Td className="font-semibold text-red-700">
                  {calcularDiasAtraso(pedido.dataEntrega)} dia(s)
                </Td>
              )}

              <Td>
                {pedido.rota?.nome || "-"}
              </Td>

              <Td>
                <BadgeStatus status={pedido.status} />
              </Td>

              <Td>
                <Link
                  to={`/pedidos/${pedido.id}`}
                  aria-label={`Ver pedido ${obterNumeroPedido(pedido)}`}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700"
                >
                  <Eye size={15} />
                  Ver
                </Link>
              </Td>
            </tr>
          ))}

          {pedidos.length === 0 && (
            <tr>
              <Td colSpan={exibirAtraso ? "7" : "6"}>
                Nenhum item encontrado.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </section>
  )
}

function SecaoServicos({ titulo, servicos, formatarData, id }) {
  return (
    <section id={id} className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">
        {titulo} <span className="text-sm font-medium text-gray-500">({servicos.length})</span>
      </h2>

      <Table>
        <thead>
          <tr>
            <Th>Pedido</Th>
            <Th>Cliente</Th>
            <Th>Plano</Th>
            <Th>Serviço</Th>
            <Th>Entrega</Th>
            <Th>Status</Th>
            <Th>Ação</Th>
          </tr>
        </thead>

        <tbody>
          {servicos.map((servico) => (
            <tr key={servico.id}>
              <Td>
                {obterNumeroPedido(servico.plano?.pedido)}
              </Td>

              <Td>
                {servico.plano?.pedido?.cliente?.nome}
              </Td>

              <Td>
                {servico.plano?.numeroPlano}
              </Td>

              <Td>
                {servico.tipoServico?.nome}
              </Td>

              <Td>
                {formatarData(servico.plano?.pedido?.dataEntrega)}
              </Td>

              <Td>
                <BadgeStatus status={servico.status} />
              </Td>

              <Td>
                <Link
                  to={`/pedidos/${servico.plano?.pedido?.id}`}
                  aria-label={`Ver pedido ${obterNumeroPedido(servico.plano?.pedido)}`}
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition hover:bg-blue-700"
                >
                  <Eye size={15} />
                  Ver
                </Link>
              </Td>
            </tr>
          ))}

          {servicos.length === 0 && (
            <tr>
              <Td colSpan="7">
                Tudo certo por aqui.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </section>
  )
}
