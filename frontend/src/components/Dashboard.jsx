import React, { useMemo, useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts'
import Card from './ui/Card'
import Segmented from './ui/Segmented'
import dayjs from 'dayjs'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'

function Trend({ pct }) {
  const up = pct >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const pctAbs = Math.abs(pct).toFixed(1)
  return (
    <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${up ? 'text-emerald-400 border-emerald-700/40 bg-emerald-600/10' : 'text-rose-400 border-rose-700/40 bg-rose-600/10'}`}>
      <Icon size={14} /> {up ? '+' : '-'}{pctAbs}%
    </div>
  )
}

function CardStat({ title, value, color, trendPct, subtext }) {
  return (
    <Card>
      <div className="text-slate-400 text-xs">{title}</div>
      <div className="text-2xl font-bold" style={{ color: color || '#e2e8f0' }}>
        {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Trend pct={trendPct} />
        {subtext && <div className="text-slate-400 text-xs">{subtext}</div>}
      </div>
    </Card>
  )
}

export default function Dashboard({ transactions }) {
  const [catMode, setCatMode] = useState('expense') 
  const [months, setMonths] = useState(12)
  const { income, expense, expensePending, balance, expenseByCategory, incomeByCategory, trendIncome, trendExpensePending } = useMemo(() => {
    let income = 0, expense = 0
    let expensePending = 0
    const byCatExpense = {}
    const byCatIncome = {}
  
    const now = dayjs()
    const startCurrent = now.subtract(30, 'day')
    const startPrev = now.subtract(60, 'day')
    let curInc = 0, curExp = 0, prevInc = 0, prevExp = 0
    for (const t of transactions) {
      if (t.type === 'income') income += Number(t.amount)
      if (t.type === 'expense') {
        expense += Number(t.amount)
        const key = t.category_name || 'Sem categoria'
        byCatExpense[key] = (byCatExpense[key] || 0) + Number(t.amount)
        if (!t.paid) expensePending += Number(t.amount)
      }
      if (t.type === 'income') {
        const key = t.category_name || 'Sem categoria'
        byCatIncome[key] = (byCatIncome[key] || 0) + Number(t.amount)
      }
      const d = dayjs(t.date)
      if (d.isAfter(startCurrent)) {
        if (t.type === 'income') curInc += Number(t.amount)
        if (t.type === 'expense' && !t.paid) curExp += Number(t.amount)
      } else if (d.isAfter(startPrev) && d.isBefore(startCurrent)) {
        if (t.type === 'income') prevInc += Number(t.amount)
        if (t.type === 'expense' && !t.paid) prevExp += Number(t.amount)
      }
    }
    const expenseByCategory = Object.entries(byCatExpense).map(([name, value]) => ({ name, value }))
    const incomeByCategory = Object.entries(byCatIncome).map(([name, value]) => ({ name, value }))
    const pct = (cur, prev) => prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100
    const trendIncome = pct(curInc, prevInc)
    const trendExpensePending = pct(curExp, prevExp)
    return { income, expense, expensePending, balance: income - expense, expenseByCategory, incomeByCategory, trendIncome, trendExpensePending }
  }, [transactions])

 
  const { data: tsRaw } = useQuery({
    queryKey: ['timeseries', months],
    queryFn: async () => {
      const res = await api.get(`/reports/timeseries?months=${months}`)
      return res.data
    }
  })
  const seriesData = useMemo(() => {
    if (!Array.isArray(tsRaw)) return []
    return tsRaw.map(r => ({
      name: r.ym,
      Receitas: Number(r.income || 0),
      Despesas: Number(r.expense || 0),
      Saldo: Number(r.balance || 0),
    }))
  }, [tsRaw])


  const projectedExpense = useMemo(() => {
    if (!seriesData.length) return null
    const avg = seriesData.reduce((s, p) => s + (Number(p.Despesas) || 0), 0) / seriesData.length
    return avg * months
  }, [seriesData, months])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CardStat title="Receitas" value={income} color="#00e676" trendPct={trendIncome} subtext="Últimos 30 dias" />
      <CardStat title="Despesas pendentes" value={expensePending} color="#ff5252" trendPct={trendExpensePending} subtext="Últimos 30 dias (não pagos)" />
      <CardStat title="Saldo" value={balance} color="#40c4ff" trendPct={trendIncome - trendExpensePending} subtext="Receitas - Despesas" />

      <div className="md:col-span-2">
        <Card title="Por categoria" subtitle={catMode === 'expense' ? 'Despesas' : 'Receitas'} right={
          <Segmented options={[{label:'Despesas', value:'expense'},{label:'Receitas', value:'income'}]} value={catMode} onChange={setCatMode} />
        }>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="fgPie" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22d3ee"/>
                    <stop offset="100%" stopColor="#0ea5e9"/>
                  </linearGradient>
                </defs>
                <Pie
                  data={catMode === 'expense' ? expenseByCategory : incomeByCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  cornerRadius={6}
                >
                  {(catMode === 'expense' ? expenseByCategory : incomeByCategory).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#22c55e","#06b6d4","#8b5cf6","#eab308","#ef4444","#14b8a6","#f97316","#3b82f6","#a3e635"][index % 9]} stroke="#0b1020" />
                  ))}
                </Pie>
                <RTooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0]
                  return (
                    <div className="rounded-md border border-border bg-slate-900/95 backdrop-blur px-3 py-2 text-xs text-slate-200 shadow">
                      <div className="font-medium">{p.payload.name}</div>
                      <div className="opacity-80">{Number(p.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                  )
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {(catMode === 'expense' ? expenseByCategory : incomeByCategory).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(catMode === 'expense' ? expenseByCategory : incomeByCategory).slice(0,6).map((s, i) => (
                <span key={s.name} className="inline-flex items-center gap-2 rounded-full border border-border bg-slate-900 px-2 py-1 text-xs text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: ["#22c55e","#06b6d4","#8b5cf6","#eab308","#ef4444","#14b8a6","#f97316","#3b82f6","#a3e635"][i % 9] }} />
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="md:col-span-1">
        <Card title="Totais" subtitle="Receitas x Despesas x Saldo" right={
          <Segmented options={[{label:'6m', value:6},{label:'12m', value:12},{label:'24m', value:24}]} value={months} onChange={setMonths} />
        }>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={seriesData.length ? seriesData : [{ name: 'Totais', Receitas: income, Despesas: expense, Saldo: balance }]}>
                <defs>
                  <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2a44" />
                <XAxis dataKey="name" stroke="#9fb3c8" tickLine={false} axisLine={false} />
                <YAxis stroke="#9fb3c8" tickLine={false} axisLine={false} />
                <Legend />
                <RTooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="rounded-md border border-border bg-slate-900/95 backdrop-blur px-3 py-2 text-xs text-slate-200 shadow">
                      {payload.map((p) => (
                        <div key={p.dataKey} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                          <span>{p.dataKey}: {Number(p.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      ))}
                    </div>
                  )
                }} />
                <Area type="monotone" dataKey="Receitas" stroke="#22c55e" fill="url(#gInc)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="Despesas" stroke="#ef4444" fill="url(#gExp)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="Saldo" stroke="#38bdf8" fill="url(#gBal)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {projectedExpense != null && (
            <div className="mt-3 text-sm text-slate-300">
              Despesa projetada em <span className="font-medium text-slate-100">{months} meses</span>: 
              <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-md border border-rose-700/40 bg-rose-600/10 text-rose-300">
                {projectedExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
