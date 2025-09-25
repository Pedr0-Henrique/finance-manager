import React from 'react'

export default function Segmented({ options = [], value, onChange }) {
  return (
    <div className="inline-flex items-center rounded-lg bg-slate-900 border border-slate-700 p-1">
      {options.map((opt, i) => (
        <button
          key={opt.value ?? opt}
          onClick={() => onChange(opt.value ?? opt)}
          className={`${value === (opt.value ?? opt) ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:text-white'} px-3 py-1.5 rounded-md text-sm`}
        >
          {opt.label ?? opt}
        </button>
      ))}
    </div>
  )
}
