import React from 'react'

export default function ExportButtons({ onCSV, onPDF }) {
  return (
    <div className="inline-flex items-center rounded-lg bg-slate-900 border border-slate-700 p-1">
      <button onClick={onCSV} className="px-3 py-1.5 rounded-md text-sm text-slate-200 hover:bg-slate-800">CSV</button>
      <button onClick={onPDF} className="px-3 py-1.5 rounded-md text-sm text-slate-200 hover:bg-slate-800">PDF</button>
    </div>
  )
}
