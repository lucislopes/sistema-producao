export function Table({ children, className = "" }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table
        className={`
          w-full text-sm border-collapse
          ${className}
        `}
      >
        {children}
      </table>
    </div>
  )
}

export function Th({
  children,
  className = "",
  ...props
}) {
  return (
    <th
      className={`
        text-left
        px-3
        py-2
        border-b
        bg-gray-100
        uppercase
        text-xs
        tracking-wide
        font-semibold
        text-gray-700
        ${className}
      `}
      {...props}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className = "",
  ...props
}) {
  return (
    <td
      className={`
        px-3
        py-2
        border-b
        ${className}
      `}
      {...props}
    >
      {children}
    </td>
  )
}
