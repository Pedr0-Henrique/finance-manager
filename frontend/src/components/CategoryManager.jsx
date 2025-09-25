import React, { useState } from 'react'
import { api } from '../services/api'
import { Button } from './ui/Button'

export default function CategoryManager({ categories, onChanged }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#1e293b')
  const [editingId, setEditingId] = useState(null)
  const [editing, setEditing] = useState({ name: '', color: '' })

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    await api.post('/categories', { name, color })
    setName('')
    onChanged && onChanged()
  }

  const startEdit = (c) => {
    setEditingId(c.id)
    setEditing({ name: c.name, color: c.color || '#1e293b' })
  }

  const saveEdit = async (id) => {
    await api.put(`/categories/${id}`, editing)
    setEditingId(null)
    onChanged && onChanged()
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <form onSubmit={add} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-sm text-slate-300 mb-1">Nome da categoria</label>
          <input required className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Cor</label>
          <input type="color" className="w-full h-[42px] bg-slate-900 border border-border rounded-md px-1" value={color} onChange={e=>setColor(e.target.value)} />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit">Adicionar</Button>
        </div>
      </form>

      <div className="mt-4 divide-y divide-slate-800">
        {categories.map(c => (
          <div key={c.id} className="py-3 flex items-center justify-between gap-3">
            {editingId === c.id ? (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input className="bg-slate-900 border border-border rounded-md px-3 py-2" placeholder="Nome" value={editing.name} onChange={e=>setEditing(s=>({...s, name:e.target.value}))} />
                <input type="color" className="w-full h-[42px] bg-slate-900 border border-border rounded-md px-1" value={editing.color} onChange={e=>setEditing(s=>({...s, color:e.target.value}))} />
                <div className="flex items-center gap-2">
                  <Button variant="success" onClick={() => saveEdit(c.id)}>Salvar</Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-3">
                <span className="inline-block h-4 w-4 rounded" style={{ background: c.color || '#1e293b' }} />
                <div>
                  <div className="text-slate-200 font-medium">{c.name}</div>
                  <div className="text-slate-400 text-xs">{c.color}</div>
                </div>
              </div>
            )}
            {editingId !== c.id && (
              <div className="shrink-0">
                <Button variant="outline" onClick={() => startEdit(c)}>Editar</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
