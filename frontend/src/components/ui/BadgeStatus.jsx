export function BadgeStatus({ status }) {
  const classes = {
   // ABERTO: "bg-gray-100 text-gray-700",
    ABERTO: "bg-slate-200 text-slate-800",
    EM_PRODUCAO: "bg-blue-100 text-blue-700",
    PARCIAL: "bg-yellow-100 text-yellow-700",
    INICIADO: "bg-sky-100 text-sky-700",
    EM_SEPARACAO: "bg-orange-100 text-orange-700",
    CONCLUIDO: "bg-green-100 text-green-700",
    PRONTO_ENTREGA: "bg-cyan-100 text-cyan-700",
    SAIU_ENTREGA: "bg-indigo-100 text-indigo-700",
    ENTREGUE: "bg-teal-100 text-teal-700",
    CANCELADO: "bg-red-100 text-red-700"
  }

  const labels = {
    ABERTO: "Aberto",
    EM_PRODUCAO: "Em Produção",
    PARCIAL: "Parcial",
    INICIADO: "Iniciado",
    EM_SEPARACAO: "Em Separação",
    CONCLUIDO: "Concluído",
    PRONTO_ENTREGA: "Pronto Entrega",
    SAIU_ENTREGA: "Saiu Entrega",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado"
  }

  return (
    <span
      className={`
        px-3 py-1 rounded-full text-xs font-semibold
        ${classes[status] || "bg-gray-100 text-gray-700"}
      `}
    >
      {labels[status] || status || "-"}
    </span>
  )
}