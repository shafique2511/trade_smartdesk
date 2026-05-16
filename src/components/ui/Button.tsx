import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  icon?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary: 'border-gold-400/60 bg-gold-500 text-ink-950 hover:bg-gold-400',
  secondary: 'border-slate-700/80 bg-slate-900/80 text-slate-100 hover:border-gold-400/40 hover:bg-slate-800/90',
  ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white',
  danger: 'border-loss-500/40 bg-loss-500/10 text-red-200 hover:bg-loss-500/20',
}

export function Button({ children, className = '', icon, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      type="button"
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
