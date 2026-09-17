export function Select({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <select
      value={value}
      onChange={onChange}
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
        disabled:bg-gray-100
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {children}
    </select>
  )
}
