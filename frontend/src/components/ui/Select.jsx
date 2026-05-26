export function Select({
  value,
  onChange,
  children,
  className = "",
  disabled = false
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
        text-sm
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        disabled:bg-gray-100
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </select>
  )
}