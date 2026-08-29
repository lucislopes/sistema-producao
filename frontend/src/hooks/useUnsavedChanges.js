import { useCallback, useEffect, useRef } from "react"

const MENSAGEM_PADRAO = "Existem alterações não salvas. Deseja sair e descartar essas alterações?"

export function useUnsavedChanges(ativo, mensagem = MENSAGEM_PADRAO) {
  const ativoRef = useRef(ativo)
  const mensagemRef = useRef(mensagem)

  useEffect(() => {
    ativoRef.current = ativo
    mensagemRef.current = mensagem
  }, [ativo, mensagem])

  const confirmarDescarte = useCallback(() => {
    if (!ativoRef.current) return true
    return window.confirm(mensagemRef.current)
  }, [])

  useEffect(() => {
    function protegerFechamento(event) {
      if (!ativoRef.current) return
      event.preventDefault()
      event.returnValue = ""
    }

    function protegerLinks(event) {
      if (!ativoRef.current || event.defaultPrevented || event.button !== 0) return

      const link = event.target.closest?.("a[href]")
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return

      const destino = new URL(link.href, window.location.href)
      if (destino.href === window.location.href) return

      if (!window.confirm(mensagemRef.current)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener("beforeunload", protegerFechamento)
    document.addEventListener("click", protegerLinks, true)

    return () => {
      window.removeEventListener("beforeunload", protegerFechamento)
      document.removeEventListener("click", protegerLinks, true)
    }
  }, [])

  return confirmarDescarte
}
