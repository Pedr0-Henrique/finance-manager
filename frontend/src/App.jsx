import React, { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard'
import TransactionsTable from './components/TransactionsTable'
import TransactionForm from './components/TransactionForm'
import CategoryManager from './components/CategoryManager'
import Reports from './components/Reports'
import { api } from './services/api'

export default function App() {
  const [tab, setTab] = useState(0)
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [reload, setReload] = useState(0)

  const loadAll = async () => {
    const [catsRes, txRes] = await Promise.all([
      api.get('/categories'),
      api.get('/transactions')
    ])
    setCategories(catsRes.data)
    setTransactions(txRes.data)
  }

  useEffect(() => { loadAll() }, [reload])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Navbar */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-slate-900/70 border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 grid place-items-center shadow ring-1 ring-sky-500/30">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M4 12h10a4 4 0 1 0 0-8H8a4 4 0 0 0 0 8Zm0 0h12a4 4 0 1 1 0 8H10a4 4 0 1 1 0-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-extrabold tracking-tight text-slate-100 text-lg">Finance Manager</span>
          </div>
          <nav className="hidden sm:flex gap-2">
            {['Dashboard','Transações','Nova Transação','Categorias','Relatórios'].map((label, idx) => (
              <button
                key={label}
                onClick={() => setTab(idx)}
                className={`px-3 py-2 rounded-md text-sm ${tab===idx ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >{label}</button>
            ))}
          </nav>
          <div className="sm:hidden">
            <select className="bg-slate-900 border border-slate-700 text-slate-200 rounded-md px-2 py-1" value={tab} onChange={e=>setTab(Number(e.target.value))}>
              <option value={0}>Dashboard</option>
              <option value={1}>Transações</option>
              <option value={2}>Nova Transação</option>
              <option value={3}>Categorias</option>
              <option value={4}>Relatórios</option>
            </select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === 0 && (
          <Dashboard transactions={transactions} />
        )}
        {tab === 1 && (
          <TransactionsTable transactions={transactions} categories={categories} onChanged={() => setReload(x=>x+1)} />
        )}
        {tab === 2 && (
          <TransactionForm categories={categories} onSaved={() => setReload(x=>x+1)} />
        )}
        {tab === 3 && (
          <CategoryManager categories={categories} onChanged={() => setReload(x=>x+1)} />
        )}
        {tab === 4 && (
          <Reports />
        )}
      </main>
    </div>
  )
}
