import React from 'react'

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-[95%] max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="text-slate-100 font-semibold">{title}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>
        <div className="p-4 sm:p-5">
          {children}
        </div>
        {footer && (
          <div className="px-4 sm:px-5 py-3 border-t border-border flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
