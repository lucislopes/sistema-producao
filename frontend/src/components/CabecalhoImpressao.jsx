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

  const logo = empresa?.logoPath || empresa?.logoUrl

  return (
    <div className="hidden print:block mb-4 border-b border-gray-300 pb-3 text-xs">
      <div className="grid grid-cols-[90px_1fr_180px] gap-3 items-center">
        <div className="h-16 flex items-center justify-center border border-gray-200 rounded">
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              className="max-h-14 max-w-[80px] object-contain"
            />
          ) : (
            <span className="text-[10px] text-gray-400">
              Sem logo
            </span>
          )}
        </div>

        <div>
          <h1 className="text-base font-bold leading-tight">
            {empresa?.nome || "Empresa"}
          </h1>

          <p>
            <strong>CNPJ:</strong> {empresa?.cnpj || "-"}
          </p>

          <p>
            <strong>End.:</strong> {empresa?.endereco || "-"}
          </p>

          <p>
            <strong>Cidade/UF:</strong> {empresa?.cidade || "-"} / {empresa?.estado || "-"}
          </p>
        </div>

        <div className="text-right">
          <p>
            <strong>Tel:</strong> {empresa?.telefone || "-"}
          </p>

          <p>
            <strong>E-mail:</strong> {empresa?.email || "-"}
          </p>

          <p>
            <strong>Emitido:</strong>
          </p>

          <p>{new Date().toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200 text-center">
        <h2 className="text-base font-bold uppercase">
          {titulo}
        </h2>

        {(periodoInicio || periodoFim) && (
          <p>
            <strong>Período:</strong> {formatarData(periodoInicio)} até {formatarData(periodoFim)}
          </p>
        )}

        {extra && <p>{extra}</p>}
      </div>
    </div>
  )
}