export function Table({
  children,
  className = "",
  label = "Tabela de dados"
}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 sm:hidden no-print">
        <span aria-hidden="true">↔</span>
        Deslize para o lado para ver todas as colunas
      </p>

      <div
        className="max-w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 print:overflow-visible print:border-0 print:shadow-none"
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        <table
          className={`
            w-full min-w-max text-sm border-collapse print:min-w-0
            [&_tbody_tr]:transition-colors
            [&_tbody_tr:hover]:bg-blue-50/60
            ${className}
          `}
        >
          {children}
        </table>
      </div>
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
        border-b border-gray-200
        bg-gray-100
        uppercase
        text-xs
        tracking-wide
        font-semibold
        text-gray-700
        whitespace-nowrap
        sticky top-0 z-10 print:static
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
        border-b border-gray-200
        align-top
        ${className}
      `}
      {...props}
    >
      {children}
    </td>
  )
}
