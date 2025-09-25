import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import Card from './ui/Card'
import ExportButtons from './ExportButtons'

export default function Reports() {
  const [df, setDf] = useState('')
  const [dt, setDt] = useState('')
  const [data, setData] = useState(null)

  const load = async () => {
    const params = new URLSearchParams()
    if (df) params.set('date_from', df)
    if (dt) params.set('date_to', dt)
    const res = await api.get(`/reports/summary?${params.toString()}`)
    setData(res.data)
  }

  useEffect(() => { load() }, [])

  const exportCSV = () => {
    if (!data) return
    let csv = 'Categoria,Receitas,Despesas,Saldo,PercentualDespesa(%)\n'
    const totalExpense = data.expense || 0
    data.by_category.forEach(r => {
      const saldo = Number(r.income) - Number(r.expense)
      const perc = totalExpense > 0 ? (Number(r.expense) / totalExpense) * 100 : 0
      csv += `${r.name},${Number(r.income)},${Number(r.expense)},${saldo},${perc.toFixed(2)}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'relatorio.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    if (!data) return
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Relatório Financeiro', 14, 16)
    doc.setFontSize(10)
    const period = `${df ? `De ${df} ` : ''}${dt ? `Até ${dt}` : ''}`.trim()
    if (period) doc.text(period, 14, 22)

    doc.setFontSize(12)
    doc.text(`Receitas: R$ ${Number(data.income).toFixed(2)}`, 14, 32)
    doc.text(`Despesas: R$ ${Number(data.expense).toFixed(2)}`, 14, 38)
    doc.text(`Saldo: R$ ${Number(data.balance).toFixed(2)}`, 14, 44)

    const totalExpense = data.expense || 0
    const rows = data.by_category.map(r => {
      const saldo = Number(r.income) - Number(r.expense)
      const perc = totalExpense > 0 ? (Number(r.expense) / totalExpense) * 100 : 0
      return [
        r.name,
        Number(r.income).toFixed(2),
        Number(r.expense).toFixed(2),
        saldo.toFixed(2),
        `${perc.toFixed(2)}%`
      ]
    })
    doc.autoTable({
      startY: 52,
      head: [['Categoria', 'Receitas', 'Despesas', 'Saldo', '% Despesa']],
      body: rows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [64, 196, 255] }
    })

    doc.save('relatorio.pdf')
  }

  return (
    <div className="space-y-4">
      <Card title="Relatórios" right={
        <div className="flex items-center gap-2">
          <ExportButtons onCSV={exportCSV} onPDF={exportPDF} />
          <button onClick={load} className="px-3 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm">Atualizar</button>
        </div>
      }>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">De</label>
            <input type="date" value={df} onChange={e=>setDf(e.target.value)} className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Até</label>
            <input type="date" value={dt} onChange={e=>setDt(e.target.value)} className="w-full bg-slate-900 border border-border rounded-md px-3 py-2" />
          </div>
        </div>
      </Card>

      {data && (
        <>
          <Card title="Totais">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-300 border-b border-border">
                    <th className="py-2 pr-2">Receitas</th>
                    <th className="py-2 pr-2">Despesas</th>
                    <th className="py-2 pr-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-2 pr-2">R$ {Number(data.income).toFixed(2)}</td>
                    <td className="py-2 pr-2">R$ {Number(data.expense).toFixed(2)}</td>
                    <td className="py-2 pr-2">R$ {Number(data.balance).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Por categoria">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-300 border-b border-border">
                    <th className="py-2 pr-2">Categoria</th>
                    <th className="py-2 pr-2">Receita</th>
                    <th className="py-2 pr-2">Despesa</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_category.map(r => (
                    <tr key={r.id} className="border-b border-slate-800">
                      <td className="py-2 pr-2">{r.name}</td>
                      <td className="py-2 pr-2">R$ {Number(r.income).toFixed(2)}</td>
                      <td className="py-2 pr-2">R$ {Number(r.expense).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
