import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { useDebts } from '../hooks/useDebts'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BottomNav } from '../components/layout/BottomNav'
import { DebtCard } from '../components/ui/DebtCard'
import { useToast } from '../context/ToastContext'
import { formatRsLabel, rupeesToPaise } from '../utils/formatters'

export default function Debts() {
  const { session, user } = useAuth()
  const { showToast } = useToast()
  const { activeGroupId, members } = useGroup(user?.id)
  const { debts, owedToMe, iOwe, loading, refresh } = useDebts(activeGroupId, user?.id)

  const [tab, setTab] = useState('owed')
  const [fab, setFab] = useState(false)
  const [form, setForm] = useState({ owe: '', amount: '', desc: '' })

  if (!session) return <Navigate to="/" replace />

  const list = tab === 'owed' ? owedToMe : iOwe

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
      showToast('Settled!')
      refresh()
    }
  }

  function remind(d, other) {
    const amt = formatRsLabel(d.amount_paise)
    const text =
      tab === 'owed'
        ? `Hisaab reminder: ${other?.name ?? 'Aap'}, tumhare zimmay mera ${amt} baaki hai (${d.description ?? 'debt'}). Please settle karo. — Hisaab App`
        : `Hisaab: ${other?.name ?? 'Aap'}, main apna ${amt} jald settle karta hoon (${d.description ?? 'debt'}). — Hisaab App`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function addDebt(e) {
    e.preventDefault()
    if (!activeGroupId) return
    const rs = Number(form.amount)
    if (!form.owe || !rs) {
      showToast('Member aur amount select karo', 'error')
      return
    }
    const { error } = await supabase.from('debts').insert({
      group_id: activeGroupId,
      ower_id: form.owe,
      owed_to_id: user.id,
      amount_paise: rupeesToPaise(rs),
      description: form.desc || null,
      settled: false,
      created_at: new Date().toISOString(),
    })
    if (error) showToast(error.message, 'error')
    else {
      showToast('Debt log ho gaya')
      setFab(false)
      setForm({ owe: '', amount: '', desc: '' })
      refresh()
    }
  }

  const totalOwedToMe = owedToMe.reduce((s, d) => s + d.amount_paise, 0)
  const totalIOwe = iOwe.reduce((s, d) => s + d.amount_paise, 0)

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold">Debts</h1>
        <Link to="/dashboard" className="text-sm text-[var(--accent)]">
          Home
        </Link>
      </div>

      {/* Summary pills */}
      {!loading && debts.length > 0 && (
        <div className="mb-4 flex gap-2">
          {totalOwedToMe > 0 && (
            <div className="flex-1 rounded-xl bg-emerald-500/10 px-3 py-2 text-center">
              <p className="text-xs text-emerald-300">Milne wala</p>
              <p className="font-display text-sm font-bold text-emerald-400">
                {formatRsLabel(totalOwedToMe)}
              </p>
            </div>
          )}
          {totalIOwe > 0 && (
            <div className="flex-1 rounded-xl bg-red-500/10 px-3 py-2 text-center">
              <p className="text-xs text-red-300">Dena hai</p>
              <p className="font-display text-sm font-bold text-red-400">
                {formatRsLabel(totalIOwe)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-2 rounded-xl bg-[var(--bg-surface)] p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === 'owed'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)]'
          }`}
          onClick={() => setTab('owed')}
        >
          Unhe Dena Hai
          {owedToMe.length > 0 && (
            <span className="ml-1.5 rounded-full bg-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
              {owedToMe.length}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === 'iowe'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)]'
              : 'text-[var(--text-muted)]'
          }`}
          onClick={() => setTab('iowe')}
        >
          Mujhe Dena Hai
          {iOwe.length > 0 && (
            <span className="ml-1.5 rounded-full bg-red-500/30 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
              {iOwe.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="skeleton mt-6 h-40 w-full" />
      ) : list.length === 0 ? (
        <p className="mt-8 text-center text-[var(--text-muted)]">
          {tab === 'owed' ? 'Koi tumhara nahi deta. 🎉' : 'Tumhara koi baaki nahi. 🎉'}
        </p>
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

      {/* FAB */}
      <motion.button
        type="button"
        className="btn-primary fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full p-0 shadow-lg"
        onClick={() => setFab(true)}
        whileTap={{ scale: 0.96 }}
        aria-label="Log debt"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Add debt modal */}
      {fab && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form onSubmit={addDebt} className="card mb-8 w-full max-w-md">
            <h3 className="font-display font-semibold">Debt log karo (they owe you)</h3>
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">Kaun owe karta hai?</label>
            <select
              className="input-field mt-1"
              value={form.owe}
              onChange={(e) => setForm((f) => ({ ...f, owe: e.target.value }))}
              required
            >
              <option value="">Select member</option>
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
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">Kisliye?</label>
            <input
              className="input-field mt-1"
              placeholder="optional"
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
      )}

      <BottomNav />
    </PageWrapper>
  )
}
