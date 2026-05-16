import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { Button } from './Button'

const toneClass = {
  success: 'border-profit-500/30 bg-profit-500/10 text-green-100',
  error: 'border-loss-500/30 bg-loss-500/10 text-red-100',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function Toaster() {
  const { dismissToast, toasts } = useToast()

  return (
    <div className="fixed right-4 top-4 z-[70] grid w-[calc(100vw-2rem)] max-w-sm gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.tone]
        return (
          <div className={`glass-panel rounded-lg border p-4 shadow-2xl ${toneClass[toast.tone]}`} key={toast.id}>
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 shrink-0" size={18} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm leading-5 opacity-85">{toast.description}</p> : null}
              </div>
              <Button aria-label="Dismiss notification" className="h-7 w-7 px-0" onClick={() => dismissToast(toast.id)} variant="ghost">
                <X size={14} />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
