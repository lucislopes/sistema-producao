export function CabecalhoImpressao({
  empresa,
  titulo,
  periodoInicio,
  periodoFim,
  extra
}) {
  function formatarData(data) {
    if (!data) return "-"

    return new Date(data).toLocaleDateString("pt-BR")
  }

  return (
    <div className="hidden print:block mb-8 border-b pb-4">
      <h1 className="text-2xl font-bold">
        {empresa?.nome || "Empresa"}
      </h1>

      <p className="text-sm">
        CNPJ: {empresa?.cnpj || "-"}
      </p>

      <p className="text-sm">
        {empresa?.endereco || "-"}
      </p>

      <p className="text-sm">
        {empresa?.cidade || "-"} / {empresa?.estado || "-"}
      </p>

      <p className="text-sm">
        Tel: {empresa?.telefone || "-"} | E-mail: {empresa?.email || "-"}
      </p>

      <h2 className="text-xl font-bold mt-4">
        {titulo}
      </h2>

      {(periodoInicio || periodoFim) && (
        <p>
          Período: {formatarData(periodoInicio)} até {formatarData(periodoFim)}
        </p>
      )}

      {extra && (
        <p>
          {extra}
        </p>
      )}

      <p>
        Emitido em: {new Date().toLocaleString("pt-BR")}
      </p>
    </div>
  )
}