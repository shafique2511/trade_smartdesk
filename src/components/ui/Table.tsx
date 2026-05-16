import type { ReactNode } from 'react'

type TableProps = {
  columns: string[]
  rows: ReactNode[][]
}

export function Table({ columns, rows }: TableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3 font-semibold" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-950/20 text-slate-300">
            {rows.map((row, rowIndex) => (
              <tr className="hover:bg-slate-900/50" key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td className="whitespace-nowrap px-4 py-3" key={`${rowIndex}-${cellIndex}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
