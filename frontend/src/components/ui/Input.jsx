export function Input({
  type = "text",
  placeholder = "",
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`
        border border-gray-300
        rounded-lg
        px-4 py-3
        w-full
        bg-white
        min-w-0 text-base md:text-sm
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-blue-500
        focus-visible:border-blue-500
        aria-invalid:border-red-500
        aria-invalid:ring-red-200
        disabled:bg-gray-100
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  )
}
