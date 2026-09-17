export function CartaoPedido({ numero, cliente, status, children, acoes, className = "" }) {
  return (
    <article className={`min-w-0 rounded-xl border border-gray-200 bg-white p-4 [overflow-wrap:anywhere] ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-w-0 font-bold text-blue-700">{numero}</h3>
        {status}
      </div>
      <p className="mt-2 font-semibold text-gray-900">{cliente || "Cliente não informado"}</p>
      <dl className="mt-3 space-y-2 text-sm text-gray-700">{children}</dl>
      {acoes && <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-200 pt-3">{acoes}</div>}
    </article>
  )
}

export function DadoPedido({ titulo, children }) {
  return <div className="min-w-0"><dt className="text-xs text-gray-500">{titulo}</dt><dd>{children || "—"}</dd></div>
}
