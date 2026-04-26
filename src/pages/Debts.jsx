import { useCallback, useEffect, useState } from 'react'
import { useSyncExternalStore } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, RefreshCw } from 'lucide-react'
import { listUnsettledDebts, settleDebtDoc, insertSingleDebt } from '../lib/hisaabFirestore'
import { isDemoMode } from '../lib/demoMode'
import {
  subscribeDemo,
  getDemoSnapshot,
  demoSettleDebt,
  demoInsertDebts,
} from '../demo/demoStore'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { PageWrapper } from '../components/layout/PageWrapper'
import { DebtCard } from '../components/ui/DebtCard'
import { useToast } from '../context/ToastContext'
import { formatRsLabel, rupeesToPaise } from '../utils/formatters'

export default function Debts() {
  const { session, user } = useAuth()
  const { showToast } = useToast()
  const { activeGroupId, members, refresh } = useGroup(user?.id)
  const demoSnap = useSyncExternalStore(
    isDemoMode() ? subscribeDemo : () => () => {},
    isDemoMode() ? getDemoSnapshot : () => ({ debts: [] }),
    isDemoMode() ? getDemoSnapshot : () => ({ debts: [] })
  )
  // 'owed_to_me' = others owe me  |  'i_owe' = I owe others
  const [tab, setTab] = useState('owed_to_me')
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fab, setFab] = useState(false)
  const [form, setForm] = useState({ owe: '', amount: '', desc: '' })

  const load = useCallback(async () => {
    if (!activeGroupId) {
      setDebts([])
      setLoading(false)
      return
    }
    setLoading(true)
    if (isDemoMode()) {
      const rows = demoSnap.debts
        .filter((d) => d.group_id === activeGroupId && !d.settled)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setDebts(rows)
      setLoading(false)
      return
    }
    try {
      const data = await listUnsettledDebts(activeGroupId)
      setDebts(data ?? [])
    } catch {
      setDebts([])
    }
    setLoading(false)
  }, [activeGroupId, demoSnap])

  useEffect(() => {
    load()
  }, [load])

  if (!session) return <Navigate to="/" replace />

  // Tab filter logic:
  // "Receivables" = they owe me = owed_to_id is me
  // "Payables" = I owe them = ower_id is me
  const list =
    tab === 'owed_to_me'
      ? debts.filter((d) => d.owed_to_id === user.id)
      : debts.filter((d) => d.ower_id === user.id)

  function counterparty(d) {
    const id = tab === 'owed_to_me' ? d.ower_id : d.owed_to_id
    return (members ?? []).find((m) => m.id === id)
  }

  async function settle(d) {
    if (isDemoMode()) {
      demoSettleDebt(d.id, true)
      showToast('Settled! ✓')
      load()
      refresh()
      return
    }
    try {
      await settleDebtDoc(activeGroupId, d.id, new Date().toISOString())
      showToast('Settled! ✓')
      load()
      refresh()
    } catch (error) {
      showToast(error?.message ?? 'Could not settle', 'error')
    }
  }

  function remind(d, other) {
    const amt = (d.amount_paise / 100).toLocaleString('en-PK')
    const text =
      tab === 'owed_to_me'
        ? `Hisaab reminder:\n${other?.name}, you have an outstanding balance of Rs ${amt} (${d.description || 'debt'}).\nPlease settle at your convenience.\n— Hisaab`
        : `Hisaab note:\n${other?.name}, I will settle Rs ${amt} shortly (${d.description || 'debt'}).\n— Hisaab`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function addDebt(e) {
    e.preventDefault()
    if (!activeGroupId) return
    const oweId = form.owe
    const rs = Number(form.amount)
    if (!oweId || !rs) {
      showToast('Please select a member and enter an amount.', 'error')
      return
    }
    if (isDemoMode()) {
      demoInsertDebts([
        {
          group_id: activeGroupId,
          ower_id: oweId,
          owed_to_id: user.id,
          amount_paise: rupeesToPaise(rs),
          description: form.desc || null,
          settled: false,
          settled_at: null,
          created_at: new Date().toISOString(),
        },
      ])
      showToast('Debt recorded successfully.')
      setFab(false)
      setForm({ owe: '', amount: '', desc: '' })
      load()
      return
    }
    try {
      await insertSingleDebt(activeGroupId, {
        group_id: activeGroupId,
        ower_id: oweId,
        owed_to_id: user.id,
        amount_paise: rupeesToPaise(rs),
        description: form.desc || null,
        settled: false,
        created_at: new Date().toISOString(),
      })
      showToast('Debt recorded successfully.')
      setFab(false)
      setForm({ owe: '', amount: '', desc: '' })
      load()
    } catch (error) {
      showToast(error?.message ?? 'Could not save debt', 'error')
    }
  }

  // Summary stats
  const totalOwedToMe = debts
    .filter((d) => d.owed_to_id === user.id)
    .reduce((s, d) => s + d.amount_paise, 0)
  const totalIowe = debts
    .filter((d) => d.ower_id === user.id)
    .reduce((s, d) => s + d.amount_paise, 0)

  return (
    <PageWrapper showBottomNav>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold">Debts</h1>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost p-2" onClick={load} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link to="/dashboard" className="text-sm text-[var(--accent)] flex items-center">
            Home
          </Link>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && (totalOwedToMe > 0 || totalIowe > 0) ? (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="card py-3 text-center">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Receivables</p>
            <p className="font-display font-bold text-[var(--success)] mt-1">
              {formatRsLabel(totalOwedToMe)}
            </p>
          </div>
          <div className="card py-3 text-center">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Payables</p>
            <p className="font-display font-bold text-[var(--danger)] mt-1">
              {formatRsLabel(totalIowe)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Tab switcher */}
      <div className="flex gap-2 rounded-xl bg-[var(--bg-surface)] p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            tab === 'owed_to_me'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
          onClick={() => setTab('owed_to_me')}
        >
          Receivables
          {!loading && debts.filter((d) => d.owed_to_id === user.id).length > 0 ? (
            <span className="ml-1.5 rounded-full bg-[var(--success)]/20 px-1.5 py-0.5 text-xs text-[var(--success)]">
              {debts.filter((d) => d.owed_to_id === user.id).length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            tab === 'i_owe'
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
          onClick={() => setTab('i_owe')}
        >
          Payables
          {!loading && debts.filter((d) => d.ower_id === user.id).length > 0 ? (
            <span className="ml-1.5 rounded-full bg-[var(--danger)]/20 px-1.5 py-0.5 text-xs text-[var(--danger)]">
              {debts.filter((d) => d.ower_id === user.id).length}
            </span>
          ) : null}
        </button>
      </div>

      {/* Debt list */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 flex flex-col items-center text-center"
        >
          <p className="text-4xl">🎉</p>
          <p className="mt-3 font-display font-semibold text-[var(--text-primary)]">All Clear!</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {tab === 'owed_to_me'
              ? 'No one currently owes you.'
              : 'You have no outstanding payables.'}
          </p>
        </motion.div>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <DebtCard
                debt={d}
                counterparty={counterparty(d)}
                mode={tab}
                onSettle={() => settle(d)}
                onRemind={() => remind(d, counterparty(d))}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* FAB — add manual debt */}
      <motion.button
        type="button"
        className="btn-primary fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full p-0 shadow-lg"
        onClick={() => setFab(true)}
        whileTap={{ scale: 0.93 }}
        whileHover={{ scale: 1.05 }}
        title="Log a debt"
      >
        <Plus className="h-6 w-6" />
      </motion.button>

      {/* Manual debt modal */}
      {fab ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={addDebt}
            className="card mb-8 w-full max-w-md"
          >
            <h3 className="font-display font-semibold">Log debt (they owe you)</h3>

            <label className="mt-3 block text-xs text-[var(--text-secondary)]">Who owes you?</label>
            <select
              className="input-field mt-1"
              value={form.owe}
              onChange={(e) => setForm((f) => ({ ...f, owe: e.target.value }))}
              required
            >
              <option value="">Select member</option>
              {(members ?? [])
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
              placeholder="500"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />

            <label className="mt-3 block text-xs text-[var(--text-secondary)]">Reason (optional)</label>
            <input
              className="input-field mt-1"
              placeholder="Pizza last night"
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            />

            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setFab(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                Save Debt
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}

    </PageWrapper>
  )
}
