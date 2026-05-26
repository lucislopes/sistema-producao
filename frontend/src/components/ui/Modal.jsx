export function Modal({
  open,
  title,
  children,
  onClose,
  width = "max-w-2xl"
}) {
  if (!open) return null

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50 p-4
      "
    >
      <div
        className={`
          bg-white rounded-2xl shadow-xl
          w-full ${width}
          max-h-[90vh] overflow-auto
        `}
      >
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}