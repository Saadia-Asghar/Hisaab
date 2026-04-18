import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
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

  useEffect(() => {
    async function load() {
      if (!activeGroupId) return
      const { data } = await supabase
        .from('debts')
        .select('*')
        .eq('group_id', activeGroupId)
        .eq('settled', false)
      setDebts(data ?? [])
    }
    load()
  }, [activeGroupId])

  const transfers = useMemo(() => calculateSettlement(debts), [debts])
  const total = totalPaiseFromTransfers(transfers)

  const byId = useMemo(() => Object.fromEntries((members ?? []).map((m) => [m.id, m])), [members])

  const monthLabel = new Date().toLocaleString('en-PK', { month: 'long', year: 'numeric' })

  if (!session) return <Navigate to="/" replace />

  function shareText() {
    const lines = transfers.map(
      (t) => `${byId[t.from]?.name ?? '?'} → ${byId[t.to]?.name}: Rs ${(t.amount_paise / 100).toLocaleString('en-PK')}`
    )
    const body = [`Hisaab — ${monthLabel} Settlement`, '━━━━━━━━━━━━━━━━━━━━━', ...lines, '━━━━━━━━━━━━━━━━━━━━━', 'Hisaab app se generate hua ✓'].join('\n')
    navigator.clipboard.writeText(body).then(() => showToast('Copied to clipboard'))
  }

  function waOne(t) {
    const body = `${byId[t.from]?.name} → ${byId[t.to]?.name}: ${formatRsLabel(t.amount_paise)} — Hisaab settlement`
    window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank')
  }

  function markPaid(idx) {
    setPaid((s) => new Set(s).add(String(idx)))
    showToast('Marked paid (UI)')
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
          {transfers.length} transfers needed to settle Rs {(total / 100).toLocaleString('en-PK')} total
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {transfers.map((t, i) => {
          const done = paid.has(String(i))
          return (
            <motion.div
              key={`${t.from}-${t.to}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card flex flex-wrap items-center justify-between gap-3 ${done ? 'border-emerald-500/40 bg-emerald-500/5' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Avatar name={byId[t.from]?.name} color={byId[t.from]?.avatar_color} size="sm" />
                <span className="font-display font-semibold">{formatRsLabel(t.amount_paise)}</span>
                <Avatar name={byId[t.to]?.name} color={byId[t.to]?.avatar_color} size="sm" />
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost py-2 text-xs" onClick={() => waOne(t)}>
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button type="button" className="btn-primary py-2 text-xs" onClick={() => markPaid(i)}>
                  Mark Paid
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {transfers.length === 0 ? (
        <p className="mt-8 text-center text-[var(--text-muted)]">No unsettled debts. 🎉</p>
      ) : null}

      <button type="button" className="btn-primary mt-8 w-full" onClick={shareText}>
        Sab Share Karo
      </button>

      <BottomNav />
    </PageWrapper>
  )
}
