export function SecaoDashboard({ titulo, children }) {
  return (
    <section className="mb-8" aria-labelledby={`secao-${titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
      <div className="mb-4 flex items-center gap-3">
        <h2
          id={`secao-${titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className="shrink-0 text-lg font-bold text-gray-900 sm:text-xl"
        >
          {titulo}
        </h2>
        <div className="h-px flex-1 bg-gray-200" aria-hidden="true" />
      </div>
      {children}
    </section>
  )
}
