export function Table({ children, className = "" }) {
  return (
    <table
      className={`
        w-full text-sm border-collapse
        ${className}
      `}
    >
      {children}
    </table>
  )
}

export function Th({ children }) {
  return (
    <th className="text-left p-3 border-b bg-gray-100">
      {children}
    </th>
  )
}

export function Td({ children, className = "", ...props }) {
  return (
    <td
      className={`p-3 border-b ${className}`}
      {...props}
    >
      {children}
    </td>
  )
}