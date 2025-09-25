import React, { useMemo, useState, useEffect } from 'react'
import { api } from '../services/api'
import TransactionEditDialog from './TransactionEditDialog'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export default function TransactionsTable({ transactions, categories = [], onChanged }) {
  const [filter, setFilter] = useState({ type: '', q: '', date_from: '', date_to: '', category_id: '', paid: '' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState('date') // 'date' | 'amount' | 'id'
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)

  const queryKey = useMemo(() => ['transactions', { filter, page, pageSize, sortBy, sortDir }], [filter, page, pageSize, sortBy, sortDir])
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('page_size', String(pageSize))
      params.set('sort_by', sortBy)
      params.set('sort_dir', sortDir)
      if (filter.type) params.set('type', filter.type)
      if (filter.q) params.set('q', filter.q)
      if (filter.date_from) params.set('date_from', filter.date_from)
      if (filter.date_to) params.set('date_to', filter.date_to)
      if (filter.category_id) params.set('category_id', filter.category_id)
      if (filter.paid !== '') params.set('paid', filter.paid)
      const res = await api.get(`/transactions?${params.toString()}`)
      return res.data // { data, pagination }
    },
    keepPreviousData: true,
  })

  const rows = data?.data || []
  const pagination = data?.pagination || { page: 1, page_size: pageSize, total: rows.length, total_pages: 1 }

  const filtered = rows // server already filters q

  const togglePaid = async (id, nextVal) => {
    try {
      await api.patch(`/transactions/${id}/paid`, { paid: nextVal ? 1 : 0 })
      toast.success(nextVal ? 'Marcado como pago' : 'Marcado como pendente')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      onChanged && onChanged()
    } catch (e) {
      toast.error('Falha ao atualizar pago')
    }
  }

  const remove = async (id) => {
    if (!confirm('Excluir transação?')) return
    try {
      await api.delete(`/transactions/${id}`)
      toast.success('Transação excluída')
      qc.invalidateQueries({ queryKey: ['transactions'] })
      onChanged && onChanged()
    } catch (e) {
      toast.error('Falha ao excluir')
    }
  }

  const saveEdit = async (data) => {
    try {
      await api.put(`/transactions/${editing.id}`, data)
      toast.success('Transação atualizada')
      setEditing(null)
      qc.invalidateQueries({ queryKey: ['transactions'] })
      onChanged && onChanged()
    } catch (e) {
      toast.error('Falha ao atualizar')
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Tipo</label>
          <select className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={filter.type} onChange={e=>setFilter(f=>({...f, type:e.target.value}))}>
            <option value="">Todos</option>
            <option value="income">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Categoria</label>
          <select className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={filter.category_id} onChange={e=>setFilter(f=>({...f, category_id:e.target.value}))}>
            <option value="">Todas</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">De</label>
          <input type="date" className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={filter.date_from} onChange={e=>setFilter(f=>({...f, date_from:e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Até</label>
          <input type="date" className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={filter.date_to} onChange={e=>setFilter(f=>({...f, date_to:e.target.value}))} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-300 mb-1">Buscar descrição</label>
          <input type="text" placeholder="Digite para buscar..." className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={filter.q} onChange={e=>setFilter(f=>({...f, q:e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Status</label>
          <select className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" value={filter.paid} onChange={e=>setFilter(f=>({...f, paid:e.target.value}))}>
            <option value="">Todos</option>
            <option value="0">Pendentes</option>
            <option value="1">Pagos</option>
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button className="px-3 py-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-sm" onClick={()=>setFilter({ type:'', q:'', date_from:'', date_to:'', category_id:'' })}>Limpar filtros</button>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <label className="text-slate-400">Ordenar por</label>
          <select className="bg-slate-900 border border-border rounded-md px-2 py-1" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="date">Data</option>
            <option value="amount">Valor</option>
            <option value="id">ID</option>
          </select>
          <select className="bg-slate-900 border border-border rounded-md px-2 py-1" value={sortDir} onChange={e=>setSortDir(e.target.value)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="text-left text-slate-300 border-b border-border">
              <th className="py-2 pr-2">Data</th>
              <th className="py-2 pr-2">Descrição</th>
              <th className="py-2 pr-2">Categoria</th>
              <th className="py-2 pr-2 text-right">Valor</th>
              <th className="py-2 pr-2">Tipo</th>
              <th className="py-2 pr-2 text-center">Pago</th>
              <th className="py-2 pr-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="py-6 text-center text-slate-400">Carregando...</td></tr>
            )}
            {!isLoading && filtered.map(t => (
              <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-900/40">
                <td className="py-2 pr-2 align-top">{t.date}</td>
                <td className="py-2 pr-2 align-top">{t.description}</td>
                <td className="py-2 pr-2 align-top">
                  {t.category_name ? (
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded text-white" style={{ background: t.category_color || '#1e293b' }}>{t.category_name}</span>
                  ) : '-'}
                </td>
                <td className="py-2 pr-2 text-right align-top">{Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="py-2 pr-2 align-top">
                  <span className={`px-2 py-1 rounded text-xs ${t.type === 'income' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-700/40' : 'bg-rose-600/20 text-rose-400 border border-rose-700/40'}`}>
                    {t.type === 'income' ? 'Receita' : 'Despesa'}
                  </span>
                </td>
                <td className="py-2 pr-2 text-center align-top">
                  <input type="checkbox" checked={!!t.paid} onChange={e=>togglePaid(t.id, e.target.checked)} />
                </td>
                <td className="py-2 pr-2 text-right align-top">
                  <div className="inline-flex gap-2">
                    <button className="px-2 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white inline-flex items-center gap-1" onClick={() => setEditing(t)}>
                      <Pencil size={16} /> Editar
                    </button>
                    <button className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center gap-1" onClick={() => remove(t.id)}>
                      <Trash2 size={16} /> Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="text-slate-400">Página {pagination.page} de {pagination.total_pages} • {pagination.total} itens</div>
        <div className="flex items-center gap-2">
          <label className="text-slate-400">Itens por página</label>
          <select className="bg-slate-900 border border-border rounded-md px-2 py-1" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}>
            {[10,20,25,50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200" disabled={pagination.page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>Anterior</button>
          <button className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200" disabled={pagination.page >= pagination.total_pages} onClick={() => setPage(p => p+1)}>Próxima</button>
        </div>
      </div>

      <TransactionEditDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        transaction={editing}
        categories={categories}
        onSave={saveEdit}
      />
    </div>
  )
}
