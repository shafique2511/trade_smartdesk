import { useCallback, useMemo, useState } from 'react'
import { ToastContext, type Toast } from './toast-context'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((current) => [{ ...toast, id }, ...current].slice(0, 4))
    window.setTimeout(() => dismissToast(id), 4500)
  }, [dismissToast])

  const value = useMemo(() => ({ dismissToast, showToast, toasts }), [dismissToast, showToast, toasts])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
