import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export function Input({ className = '', label, ...props }: InputProps) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span> : null}
      <input
        className={`min-h-11 w-full rounded-lg border border-slate-700/80 bg-slate-950/50 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-gold-400/70 focus:ring-2 focus:ring-gold-400/10 ${className}`}
        {...props}
      />
    </label>
  )
}
