export function BarraResumo({ titulo, total, itens }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border p-5">
      <h3 className="font-bold mb-4">{titulo}</h3>

      <div className="flex flex-col gap-3">
        {itens.map((item) => {
          const percentual =
            total > 0 ? Math.round((item.valor / total) * 100) : 0

          return (
            <div key={item.nome}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.nome}</span>
                <span>
                  {item.valor} ({percentual}%)
                </span>
              </div>

              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${percentual}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}