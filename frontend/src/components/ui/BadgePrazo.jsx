export function BadgePrazo({ prazo }) {

  const classes = {
    "No prazo": "bg-blue-100 text-blue-700",
    "Entregue no prazo": "bg-green-100 text-green-700",
    "Atrasado": "bg-red-100 text-red-700",
    "Entregue com atraso": "bg-orange-100 text-orange-700",
    "Sem data": "bg-gray-100 text-gray-700"
  }

  return (
    <span
      className={`
        px-3 py-1 rounded-full text-xs font-semibold
        ${classes[prazo] || "bg-gray-100 text-gray-700"}
      `}
    >
      {prazo || "-"}
    </span>
  )
}