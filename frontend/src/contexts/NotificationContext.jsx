import { useEffect, useRef, useState } from "react"
import { CircleCheck, Info, TriangleAlert, X } from "lucide-react"
import { identificarTipoNotificacao } from "../utils/notificationType"

const estilos = {
  sucesso: {
    caixa: "border-green-200 bg-green-50 text-green-900",
    icon: CircleCheck,
    iconClass: "text-green-600"
  },
  aviso: {
    caixa: "border-amber-200 bg-amber-50 text-amber-900",
    icon: TriangleAlert,
    iconClass: "text-amber-600"
  },
  erro: {
    caixa: "border-red-200 bg-red-50 text-red-900",
    icon: TriangleAlert,
    iconClass: "text-red-600"
  },
  info: {
    caixa: "border-blue-200 bg-blue-50 text-blue-900",
    icon: Info,
    iconClass: "text-blue-600"
  }
}

export function NotificationProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([])
  const proximoId = useRef(1)
  const temporizadores = useRef(new Set())

  function remover(id) {
    setNotificacoes((atuais) => atuais.filter((item) => item.id !== id))
  }

  useEffect(() => {
    const alertOriginal = window.alert

    window.alert = (mensagem) => {
      const id = proximoId.current++
      const texto = String(mensagem ?? "")

      setNotificacoes((atuais) => [
        ...atuais.slice(-3),
        { id, mensagem: texto, tipo: identificarTipoNotificacao(texto) }
      ])

      const temporizador = window.setTimeout(() => {
        remover(id)
        temporizadores.current.delete(temporizador)
      }, 5000)

      temporizadores.current.add(temporizador)
    }

    return () => {
      window.alert = alertOriginal
      temporizadores.current.forEach((temporizador) => window.clearTimeout(temporizador))
      temporizadores.current.clear()
    }
  }, [])

  return (
    <>
      {children}

      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:w-full sm:max-w-sm"
        aria-label="Notificações do sistema"
      >
        {notificacoes.map((notificacao) => {
          const estilo = estilos[notificacao.tipo] || estilos.info
          const Icon = estilo.icon

          return (
            <div
              key={notificacao.id}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg ${estilo.caixa}`}
              role={notificacao.tipo === "erro" ? "alert" : "status"}
            >
              <Icon className={`mt-0.5 shrink-0 ${estilo.iconClass}`} size={20} aria-hidden="true" />
              <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed">
                {notificacao.mensagem}
              </p>
              <button
                type="button"
                onClick={() => remover(notificacao.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
                aria-label="Fechar notificação"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
