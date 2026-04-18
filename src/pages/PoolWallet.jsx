import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  const { contributedPaise, spentPaise, loading, refresh: refreshPool } = usePoolStats(activeGroupId, month)

  const [modal, setModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState([])

  useEffect(() => {
    async function load() {
      if (!activeGroupId) return
      const { data } = await supabase
        .from('pool_contributions')
        .select('*')
        .eq('group_id', activeGroupId)
        .eq('month', month)
        .order('created_at', { ascending: false })
      setRows(data ?? [])
    }
    load()
  }, [activeGroupId, month, contributedPaise])

  if (!session) return <Navigate to="/" replace />

  const fillPct = group?.monthly_target > 0 ? Math.min(1, contributedPaise / group.monthly_target) : 0

  async function contribute(e) {
    e.preventDefault()
    if (!activeGroupId) return
    const rs = Number(amount)
    if (!rs || rs <= 0) return
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
    showToast('Contribution saved — receipt downloaded')
    setModal(false)
    setAmount('')
    refreshPool()
    refresh()
  }

  const byUser = Object.fromEntries((members ?? []).map((m) => [m.id, m]))

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold">Pool</h1>
        <Link to="/dashboard" className="text-sm text-[var(--accent)]">
          Home
        </Link>
      </div>

      {!activeGroupId ? (
        <p className="text-sm text-[var(--text-secondary)]">Create or join a group from Home.</p>
      ) : (
        <>
          <div className="card flex flex-col items-center py-8">
            <div className="relative h-36 w-36">
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ background: 'conic-gradient(var(--accent) 0deg, var(--bg-surface) 0deg)' }}
                animate={{
                  background: `conic-gradient(var(--accent) ${fillPct * 360}deg, var(--bg-surface) 0deg)`,
                }}
                transition={{ duration: 0.8 }}
              />
              <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-[var(--bg-card)] text-center">
                <span className="text-xs text-[var(--text-muted)]">Filled</span>
                <span className="font-display text-xl font-bold">{Math.round(fillPct * 100)}%</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              {formatRsLabel(contributedPaise)} contributed · {formatRsLabel(spentPaise)} spent
            </p>
          </div>

          <button type="button" className="btn-primary mt-6 w-full" onClick={() => setModal(true)}>
            Contribute
          </button>

          <h2 className="mt-8 font-display text-sm font-semibold text-[var(--text-secondary)]">
            Contributions ({month})
          </h2>
          <div className="mt-3 space-y-2">
            {loading ? (
              <div className="skeleton h-14 w-full" />
            ) : rows.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No contributions yet.</p>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="card flex items-center justify-between gap-2 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={byUser[r.user_id]?.name} color={byUser[r.user_id]?.avatar_color} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{byUser[r.user_id]?.name ?? 'Member'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="font-display font-semibold">{formatRsLabel(r.amount_paise)}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {modal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={contribute} className="card w-full max-w-sm">
            <h3 className="font-display font-semibold">Contribute (Rs)</h3>
            <input
              className="input-field mt-3"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                Confirm
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <BottomNav />
    </PageWrapper>
  )
}
