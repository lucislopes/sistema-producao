export function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  loading = false,
  className = "",
  ...props
}) {

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    dark: "bg-gray-800 hover:bg-gray-900 text-white"
  }

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-5 py-2 text-sm",
    lg: "px-6 py-3"
  }

  const variantClass = variants[String(variant).toLowerCase()] || variants.primary

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`
        inline-flex min-h-10 items-center justify-center gap-2 rounded-lg font-medium
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variantClass}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}
