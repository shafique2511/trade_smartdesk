import type { TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
}

export function Textarea({ className = '', label, ...props }: TextareaProps) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span> : null}
      <textarea
        className={`min-h-28 w-full rounded-lg border border-slate-700/80 bg-slate-950/50 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-gold-400/70 focus:ring-2 focus:ring-gold-400/10 ${className}`}
        {...props}
      />
    </label>
  )
}
