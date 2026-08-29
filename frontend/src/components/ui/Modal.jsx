import { useEffect, useId, useRef } from "react"

export function Modal({
  open,
  title,
  children,
  onClose,
  width = "max-w-2xl"
}) {
  const titleId = useId()
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previousElement = document.activeElement
    closeButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.()
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previousElement?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50 p-4
      "
      role="presentation"
    >
      <div
        className={`
          bg-white rounded-2xl shadow-xl
          w-full ${width}
          max-h-[90vh] overflow-auto
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex justify-between items-center p-5 border-b">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Fechar janela"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
