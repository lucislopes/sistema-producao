import { useState } from "react"

export function FiltrosResponsivos({ children, ativos = 0 }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="no-print min-w-0">
      <button type="button" aria-expanded={aberto} onClick={() => setAberto(!aberto)}
        className="mb-3 flex min-h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold md:hidden">
        <span>Filtros{ativos > 0 ? ` (${ativos} preenchidos)` : ""}</span>
        <span>{aberto ? "Recolher" : "Mostrar"}</span>
      </button>
      <div className={`${aberto ? "block" : "hidden"} md:block`}>{children}</div>
    </div>
  )
}
