import { useEffect, useState } from "react"
import { api } from "../services/api"

export function CapacidadeDiaria({ data, mostrarFretes = true, mostrarChapas = true, responsavelFrete, atualizacao }) {
  const dia = data?.slice(0, 10) || ""
  const [consulta, setConsulta] = useState(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!dia) return
    const controller = new AbortController()
    api.get("/pedidos/capacidade-diaria", { params: { data: dia }, signal: controller.signal })
      .then(({ data: resultado }) => {
        if (!controller.signal.aborted) setConsulta({ dia, versao, atualizacao, resultado })
      })
      .catch(() => {
        if (!controller.signal.aborted) setConsulta({ dia, versao, atualizacao, erro: true })
      })
    return () => controller.abort()
  }, [dia, versao, atualizacao])

  if (!mostrarFretes && !mostrarChapas) return null
  if (!dia) return <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">Selecione a data prevista de entrega para consultar os limites e a capacidade disponível. Nos planos, a data é a do pedido.</p>

  const atual = consulta?.dia === dia && consulta?.versao === versao && consulta?.atualizacao === atualizacao ? consulta : null
  const itens = [
    ...(mostrarFretes ? [["freteEmpresa", "Fretes da loja", responsavelFrete === "EMPRESA"], ["freteCliente", "Fretes do cliente", responsavelFrete === "CLIENTE"]] : []),
    ...(mostrarChapas ? [["chapas", "Chapas de produção", false]] : [])
  ]

  return (
    <section aria-label="Capacidade da data de entrega" className="my-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-blue-950">Capacidade para {dia.split("-").reverse().join("/")}</h3>
        <button type="button" onClick={() => setVersao(v => v + 1)} className="text-sm font-medium text-blue-700 underline">Atualizar disponibilidade</button>
      </div>
      <div aria-live="polite">
        {!atual ? <p className="mt-3 text-sm text-gray-600">Consultando disponibilidade…</p> : atual.erro ? (
          <p className="mt-3 text-sm text-amber-800">Não foi possível consultar a capacidade. Tente atualizar. Os limites continuam sendo verificados ao salvar.</p>
        ) : (
          <div className={`mt-3 grid gap-3 ${itens.length > 1 ? "sm:grid-cols-3" : ""}`}>
            {itens.map(([campo, titulo, selecionado]) => {
              const item = atual.resultado[campo]
              const lotado = item.disponivel === 0
              const tom = item.excedente > 0 ? "border-red-200 bg-red-50 text-red-900" : lotado ? "border-amber-300 bg-amber-50 text-amber-950" : "border-emerald-200 bg-white text-emerald-950"
              return (
                <div key={campo} className={`rounded-lg border p-3 ${tom}`}>
                  <p className="text-sm font-semibold">{titulo}{selecionado ? " · selecionado" : ""}</p>
                  <p className="mt-1 text-lg font-bold">{item.utilizado} {campo === "chapas" ? "programadas" : "registrados"}</p>
                  <p className="text-sm">Limite diário: {item.limite ?? "desativado"}</p>
                  <p className="mt-1 text-sm font-semibold">{item.disponivel == null ? "Sem limite configurado" : `${item.disponivel} disponíveis`}</p>
                  {item.excedente > 0 ? <p className="text-xs">{item.excedente} acima do limite atual.</p> : lotado ? <p className="text-xs">Capacidade esgotada para novos agendamentos.</p> : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-600">Contagem dos registros já salvos, incluindo este pedido se ele já estiver nesta data. Alterações do formulário ainda não entram no total. Cancelados não contam. A disponibilidade é conferida novamente ao salvar.</p>
      {mostrarFretes && <p className="mt-1 text-xs text-gray-600">Cada pedido com entrega ocupa um frete. Retirada pelo cliente não ocupa vaga de frete.</p>}
    </section>
  )
}
