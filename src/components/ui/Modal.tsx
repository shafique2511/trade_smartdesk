import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

type ModalProps = {
  children: ReactNode
  isOpen: boolean
  title: string
  onClose: () => void
}

export function Modal({ children, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="glass-panel w-full max-w-lg rounded-lg p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <Button aria-label="Close modal" className="h-9 w-9 px-0" onClick={onClose} variant="ghost">
            <X size={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
