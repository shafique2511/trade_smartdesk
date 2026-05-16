import type { HTMLAttributes } from 'react'

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean
}

export function GlassCard({ children, className = '', padded = true, ...props }: GlassCardProps) {
  return (
    <div className={`glass-panel rounded-lg ${padded ? 'p-5' : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}
