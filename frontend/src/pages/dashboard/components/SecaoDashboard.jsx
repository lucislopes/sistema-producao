export function SecaoDashboard({ titulo, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">{titulo}</h2>
      {children}
    </div>
  )
}