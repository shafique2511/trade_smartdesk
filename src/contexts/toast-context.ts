import { createContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type Toast = {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

export type ToastContextValue = {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)
