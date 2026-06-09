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
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-gray-600 truncate">{titulo}</p>
        <strong className="text-2xl font-bold block mt-1">{valor}</strong>
      </div>

      {Icon && (
        <div className={`p-3 rounded-xl ${estilo.icon}`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  )

  const className = `
    rounded-xl shadow-sm border p-4 block
    hover:scale-[1.02] transition
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