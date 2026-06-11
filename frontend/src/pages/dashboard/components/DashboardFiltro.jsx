export function DashboardFiltro({
  baseData,
  setBaseData,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  aplicarPeriodo,
  ultimaAtualizacao
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md border p-4 mb-6">
      <p className="text-sm text-gray-500 mb-3">
        Indicadores filtrados por:{" "}
        <strong>
          {baseData === "entrega"
            ? "Data prevista de entrega"
            : "Data do pedido"}
        </strong>
      </p>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="border p-3 rounded-lg"
          value={baseData}
          onChange={(e) => setBaseData(e.target.value)}
        >
          <option value="entrega">Data prevista de entrega</option>
          <option value="pedido">Data do pedido</option>
        </select>

        <input
          type="date"
          className="border p-3 rounded-lg"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />

        <input
          type="date"
          className="border p-3 rounded-lg"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />

        <button
          type="button"
          onClick={() => aplicarPeriodo("hoje")}
          className="bg-gray-700 text-white px-4 py-3 rounded-lg"
        >
          Hoje
        </button>

        <button
          type="button"
          onClick={() => aplicarPeriodo("semana")}
          className="bg-gray-700 text-white px-4 py-3 rounded-lg"
        >
          {baseData === "entrega" ? "Próx. 7 dias" : "Últimos 7 dias"}
        </button>

        <button
          type="button"
          onClick={() => aplicarPeriodo("15dias")}
          className="bg-gray-700 text-white px-4 py-3 rounded-lg"
        >
          {baseData === "entrega" ? "Próx. 15 dias" : "Últimos 15 dias"}
        </button>

        <button
          type="button"
          onClick={() => aplicarPeriodo("30dias")}
          className="bg-gray-700 text-white px-4 py-3 rounded-lg"
        >
          {baseData === "entrega" ? "Próx. 30 dias" : "Últimos 30 dias"}
        </button>

        <button
          type="button"
          onClick={() => aplicarPeriodo("mes")}
          className="bg-gray-700 text-white px-4 py-3 rounded-lg"
        >
          Mês atual
        </button>

        <button
          type="button"
          onClick={() => aplicarPeriodo("ano")}
          className="bg-gray-700 text-white px-4 py-3 rounded-lg"
        >
          Ano atual
        </button>

        {ultimaAtualizacao && (
          <p className="text-sm text-gray-500 ml-auto">
            Atualizado às {ultimaAtualizacao.toLocaleTimeString("pt-BR")}
          </p>
        )}
      </div>
    </div>
  )
}