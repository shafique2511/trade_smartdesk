export function LoadingState({ label = 'Loading workspace' }: { label?: string }) {
  return (
    <div className="glass-panel flex min-h-40 items-center justify-center gap-3 rounded-lg text-sm text-slate-300">
      <span className="h-3 w-3 animate-pulse rounded-full bg-gold-400" />
      {label}
    </div>
  )
}
