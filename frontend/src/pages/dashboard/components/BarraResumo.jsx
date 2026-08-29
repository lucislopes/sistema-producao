export function BarraResumo({ titulo, total, itens }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border p-5">
      <h3 className="font-bold mb-4">{titulo}</h3>

      <div className="flex flex-col gap-3">
        {total === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
            <p className="font-medium text-gray-700">Sem movimentação no período</p>
            <p className="mt-1 text-sm text-gray-500">Altere as datas acima para consultar outro intervalo.</p>
          </div>
        )}

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
                  role="progressbar"
                  aria-label={item.nome}
                  aria-valuenow={percentual}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
