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
        text-sm
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        disabled:bg-gray-100
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  )
}