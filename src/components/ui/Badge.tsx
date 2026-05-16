import type { ReactNode } from 'react'

type BadgeTone = 'neutral' | 'gold' | 'profit' | 'loss' | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'border-slate-700 bg-slate-900 text-slate-300',
  gold: 'border-gold-400/40 bg-gold-500/10 text-gold-400',
  profit: 'border-profit-500/30 bg-profit-500/10 text-green-300',
  loss: 'border-loss-500/30 bg-loss-500/10 text-red-300',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}
