import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BottomNav } from '../components/layout/BottomNav'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../context/ToastContext'
import { calculateSettlement, totalPaiseFromTransfers } from '../utils/settlement'
import { formatRsLabel } from '../utils/formatters'

export default function Settlement() {
  const { session, user } = useAuth()
  const { showToast } = useToast()
  const { activeGroupId, members } = useGroup(user?.id)
  const [debts, setDebts] = useState([])
  const [paid, setPaid] = useState(() => new Set())
  const [settling, setSettling] = useState(null)

  async function loadDebts() {
    if (!activeGroupId) return
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('group_id', activeGroupId)
      .eq('settled', false)
    setDebts(data ?? [])
    setPaid(new Set())
  }

  useEffect(() => { loadDebts() }, [activeGroupId])

  const transfers = useMemo(() => calculateSettlement(debts), [debts])
  const total = totalPaiseFromTransfers(transfers)
  const byId = useMemo(() => Object.fromEntries((members ?? []).map((m) => [m.id, m])), [members])
  const monthLabel = new Date().toLocaleString('en-PK', { month: 'long', year: 'numeric' })

  if (!session) return <Navigate to="/" replace />

  function shareText() {
    if (transfers.length === 0) {
      showToast('Koi unsettled debt nahi', 'error')
      return
    }
    const lines = transfers.map(
      (t) =>
        `${byId[t.from]?.name ?? '?'} → ${byId[t.to]?.name ?? '?'}: Rs ${(t.amount_paise / 100).toLocaleString('en-PK')}`,
    )
    const body = [
      `Hisaab — ${monthLabel} Settlement`,
      '━━━━━━━━━━━━━━━━━━━━━',
      ...lines,
      '━━━━━━━━━━━━━━━━━━━━━',
      'Hisaab app se generate hua ✓',
    ].join('\n')
    navigator.clipboard.writeText(body).then(() => showToast('Clipboard mein copy ho gaya'))
  }

  function waOne(t) {
    const body = `${byId[t.from]?.name ?? '?'} → ${byId[t.to]?.name ?? '?'}: ${formatRsLabel(t.amount_paise)} — Hisaab settlement (${monthLabel})`
    window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank')
  }

  async function markPaid(t, idx) {
    if (paid.has(String(idx))) return
    setSettling(idx)
    // Settle all debts between these two parties (both directions), net to the transfer
    const { error } = await supabase
      .from('debts')
      .update({ settled: true, settled_at: new Date().toISOString() })
      .eq('group_id', activeGroupId)
      .or(
        `and(ower_id.eq.${t.from},owed_to_id.eq.${t.to}),and(ower_id.eq.${t.to},owed_to_id.eq.${t.from})`,
      )
      .eq('settled', false)
    setSettling(null)
    if (error) {
      showToast(error.message, 'error')
    } else {
      setPaid((s) => new Set(s).add(String(idx)))
      showToast('Settled! DB update ho gaya ✓')
      // Reload debts to reflect new state
      loadDebts()
    }
  }

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg font-semibold">Month-End Hisaab</h1>
          <p className="text-xs text-[var(--text-secondary)]">{monthLabel}</p>
        </div>
        <Link to="/dashboard" className="text-sm text-[var(--accent)]">
          Home
        </Link>
      </div>

      <div className="card">
        <p className="text-sm text-[var(--text-secondary)]">
          {transfers.length === 0
            ? 'Sab settled hai!'
            : `${transfers.length} transfer${transfers.length !== 1 ? 's' : ''} needed · Rs ${(total / 100).toLocaleString('en-PK')} total`}
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {transfers.map((t, i) => {
          const done = paid.has(String(i))
          const isSettling = settling === i
          const fromName = byId[t.from]?.name ?? '?'
          const toName = byId[t.to]?.name ?? '?'
          return (
            <motion.div
              key={`${t.from}-${t.to}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card transition-colors duration-300 ${
                done
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-[var(--border)]'
              }`}
            >
              {/* Transfer row */}
              <div className="flex items-center gap-2">
                <Avatar name={fromName} color={byId[t.from]?.avatar_color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    <span className="text-[var(--text-secondary)]">{fromName}</span>
                    <span className="mx-2 text-[var(--text-muted)]">→</span>
                    <span className="text-[var(--text-secondary)]">{toName}</span>
                  </p>
                  <p className="font-display text-lg font-bold text-[var(--text-primary)]">
                    {formatRsLabel(t.amount_paise)}
                  </p>
                </div>
                <Avatar name={toName} color={byId[t.to]?.avatar_color} size="sm" />
              </div>

              {done ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Settled
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost flex flex-1 items-center justify-center gap-1 py-2 text-sm"
                    onClick={() => waOne(t)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1 py-2 text-sm"
                    disabled={isSettling}
                    onClick={() => markPaid(t, i)}
                  >
                    {isSettling ? '...' : 'Mark Paid'}
                  </button>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {transfers.length === 0 && (
        <p className="mt-8 text-center text-[var(--text-muted)]">
          Sab clear hai! Koi baqi nahi. 🎉
        </p>
      )}

      {transfers.length > 0 && (
        <button
          type="button"
          className="btn-primary mt-8 w-full"
          onClick={shareText}
        >
          Sab Share Karo
        </button>
      )}

      <BottomNav />
    </PageWrapper>
  )
}
