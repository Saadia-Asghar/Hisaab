import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BottomNav } from '../components/layout/BottomNav'
import { DebtCard } from '../components/ui/DebtCard'
import { useToast } from '../context/ToastContext'
import { formatRsLabel, rupeesToPaise } from '../utils/formatters'

export default function Debts() {
  const { session, user } = useAuth()
  const { showToast } = useToast()
  const { activeGroupId, members, refresh } = useGroup(user?.id)
  const [tab, setTab] = useState('owed') // owed to me | i owe
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fab, setFab] = useState(false)
  const [form, setForm] = useState({ owe: '', amount: '', desc: '' })

  async function load() {
    if (!activeGroupId) {
      setDebts([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase.from('debts').select('*').eq('group_id', activeGroupId).eq('settled', false)
    setDebts(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [activeGroupId])

  if (!session) return <Navigate to="/" replace />

  const list =
    tab === 'owed'
      ? debts.filter((d) => d.owed_to_id === user.id)
      : debts.filter((d) => d.ower_id === user.id)

  function counterparty(d) {
    const id = tab === 'owed' ? d.ower_id : d.owed_to_id
    return members.find((m) => m.id === id)
  }

  async function settle(d) {
    const { error } = await supabase
      .from('debts')
      .update({ settled: true, settled_at: new Date().toISOString() })
      .eq('id', d.id)
    if (error) showToast(error.message, 'error')
    else {
      showToast('Marked settled')
      load()
      refresh()
    }
  }

  function remind(d, other) {
    const amt = (d.amount_paise / 100).toLocaleString('en-PK')
    const text =
      tab === 'owed'
        ? `Hisaab reminder: ${other?.name}, tumhare zimmay mera Rs ${amt} baaki hai (${d.description || 'debt'}). Please settle karo. - Hisaab App`
        : `Hisaab: ${other?.name}, main apna Rs ${amt} jald settle karta hoon (${d.description || 'debt'}). - Hisaab App`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function addDebt(e) {
    e.preventDefault()
    if (!activeGroupId) return
    const oweId = form.owe
    const rs = Number(form.amount)
    if (!oweId || !rs) {
      showToast('Select member and amount', 'error')
      return
    }
    const { error } = await supabase.from('debts').insert({
      group_id: activeGroupId,
      ower_id: oweId,
      owed_to_id: user.id,
      amount_paise: rupeesToPaise(rs),
      description: form.desc || null,
      settled: false,
      created_at: new Date().toISOString(),
    })
    if (error) showToast(error.message, 'error')
    else {
      showToast('Debt logged')
      setFab(false)
      setForm({ owe: '', amount: '', desc: '' })
      load()
    }
  }

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold">Debts</h1>
        <Link to="/dashboard" className="text-sm text-[var(--accent)]">
          Home
        </Link>
      </div>

      <div className="flex gap-2 rounded-xl bg-[var(--bg-surface)] p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === 'owed' ? 'bg-[var(--bg-card)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
          onClick={() => setTab('owed')}
        >
          Unhe Dena Hai
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === 'iowe' ? 'bg-[var(--bg-card)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
          onClick={() => setTab('iowe')}
        >
          Mujhe Dena Hai
        </button>
      </div>

      {loading ? (
        <div className="skeleton mt-6 h-40 w-full" />
      ) : list.length === 0 ? (
        <p className="mt-8 text-center text-[var(--text-muted)]">All Clear! 🎉</p>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              counterparty={counterparty(d)}
              mode={tab}
              onSettle={() => settle(d)}
              onRemind={() => remind(d, counterparty(d))}
            />
          ))}
        </div>
      )}

      <motion.button
        type="button"
        className="btn-primary fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full p-0 shadow-lg"
        onClick={() => setFab(true)}
        whileTap={{ scale: 0.96 }}
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {fab ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form onSubmit={addDebt} className="card mb-8 w-full max-w-md">
            <h3 className="font-display font-semibold">Log debt (they owe you)</h3>
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">Who owes?</label>
            <select
              className="input-field mt-1"
              value={form.owe}
              onChange={(e) => setForm((f) => ({ ...f, owe: e.target.value }))}
              required
            >
              <option value="">Select</option>
              {members
                .filter((m) => m.id !== user.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">Amount (Rs)</label>
            <input
              className="input-field mt-1"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">What for?</label>
            <input
              className="input-field mt-1"
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setFab(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <BottomNav />
    </PageWrapper>
  )
}
