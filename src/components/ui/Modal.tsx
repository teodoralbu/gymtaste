'use client'

import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
        }}
        aria-label="Close modal"
      />

      {/* Panel */}
      <div
        className={`relative w-full ${maxWidth} bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-[#666] hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2A2A2A]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
