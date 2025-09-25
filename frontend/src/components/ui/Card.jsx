import React from 'react'

export default function Card({ title, subtitle, right, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-border bg-card shadow-sm ${className}`}>
      {(title || right || subtitle) && (
        <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            {title && <div className="text-slate-100 font-semibold">{title}</div>}
            {subtitle && <div className="text-slate-400 text-xs mt-0.5">{subtitle}</div>}
          </div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </div>
      )}
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  )
}
