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
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="titulo-filtros-dashboard">
      <div className="mb-4">
        <h2 id="titulo-filtros-dashboard" className="font-semibold text-gray-900">
          Período dos indicadores
        </h2>
        <p className="mt-1 text-sm text-gray-500">
        Indicadores filtrados por:{" "}
        <strong>
          {baseData === "entrega"
            ? "Data prevista de entrega"
            : "Data do pedido"}
        </strong>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium text-gray-700">
          Data considerada
          <Select className="mt-1" value={baseData} onChange={(e) => setBaseData(e.target.value)}>
            <option value="entrega">Data prevista de entrega</option>
            <option value="pedido">Data do pedido</option>
          </Select>
        </label>

        <label className="text-sm font-medium text-gray-700">
          Data inicial
          <Input className="mt-1" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </label>

        <label className="text-sm font-medium text-gray-700">
          Data final
          <Input className="mt-1" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Períodos rápidos">
        <Button
          type="button"
          onClick={() => aplicarPeriodo("hoje")}
          variant="dark"
          size="sm"
        >
          Hoje
        </Button>

        <Button
          type="button"
          onClick={() => aplicarPeriodo("semana")}
          variant="dark"
          size="sm"
        >
          {baseData === "entrega" ? "Próx. 7 dias" : "Últimos 7 dias"}
        </Button>

        <Button
          type="button"
          onClick={() => aplicarPeriodo("15dias")}
          variant="dark"
          size="sm"
        >
          {baseData === "entrega" ? "Próx. 15 dias" : "Últimos 15 dias"}
        </Button>

        <Button
          type="button"
          onClick={() => aplicarPeriodo("30dias")}
          variant="dark"
          size="sm"
        >
          {baseData === "entrega" ? "Próx. 30 dias" : "Últimos 30 dias"}
        </Button>

        <Button
          type="button"
          onClick={() => aplicarPeriodo("mes")}
          variant="dark"
          size="sm"
        >
          Mês atual
        </Button>

        <Button
          type="button"
          onClick={() => aplicarPeriodo("ano")}
          variant="dark"
          size="sm"
        >
          Ano atual
        </Button>

        {ultimaAtualizacao && (
          <p className="flex w-full items-center text-sm text-gray-500 sm:ml-auto sm:w-auto" aria-live="polite">
            Atualizado às {ultimaAtualizacao.toLocaleTimeString("pt-BR")}
          </p>
        )}
      </div>
    </section>
  )
}
import { Button } from "../../../components/ui/Button"
import { Input } from "../../../components/ui/Input"
import { Select } from "../../../components/ui/Select"
