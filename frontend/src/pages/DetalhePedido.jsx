import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { api } from "../services/api"
import { CabecalhoImpressao } from "../components/CabecalhoImpressao"
import { Button } from "../components/ui/Button"
import { BadgeStatus } from "../components/ui/BadgeStatus"

export function DetalhePedido() {
  const { id } = useParams()
  const [pedido, setPedido] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  
  async function carregarDetalhe() {
    try {
      const [pedidoResponse, empresaResponse] = await Promise.all([
        api.get(`/detalhe-pedido/${id}`),
        api.get("/configuracao-empresa")
      ])

      setPedido(pedidoResponse.data)
      setEmpresa(empresaResponse.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar detalhe do pedido")
    }
  }

  useEffect(() => {
    carregarDetalhe()
  }, [id])

  function imprimir() {
    window.print()
  }

  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleDateString("pt-BR")
  }

  function formatarDataHora(data) {
    if (!data) return "-"

    return new Date(data).toLocaleString("pt-BR")
  }

  function formatarMoeda(valor) {
    if (!valor) return "-"

    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    })
  }

  function classeStatus(status) {
    const classes = {
      ABERTO: "bg-gray-100 text-gray-700",
      EM_PRODUCAO: "bg-blue-100 text-blue-700",
      PENDENTE_PECA: "bg-orange-100 text-orange-700",
      AGUARDANDO_EXTERNO: "bg-purple-100 text-purple-700",
      PARCIAL: "bg-yellow-100 text-yellow-700",
      CONCLUIDO: "bg-green-100 text-green-700",
      PRONTO_ENTREGA: "bg-cyan-100 text-cyan-700",
      SAIU_ENTREGA: "bg-indigo-100 text-indigo-700",
      ENTREGUE: "bg-emerald-100 text-emerald-700",
      CANCELADO: "bg-red-100 text-red-700"
    }

    return classes[status] || "bg-gray-100 text-gray-700"
  }

    function classeHistorico(tipo) {
    if (tipo.includes("EXCLUIDO")) {
      return "bg-red-100 text-red-700 border-red-400"
    }

    if (tipo.includes("STATUS")) {
      return "bg-yellow-100 text-yellow-700 border-yellow-400"
    }

    if (tipo.includes("CRIADO")) {
      return "bg-blue-100 text-blue-700 border-blue-400"
    }

    if (tipo.includes("ATUALIZADO")) {
      return "bg-purple-100 text-purple-700 border-purple-400"
    }

    return "bg-gray-100 text-gray-700 border-gray-300"
  }

  if (!pedido) {
    return <div>Carregando...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h1 className="text-3xl font-bold">
            Pedido #{pedido.numeroPedido}
          </h1>

          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${classeStatus(pedido.status)}`}
          >
            <BadgeStatus status={pedido.status} />
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={imprimir}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg"
          >
            Imprimir
          </Button>

          <Link
            to="/pedidos"
            className="bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Voltar
          </Link>
        </div>
      </div>

      <CabecalhoImpressao
        empresa={empresa}
        titulo={`Detalhe do Pedido #${pedido.numeroPedido}`}
        extra={`Status: $<BadgeStatus status={pedido.status} />`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card titulo="Cliente" valor={pedido.cliente?.nome} />
        <Card titulo="Vendedor" valor={pedido.vendedor?.nome} />
        <Card titulo="Entrega" valor={formatarData(pedido.dataEntrega)} />
        <Card titulo="Tipo Entrega" valor={pedido.tipoEntrega} />
        <Card titulo="Rota" valor={pedido.rota?.nome || "-"} />
        <Card titulo="Valor Total" valor={formatarMoeda(pedido.valorTotal)} />
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Dados de Entrega
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
          <p>
            <strong>Recebedor:</strong> {pedido.nomeRecebedor || "-"}
          </p>

          <p>
            <strong>Contato:</strong> {pedido.contatoRecebedor || "-"}
          </p>

          <p className="md:col-span-2">
            <strong>Endereço:</strong> {pedido.enderecoEntrega || pedido.cliente?.endereco || "-"}
          </p>

          <p className="md:col-span-2">
            <strong>Observações:</strong> {pedido.observacoes || "-"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <div className="flex flex-col gap-4">
          {pedido.planos.map((plano) => (
            <div
              key={plano.id}
              className="border rounded-2xl p-4 bg-gray-50"
            >
              <h3 className="font-bold text-lg mb-2">
                Plano {plano.numeroPlano} — {plano.quantidadeChapas} chapas
              </h3>

              <p className="text-sm text-gray-600 mb-3">
                Encabeçamento: {plano.medidaEncabecamento || "-"} |
                Compra externa: {plano.compraExterna ? "Sim" : "Não"}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plano.servicos.map((servico) => (
                  <div
                    key={servico.id}
                    className="bg-white border rounded-xl p-3"
                  >
                    <p className="font-semibold">
                      {servico.tipoServico?.nome}
                    </p>

                    <p className="text-sm text-gray-600">
                      Status:
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${classeStatus(servico.status)}`}
                      >
                        {servico.status}
                      </span>
                    </p>

                    <p className="text-sm text-gray-600">
                      Operador: {servico.operador?.nome || "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      Início: {formatarDataHora(servico.dataInicio)}
                    </p>

                    <p className="text-sm text-gray-600">
                      Fim: {formatarDataHora(servico.dataFim)}
                    </p>
                  </div>
                ))}

                {plano.servicos.lengTh === 0 && (
                  <p className="text-gray-500">
                    Nenhum serviço neste plano.
                  </p>
                )}
              </div>
            </div>
          ))}

          {pedido.planos.lengTh === 0 && (
            <p className="text-gray-500">
              Nenhum plano cadastrado.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">
          Histórico
        </h2>

        <div className="relative border-l-2 border-gray-300 ml-3 pl-6 flex flex-col gap-6">
          {pedido.historicos.map((item) => (
            <div key={item.id} className="relative">
              <div className="absolute -left-[34px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow" />

              <div className="bg-gray-50 border rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start gap-4 mb-3">
                <div>
                  <span
                    className={`inline-block mb-2 px-3 py-1 rounded-full border text-xs font-semibold ${classeHistorico(item.tipo)}`}
                  >
                    {item.tipo}
                  </span>

                  <p className="font-bold">
                    {item.descricao}
                  </p>
                </div>

                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatarDataHora(item.createdAt)}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                Usuário: {item.usuario?.funcionario?.nome || "-"}
              </p>
            </div>
            </div>
          ))}

          {pedido.historicos.lengTh === 0 && (
            <p className="text-gray-500">
              Nenhum histórico encontrado.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ titulo, valor }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border p-5">
      <p className="text-sm text-gray-600">
        {titulo}
      </p>

      <strong className="text-xl">
        {valor || "-"}
      </strong>
    </div>
  )
}