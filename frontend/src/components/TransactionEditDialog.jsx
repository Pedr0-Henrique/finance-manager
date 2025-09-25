import React, { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from './ui/Button'

export default function TransactionEditDialog({ open, onClose, transaction, categories, onSave }) {
  const [form, setForm] = useState(transaction || {})
  useEffect(() => setForm(transaction || {}), [transaction])

  const handleSave = () => {
    onSave && onSave({ ...form, amount: Number(form.amount) })
  }

  if (!form) return null

  return (
    <Dialog.Root open={open} onOpenChange={(v)=>{ if(!v) onClose && onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-0 shadow-xl focus:outline-none">
          <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center justify-between">
            <Dialog.Title className="text-slate-100 font-semibold">Editar transação</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-slate-200">✕</button>
            </Dialog.Close>
          </div>
          <div className="p-4 sm:p-5">
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Tipo</label>
                <select required className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.type || ''} onChange={e=>setForm(f=>({...f, type:e.target.value}))}>
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Valor</label>
                <input required type="number" step="0.01" className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.amount || ''} onChange={e=>setForm(f=>({...f, amount:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Data</label>
                <input required type="date" className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.date || ''} onChange={e=>setForm(f=>({...f, date:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Descrição</label>
                <input type="text" className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.description || ''} onChange={e=>setForm(f=>({...f, description:e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Categoria</label>
                <select className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={form.category_id || ''} onChange={e=>setForm(f=>({...f, category_id:e.target.value}))}>
                  <option value="">Sem categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-5 py-3 border-t border-border flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
            </Dialog.Close>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
