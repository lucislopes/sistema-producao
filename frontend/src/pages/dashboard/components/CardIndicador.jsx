import { Link } from "react-router-dom"

export function CardIndicador({
  titulo,
  valor,
  tipo = "normal",
  link,
  icon: Icon
}) {
  const classes = {
    normal: {
      card: "bg-white border-gray-200",
      icon: "bg-gray-100 text-gray-700"
    },
    perigo: {
      card: "bg-red-50 border-red-500",
      icon: "bg-red-100 text-red-700"
    },
    alerta: {
      card: "bg-yellow-50 border-yellow-500",
      icon: "bg-yellow-100 text-yellow-700"
    },
    sucesso: {
      card: "bg-green-50 border-green-500",
      icon: "bg-green-100 text-green-700"
    },
    info: {
      card: "bg-blue-50 border-blue-500",
      icon: "bg-blue-100 text-blue-700"
    }
  }

  const estilo = classes[tipo] || classes.normal

  const conteudo = (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug text-gray-600">{titulo}</p>
        <strong className="mt-1 block break-words text-xl font-bold text-gray-900 sm:text-2xl">{valor}</strong>
      </div>

      {Icon && (
        <div className={`shrink-0 rounded-xl p-2.5 sm:p-3 ${estilo.icon}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  )

  const className = `
    block min-w-0 rounded-xl border p-4 shadow-sm
    transition duration-150 hover:-translate-y-0.5 hover:shadow-md
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    ${estilo.card}
  `

  if (link) {
    return (
      <Link to={link} className={className}>
        {conteudo}
      </Link>
    )
  }

  return <div className={className}>{conteudo}</div>
}
