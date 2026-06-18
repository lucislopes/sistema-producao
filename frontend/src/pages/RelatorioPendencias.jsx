import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Table, Th, Td } from "../components/ui/Table"
import { BadgeStatus } from "../components/ui/BadgeStatus"

import {
  Search,
  Eraser,
  Printer,
  Download,
  ClipboardList,
  TriangleAlert,
  FileWarning,
  Wrench,
  CalendarDays
} from "lucide-react"

export function RelatorioPendencias() {
  const [itens, setItens] = useState([])
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [busca, setBusca] = useState("")

  async function buscar() {
    try {
      const response = await api.get("/relatorios/pendencias", {
        params: {
          dataInicio,
          dataFim,
          busca
        }
      })

      setItens(response.data)
    } catch (error) {
      console.log(error)
      alert("Erro ao carregar pendências")
    }
  }

  useEffect(() => {
    buscar()
  }, [])

  function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setBusca("")

    api.get("/relatorios/pendencias", {
      params: {
        dataInicio: "",
        dataFim: "",
        busca: ""
      }
    }).then((response) => {
      setItens(response.data)
    })
  }

  function formatarData(data) {
    if (!data) return "-"

    const dataTexto = String(data).substring(0, 10)
    const [ano, mes, dia] = dataTexto.split("-")

    return `${dia}/${mes}/${ano}`
  }

  function obterNumeroPedido(pedido) {
    if (
      pedido?.origemPedido === "EXTERNO" &&
      pedido?.numeroPedidoManual
    ) {
      return pedido.numeroPedidoManual
    }

    return `#${pedido?.numeroPedido || "-"}`
  }

  function tipoPendenciaTexto(tipo) {
    const mapa = {
      PEDIDO_SEM_PLANO: "Pedido sem plano",
      PLANO_SEM_SERVICO: "Plano sem serviço",
      SERVICO_PENDENTE: "Serviço pendente"
    }

    return mapa[tipo] || tipo
  }

  function tipoPendenciaClasse(tipo) {
    const mapa = {
      PEDIDO_SEM_PLANO: "bg-red-100 text-red-700",
      PLANO_SEM_SERVICO: "bg-yellow-100 text-yellow-700",
      SERVICO_PENDENTE: "bg-blue-100 text-blue-700"
    }

    return mapa[tipo] || "bg-gray-100 text-gray-700"
  }

  function imprimir() {
    window.print()
  }

  function exportarCSV() {
    const cabecalho = [
      "Pendencia",
      "Pedido",
      "Cliente",
      "Plano",
      "Chapas",
      "Servico",
      "Operador",
      "Status",
      "Entrega"
    ]

    const linhas = itens.map((item) => [
      tipoPendenciaTexto(item.tipo),
      obterNumeroPedido(item.pedido),
      item.pedido?.cliente?.nome || "",
      item.plano?.numeroPlano || "",
      item.plano?.quantidadeChapas || "",
      item.servico?.tipoServico?.nome || "",
      item.servico?.operador?.nome || "",
      item.status || "",
      formatarData(item.pedido?.dataEntrega)
    ])

    const csv = [cabecalho, ...linhas]
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo).replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n")

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "relatorio-pendencias.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const total = itens.length

  const pedidosSemPlano = itens.filter(
    (item) => item.tipo === "PEDIDO_SEM_PLANO"
  ).length

  const planosSemServico = itens.filter(
    (item) => item.tipo === "PLANO_SEM_SERVICO"
  ).length

  const servicosPendentes = itens.filter(
    (item) => item.tipo === "SERVICO_PENDENTE"
  ).length

  function ResumoCard({ titulo, valor, icon: Icon, tipo = "normal" }) {
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
      }
    }

    const estilo = classes[tipo] || classes.normal

    return (
      <div className={`rounded-xl shadow-sm border p-4 ${estilo.card}`}>
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
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 no-print">
        <Button
          type="button"
          onClick={exportarCSV}
          className="bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Download size={18} />
          Exportar CSV
        </Button>

        <Button
          type="button"
          onClick={imprimir}
          className="bg-gray-800 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Printer size={18} />
          Imprimir
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
        <ResumoCard
          titulo="Total Pendências"
          valor={total}
          tipo={total > 0 ? "alerta" : "normal"}
          icon={ClipboardList}
        />

        <ResumoCard
          titulo="Pedidos Sem Plano"
          valor={pedidosSemPlano}
          tipo={pedidosSemPlano > 0 ? "perigo" : "normal"}
          icon={FileWarning}
        />

        <ResumoCard
          titulo="Planos Sem Serviço"
          valor={planosSemServico}
          tipo={planosSemServico > 0 ? "alerta" : "normal"}
          icon={TriangleAlert}
        />

        <ResumoCard
          titulo="Serviços Pendentes"
          valor={servicosPendentes}
          tipo={servicosPendentes > 0 ? "info" : "normal"}
          icon={Wrench}
        />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              type="text"
              placeholder="Buscar pedido, cliente ou serviço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={buscar}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Search size={18} />
            Buscar
          </Button>

          <Button
            type="button"
            onClick={limparFiltros}
            variant=""
            className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Eraser size={18} />
            Limpar
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden print-area">
        <div className="p-6 pb-3">
          <h2 className="text-2xl font-bold">
            Relatório de Pendências
          </h2>

          <p className="text-sm text-gray-600">
            {itens.length} pendência{itens.length === 1 ? "" : "s"} encontrada{itens.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="px-6 pb-6">
          <Table>
            <thead>
              <tr>
                <Th>Pendência</Th>
                <Th>Pedido</Th>
                <Th>Cliente</Th>
                <Th>Plano</Th>
                <Th>Chapas</Th>
                <Th>Serviço</Th>
                <Th>Operador</Th>
                <Th>Status</Th>
                <Th>Entrega</Th>
              </tr>
            </thead>

            <tbody>
              {itens.map((item, index) => (
                <tr key={`${item.tipo}-${item.pedido?.id}-${item.plano?.id || "sem-plano"}-${item.servico?.id || index}`}>
                  <Td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${tipoPendenciaClasse(
                        item.tipo
                      )}`}
                    >
                      {tipoPendenciaTexto(item.tipo)}
                    </span>
                  </Td>

                  <Td className="font-bold text-blue-700">
                    {obterNumeroPedido(item.pedido)}
                  </Td>

                  <Td>
                    {item.pedido?.cliente?.nome || "-"}
                  </Td>

                  <Td>
                    {item.plano?.numeroPlano || "-"}
                  </Td>

                  <Td className="font-semibold text-blue-700">
                    {item.plano?.quantidadeChapas || "-"}
                  </Td>

                  <Td>
                    {item.servico?.tipoServico?.nome || "-"}
                  </Td>

                  <Td>
                    {item.servico?.operador?.nome || "-"}
                  </Td>

                  <Td>
                    <BadgeStatus status={item.status} />
                  </Td>

                  <Td>
                    {formatarData(item.pedido?.dataEntrega)}
                  </Td>
                </tr>
              ))}

              {itens.length === 0 && (
                <tr>
                  <Td colSpan="9" className="text-center text-gray-500 py-6">
                    Nenhuma pendência encontrada.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  )
}