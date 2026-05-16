import type { ReactNode } from 'react'

export function Tooltip({ children, content }: { children: ReactNode; content: string }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-max max-w-64 -translate-x-1/2 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-200 shadow-xl group-hover:block group-focus-within:block">
        {content}
      </span>
    </span>
  )
}
