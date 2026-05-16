export function LoadingState({ label = 'Loading workspace' }: { label?: string }) {
  return (
    <div className="glass-panel flex min-h-40 items-center justify-center rounded-lg text-sm text-slate-300">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
        <span>{label}</span>
      </div>
    </div>
  )
}
