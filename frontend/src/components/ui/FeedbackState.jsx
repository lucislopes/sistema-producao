import { Inbox, LoaderCircle, RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "./Button"

export function LoadingState({ mensagem = "Carregando informações..." }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" role="status">
      <div className="text-center">
        <LoaderCircle className="mx-auto mb-3 animate-spin text-blue-600" size={34} aria-hidden="true" />
        <p className="font-medium text-gray-700">{mensagem}</p>
        <span className="sr-only">Aguarde</span>
      </div>
    </div>
  )
}

export function ErrorState({
  titulo = "Não foi possível carregar as informações",
  descricao = "Verifique sua conexão e tente novamente.",
  onRetry
}) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
      <div className="max-w-md text-center">
        <TriangleAlert className="mx-auto mb-3 text-red-600" size={36} aria-hidden="true" />
        <h2 className="text-lg font-bold text-red-900">{titulo}</h2>
        <p className="mt-1 text-sm text-red-700">{descricao}</p>
        {onRetry && (
          <Button type="button" onClick={onRetry} className="mt-4">
            <RotateCcw size={16} aria-hidden="true" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({
  titulo = "Nenhum resultado encontrado",
  descricao = "Altere os filtros ou tente novamente mais tarde.",
  compact = false
}) {
  return (
    <div className={`text-center ${compact ? "px-4 py-6" : "rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10"}`}>
      <Inbox className="mx-auto mb-2 text-gray-400" size={compact ? 28 : 36} aria-hidden="true" />
      <p className="font-semibold text-gray-700">{titulo}</p>
      {descricao && <p className="mt-1 text-sm text-gray-500">{descricao}</p>}
    </div>
  )
}
