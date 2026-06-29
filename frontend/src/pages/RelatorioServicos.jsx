import { useEffect, useState } from "react"
import { api } from "../services/api"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import { Table, Th, Td } from "../components/ui/Table"
import { BadgeStatus } from "../components/ui/BadgeStatus"

import {
  Search,
  Eraser,
  Printer,
  Download,
  ClipboardList,
  Clock,
  Factory,
  CheckCircle2,
  User
} from "lucide-react"

export function RelatorioServicos() {
  const [servicos, setServicos] = useState([])
  const [operadores, setOperadores] = useState([])
  const [tiposServico, setTiposServico] = useState([])

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState("")
  const [operadorId, setOperadorId] = useState("")
  const [tipoServicoId, setTipoServicoId] = useState("")
  const [somentePendentes, setSomentePendentes] = useState(true)

  async function carregarBase() {
    const [operadoresRes, tiposRes] = await Promise.all([
      api.get("/funcionarios/operadores"),
      api.get("/tipos-servico")
    ])

    setOperadores(operadoresRes.data)
    setTiposServico(tiposRes.data)
  }

  async function buscar() {
    const response = await api.get("/relatorios/servicos", {
      params: {
        dataInicio,
        dataFim,
        busca,
        status,
        operadorId,
        tipoServicoId,
        somentePendentes
      }
    })

    setServicos(response.data)
  }

  useEffect(() => {
    carregarBase()
    buscar()
  }, [])

  async function limparFiltros() {
    setDataInicio("")
    setDataFim("")
    setBusca("")
    setStatus("")
    setOperadorId("")
    setTipoServicoId("")
    setSomentePendentes(true)

    const response = await api.get("/relatorios/servicos", {
      params: {
        dataInicio: "",
        dataFim: "",
        busca: "",
        status: "",
        operadorId: "",
        tipoServicoId: "",
        somentePendentes: true
      }
    })

    setServicos(response.data)
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

    return `#${pedido?.numeroPedido}`
  }

  function imprimir() {
    window.print()
  }

  function exportarCSV() {
    const cabecalho = [
      "Pedido",
      "Cliente",
      "Plano",
      "Chapas",
      "Servico",
      "Operador",
      "Status",
      "Entrega",
      "Observacoes"
    ]

    const linhas = servicos.map((item) => [
      obterNumeroPedido(item.plano?.pedido),
      item.plano?.pedido?.cliente?.nome || "",
      item.plano?.numeroPlano || "",
      item.plano?.quantidadeChapas || "",
      item.tipoServico?.nome || "",
      item.operador?.nome || "",
      item.status || "",
      formatarData(item.plano?.pedido?.dataEntrega),
      item.observacoes || ""
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
    link.download = "relatorio-servicos.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const total = servicos.length
  const abertos = servicos.filter((s) => s.status === "ABERTO").length
  const iniciados = servicos.filter((s) => s.status === "INICIADO").length
  const concluidos = servicos.filter((s) => s.status === "CONCLUIDO").length

  const operadoresEnvolvidos = new Set(
    servicos
      .filter((s) => s.operador?.id)
      .map((s) => s.operador.id)
  ).size

  function ResumoCard({ titulo, valor, icon: Icon, tipo = "normal" }) {
    const classes = {
      normal: {
        card: "bg-white border-gray-200",
        icon: "bg-gray-100 text-gray-700"
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 no-print">
        <ResumoCard titulo="Total" valor={total} icon={ClipboardList} />
        <ResumoCard titulo="Abertos" valor={abertos} icon={Clock} />
        <ResumoCard titulo="Em Produção" valor={iniciados} tipo="info" icon={Factory} />
        <ResumoCard titulo="Operadores" valor={operadoresEnvolvidos} icon={User} />
      </div>

      <div className="bg-whitounded-2xl shadow-md mb-8 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <Input
            type="text"
            placeholder="Buscar pedido, cliente ou serviço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select
            value={tipoServicoId}
            onChange={(e) => setTipoServicoId(e.target.value)}
          >
            <option value="">Todos os serviços</option>

            {tiposServico.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </Select>

          <Select
            value={operadorId}
            onChange={(e) => setOperadorId(e.target.value)}
          >
            <option value="">Todos os operadores</option>

            {operadores.map((operador) => (
              <option key={operador.id} value={operador.id}>
                {operador.nome}
              </option>
            ))}
          </Select>

          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={somentePendentes}
          >
            <option value="">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="INICIADO">Em Produção</option>
            <option value="CONCLUIDO">Concluído</option>
            <option value="CANCELADO">Cancelado</option>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={somentePendentes}
              onChange={(e) => setSomentePendentes(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />

            Somente pendentes
          </label>

          <div className="flex gap-3">
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
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden print-area">
        <div className="p-6 pb-3">
          <h2 className="text-2xl font-bold">
            Relatório de Serviços
          </h2>

          <p className="text-sm text-gray-600">
            {servicos.length} serviço{servicos.length === 1 ? "" : "s"} encontrado{servicos.length === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="px-6 pb-6">
          <Table>
            <thead>
              <tr>
                <Th>Pedido</Th>
                <Th>Cliente</Th>
                <Th>Plano</Th>
                <Th>Chapas</Th>
                <Th>Serviço</Th>
                <Th>Operador</Th>
                <Th>Status</Th>
                <Th>Entrega</Th>
                <Th>Observações</Th>
              </tr>
            </thead>

            <tbody>
              {servicos.map((item) => (
                <tr key={item.id}>
                  <Td className="font-bold text-blue-700">
                    {obterNumeroPedido(item.plano?.pedido)}
                  </Td>

                  <Td>
                    {item.plano?.pedido?.cliente?.nome || "-"}
                  </Td>

                  <Td>
                    {item.plano?.numeroPlano || "-"}
                  </Td>

                  <Td className="font-semibold text-blue-700">
                    {item.plano?.quantidadeChapas || "-"}
                  </Td>

                  <Td>
                    {item.tipoServico?.nome || "-"}
                  </Td>

                  <Td>
                    {item.operador?.nome || "-"}
                  </Td>

                  <Td>
                    <BadgeStatus status={item.status} />
                  </Td>

                  <Td>
                    {formatarData(item.plano?.pedido?.dataEntrega)}
                  </Td>

                  <Td className="max-w-[280px] truncate">
                    {item.observacoes || "-"}
                  </Td>
                </tr>
              ))}

              {servicos.length === 0 && (
                <tr>
                  <Td colSpan="9" className="text-center text-gray-500 py-6">
                    Nenhum serviço encontrado.
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