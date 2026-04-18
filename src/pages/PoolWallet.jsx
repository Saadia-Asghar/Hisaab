import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { usePoolStats } from '../hooks/usePoolStats'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BottomNav } from '../components/layout/BottomNav'
import { Avatar } from '../components/ui/Avatar'
import { useToast } from '../context/ToastContext'
import { generateReceipt } from '../utils/generateReceipt'
import { currentMonthKey, formatRsLabel, rupeesToPaise } from '../utils/formatters'

export default function PoolWallet() {
  const { session, user } = useAuth()
  const { showToast } = useToast()
  const { activeGroupId, group, members, refresh } = useGroup(user?.id)
  const month = currentMonthKey()
  const { contributedPaise, spentPaise, refresh: refreshPool } = usePoolStats(activeGroupId, month)

  const [modal, setModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState([])
  const [loadingRows, setLoadingRows] = useState(true)

  const loadRows = useCallback(async () => {
    if (!activeGroupId) {
      setRows([])
      setLoadingRows(false)
      return
    }
    setLoadingRows(true)
    const { data } = await supabase
      .from('pool_contributions')
      .select('*')
      .eq('group_id', activeGroupId)
      .eq('month', month)
      .order('created_at', { ascending: false })
    setRows(data ?? [])
    setLoadingRows(false)
  }, [activeGroupId, month])

  useEffect(() => {
    loadRows()
  }, [loadRows, contributedPaise])

  if (!session) return <Navigate to="/" replace />

  const fillPct = group?.monthly_target > 0 ? Math.min(1, contributedPaise / group.monthly_target) : 0
  const remainingPaise = Math.max(0, contributedPaise - spentPaise)

  const byUser = Object.fromEntries((members ?? []).map((m) => [m.id, m]))
  const contributorIds = new Set(rows.map((r) => r.user_id))
  const perMemberContrib = (members ?? []).map((m) => ({
    ...m,
    contributed: rows.filter((r) => r.user_id === m.id).reduce((s, r) => s + (r.amount_paise ?? 0), 0),
    hasPaid: contributorIds.has(m.id),
  }))

  const notPaid = perMemberContrib.filter((m) => !m.hasPaid)
  const targetPerPerson =
    group?.monthly_target && members.length > 0 ? Math.round(group.monthly_target / members.length) : 0

  async function contribute(e) {
    e.preventDefault()
    if (!activeGroupId) return
    const rs = Number(amount)
    if (!rs || rs <= 0) {
      showToast('Valid amount likho', 'error')
      return
    }
    setBusy(true)
    const { data, error } = await supabase
      .from('pool_contributions')
      .insert({
        group_id: activeGroupId,
        user_id: user.id,
        amount_paise: rupeesToPaise(rs),
        month,
        note: 'Contribution',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    setBusy(false)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    const profile = members.find((m) => m.id === user.id)
    generateReceipt({
      userName: profile?.name ?? 'Member',
      amount_rupees: rs,
      groupName: group?.name ?? 'Group',
      date: new Date().toLocaleString('en-PK'),
      receiptId: data.id.slice(0, 8),
    })
    showToast('Contribution saved — receipt download ho raha hai!')
    setModal(false)
    setAmount('')
    refreshPool()
    loadRows()
    refresh()
  }

  const circumference = 2 * Math.PI * 56

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold">Pool Wallet</h1>
        <Link to="/dashboard" className="text-sm text-[var(--accent)]">
          Home
        </Link>
      </div>

      {!activeGroupId ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p className="text-3xl mb-3">🏦</p>
          <p className="text-sm text-[var(--text-secondary)]">Pehle koi group create ya join karo.</p>
          <Link to="/dashboard" className="btn-primary mt-4 text-sm">
            Dashboard pe jao
          </Link>
        </div>
      ) : (
        <>
          <div className="card flex flex-col items-center py-8">
            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" fill="none" stroke="var(--bg-surface)" strokeWidth="10" />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference * (1 - fillPct) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-[var(--text-muted)]">Filled</span>
                <span className="font-display text-2xl font-bold">{Math.round(fillPct * 100)}%</span>
              </div>
            </div>

            <div className="mt-4 grid w-full grid-cols-3 gap-4 px-4 text-center">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Contributed</p>
                <p className="font-display mt-0.5 text-sm font-semibold">{formatRsLabel(contributedPaise)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Spent</p>
                <p className="font-display mt-0.5 text-sm font-semibold text-[var(--danger)]">
                  {formatRsLabel(spentPaise)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Remaining</p>
                <p className="font-display mt-0.5 text-sm font-semibold text-[var(--success)]">
                  {formatRsLabel(remainingPaise)}
                </p>
              </div>
            </div>

            {group?.monthly_target ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Target: {formatRsLabel(group.monthly_target)}
                {targetPerPerson > 0 ? ` (Rs ${(targetPerPerson / 100).toLocaleString('en-PK')}/person)` : ''}
              </p>
            ) : null}
          </div>

          <button type="button" className="btn-primary mt-4 w-full" onClick={() => setModal(true)}>
            + Contribute to Pool
          </button>

          <div className="card mt-6">
            <p className="mb-3 text-sm font-medium text-[var(--text-secondary)]">Member Status ({month})</p>
            <div className="space-y-3">
              {perMemberContrib.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar name={m.name} color={m.avatar_color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {m.name}
                      {m.id === user.id ? ' (you)' : ''}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {m.contributed > 0 ? `Contributed: ${formatRsLabel(m.contributed)}` : 'Abhi tak nahi diya'}
                    </p>
                  </div>
                  {m.hasPaid ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--success)]" />
                  ) : (
                    <Clock className="h-5 w-5 shrink-0 text-[var(--warning)]" />
                  )}
                </div>
              ))}
            </div>

            {notPaid.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                ⏳ {notPaid.map((m) => m.name).join(', ')} ne abhi contribute nahi kiya
              </div>
            ) : members.length > 0 ? (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                ✓ Sab ne is mahine contribute kar diya!
              </div>
            ) : null}
          </div>

          <h2 className="mt-6 font-display text-sm font-semibold text-[var(--text-secondary)]">
            Contributions ({month})
          </h2>
          <div className="mt-3 space-y-2">
            {loadingRows ? (
              <div className="skeleton h-14 w-full" />
            ) : rows.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Koi contribution nahi abhi.</p>
            ) : (
              rows.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card flex items-center justify-between gap-2 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={byUser[r.user_id]?.name} color={byUser[r.user_id]?.avatar_color} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{byUser[r.user_id]?.name ?? 'Member'}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(r.created_at).toLocaleString('en-PK', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold">{formatRsLabel(r.amount_paise)}</span>
                    <button
                      type="button"
                      className="btn-ghost p-1.5 text-xs"
                      title="Download receipt"
                      onClick={() =>
                        generateReceipt({
                          userName: byUser[r.user_id]?.name ?? 'Member',
                          amount_rupees: r.amount_paise / 100,
                          groupName: group?.name ?? 'Group',
                          date: new Date(r.created_at).toLocaleString('en-PK'),
                          receiptId: r.id.slice(0, 8),
                        })
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {modal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={contribute}
            className="card w-full max-w-sm"
          >
            <h3 className="font-display font-semibold">Pool mein Contribute Karo</h3>
            {targetPerPerson > 0 ? (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Suggested per person: {formatRsLabel(targetPerPerson)}
              </p>
            ) : null}
            <input
              className="input-field mt-3 text-center font-display text-xl font-bold"
              inputMode="decimal"
              placeholder="3000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            {targetPerPerson > 0 ? (
              <button
                type="button"
                className="btn-ghost mt-2 w-full py-2 text-xs"
                onClick={() => setAmount(String(targetPerPerson / 100))}
              >
                Use suggested amount ({formatRsLabel(targetPerPerson)})
              </button>
            ) : null}
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                {busy ? '...' : 'Confirm & Download Receipt'}
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}

      <BottomNav />
    </PageWrapper>
  )
}
