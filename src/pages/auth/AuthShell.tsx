import type { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'

type AuthShellProps = {
  children: ReactNode
  eyebrow: string
  title: string
  description: string
}

export function AuthShell({ children, description, eyebrow, title }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-lg border border-slate-800 bg-ink-950/80 shadow-2xl lg:grid-cols-[1fr_0.9fr]">
        <div className="flex min-h-[520px] flex-col justify-between border-b border-slate-800 bg-slate-950/60 p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold-400/40 bg-gold-500/10 text-gold-400">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="font-bold text-white">Trading SmartDesk</p>
              <p className="text-xs text-slate-500">All-in-one trading command center</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-400">{eyebrow}</p>
            <h1 className="mt-4 max-w-xl text-4xl font-bold tracking-tight text-white">{title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            This platform is for trade planning, journaling, and risk management only. It does not provide financial advice.
          </p>
        </div>
        <div className="flex items-center p-6 md:p-10">{children}</div>
      </section>
    </main>
  )
}
