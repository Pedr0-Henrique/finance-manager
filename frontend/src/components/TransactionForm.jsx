import React, { useState } from 'react'
import { api } from '../services/api'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

export default function TransactionForm({ categories, onSaved }) {
  const [form, setForm] = useState({ type: 'expense', amount: '', description: '', date: new Date().toISOString().slice(0,10), category_id: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, amount: Number(form.amount) }
      if (!payload.category_id) delete payload.category_id
      await api.post('/transactions', payload)
      setForm(f => ({ ...f, amount: '', description: '' }))
      onSaved && onSaved()
      toast.success('Transação salva')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Tipo</label>
          <select required className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.type} onChange={e=>setForm(f=>({...f, type:e.target.value}))}>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Valor</label>
          <input required type="number" step="0.01" className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Data</label>
          <input required type="date" className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Categoria</label>
          <select className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.category_id} onChange={e=>setForm(f=>({...f, category_id:e.target.value}))}>
            <option value="">Sem categoria</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm text-slate-300 mb-1">Descrição</label>
        <input type="text" className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.description} onChange={e=>setForm(f=>({...f, description:e.target.value}))} />
      </div>
      <div className="mt-4">
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 inline-flex items-center gap-2">
          <Check size={16} /> Salvar
        </button>
      </div>
    </form>
  )
}
