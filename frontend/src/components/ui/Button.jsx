export function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  className = ""
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

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg font-medium
        transition
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}