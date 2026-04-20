import React from 'react'

interface Column<T> {
  key: string
  label: string
  className?: string
  hidden?: 'sm' | 'md'
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  emptyIcon?: string
  emptyText?: string
  emptyAction?: React.ReactNode
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyIcon,
  emptyText,
  emptyAction,
  onRowClick,
}: DataTableProps<T>) {
  const hiddenClass = (hidden?: 'sm' | 'md') => {
    if (hidden === 'sm') return 'hidden sm:table-cell'
    if (hidden === 'md') return 'hidden md:table-cell'
    return ''
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F0EDE8] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={[
                  'text-left px-5 py-3 text-xs font-bold text-[#8B6550] uppercase tracking-wider border-b border-[#F0EDE8]',
                  hiddenClass(col.hidden),
                  col.className ?? '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center">
                {emptyIcon && <div className="text-4xl mb-3">{emptyIcon}</div>}
                {emptyText && (
                  <p className="text-[#8B6550] font-semibold mb-4">{emptyText}</p>
                )}
                {emptyAction && <div>{emptyAction}</div>}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={keyExtractor(row)}
                className={[
                  'border-b border-[#F0EDE8] last:border-0 hover:bg-[#FFFCF8] transition-colors',
                  onRowClick ? 'cursor-pointer' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={['px-5 py-4', hiddenClass(col.hidden)]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
