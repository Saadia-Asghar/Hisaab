import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, CheckCircle, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { useTransactions } from '../hooks/useTransactions'
import { usePoolStats } from '../hooks/usePoolStats'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BottomNav } from '../components/layout/BottomNav'
import { BalanceCard } from '../components/ui/BalanceCard'
import { TransactionItem } from '../components/ui/TransactionItem'
import { SkeletonList } from '../components/ui/Skeleton'
import { useToast } from '../context/ToastContext'
import { seedDemoData } from '../utils/seedDemoData'
import { currentMonthKey } from '../utils/formatters'

function genInvite() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join('')
}

export default function Dashboard() {
  const { session, user, loading: authLoading, isSupabaseConfigured } = useAuth()
  const { showToast } = useToast()
  const { activeGroupId, setActiveGroupId, group, members, loading: groupLoading, refresh } = useGroup(
    user?.id
  )
  const { transactions, loading: txLoading, refresh: refreshTx } = useTransactions(activeGroupId)
  const { contributedPaise, spentPaise, remainingPaise, loading: poolLoading, refresh: refreshPool } = usePoolStats(
    activeGroupId,
    currentMonthKey()
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [gName, setGName] = useState('GIKI Hostel Room 14')
  const [gTarget, setGTarget] = useState('15000')
  const [inviteInput, setInviteInput] = useState('')
  const [busy, setBusy] = useState(false)

  const profileById = useMemo(() => Object.fromEntries((members ?? []).map((m) => [m.id, m])), [members])

  if (authLoading) {
    return (
      <PageWrapper>
        <SkeletonList />
      </PageWrapper>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <PageWrapper>
        <p className="text-center text-[var(--text-secondary)]">Add Supabase credentials to .env.local</p>
      </PageWrapper>
    )
  }

  if (!session) return <Navigate to="/" replace />

  async function createGroup(e) {
    e.preventDefault()
    setBusy(true)
    const targetPaise = Math.round(Number(gTarget || '0') * 100)
    const code = genInvite()
    const { data: g, error } = await supabase
      .from('groups')
      .insert({
        name: gName,
        created_by: user.id,
        monthly_target: targetPaise,
        invite_code: code,
        current_month: currentMonthKey(),
      })
      .select()
      .single()
    if (error) {
      showToast(error.message, 'error')
      setBusy(false)
      return
    }
    const { error: e2 } = await supabase.from('group_members').insert({ group_id: g.id, user_id: user.id })
    if (e2) {
      showToast(e2.message, 'error')
      setBusy(false)
      return
    }
    setActiveGroupId(g.id)
    showToast(`Group ready. Invite: ${code}`)
    setCreateOpen(false)
    setBusy(false)
    refresh()
  }

  async function joinGroup(e) {
    e.preventDefault()
    setBusy(true)
    const code = inviteInput.trim().toUpperCase()
    const { data: rows, error } = await supabase.rpc('get_group_by_invite', { inv: code })
    const g = Array.isArray(rows) ? rows[0] : rows
    if (error || !g) {
      showToast('Invalid invite code', 'error')
      setBusy(false)
      return
    }
    const { error: e2 } = await supabase.from('group_members').insert({ group_id: g.id, user_id: user.id })
    if (e2) {
      showToast(e2.message, 'error')
      setBusy(false)
      return
    }
    setActiveGroupId(g.id)
    showToast('Joined group!')
    setJoinOpen(false)
    setBusy(false)
    refresh()
  }

  async function runSeed() {
    if (!activeGroupId || !members?.length) {
      showToast('Need an active group and members', 'error')
      return
    }
    try {
      const r = await seedDemoData(supabase, activeGroupId, members)
      showToast(`Demo seeded: ${r.transactions} tx, ${r.contributions} pool, ${r.debts} debts`)
      refreshTx()
      refreshPool()
      refresh()
    } catch (err) {
      showToast(err.message ?? 'Seed failed', 'error')
    }
  }

  const monthlyTargetPaise = group?.monthly_target ?? 0

  return (
    <PageWrapper>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">Hisaab</h1>
          <p className="text-xs text-[var(--text-secondary)]">{user.email}</p>
        </div>
        <button
          type="button"
          className="btn-ghost py-2 text-xs"
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </header>

      {!activeGroupId || groupLoading ? (
        <div className="card space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">Create or join a group to start.</p>
          <div className="flex gap-2">
            <button type="button" className="btn-primary flex-1" onClick={() => setCreateOpen(true)}>
              Create
            </button>
            <button type="button" className="btn-ghost flex-1" onClick={() => setJoinOpen(true)}>
              Join
            </button>
          </div>
        </div>
      ) : (
        <>
          <BalanceCard
            remainingPaise={remainingPaise}
            contributedPaise={contributedPaise}
            spentPaise={spentPaise}
            monthlyTargetPaise={monthlyTargetPaise}
            loading={poolLoading}
          />

          <div className="mt-6 grid grid-cols-3 gap-2">
            <Link to="/add-expense" className="btn-primary flex flex-col gap-1 py-3 text-center text-xs">
              <Plus className="mx-auto h-5 w-5" />
              Kharch Add
            </Link>
            <Link to="/debts" className="btn-ghost flex flex-col gap-1 py-3 text-center text-xs">
              <Wallet className="mx-auto h-5 w-5" />
              Maango
            </Link>
            <Link to="/settlement" className="btn-ghost flex flex-col gap-1 py-3 text-center text-xs">
              <CheckCircle className="mx-auto h-5 w-5" />
              Settle Karo
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-sm font-semibold text-[var(--text-secondary)]">Recent Activity</h2>
            <div className="mt-3 space-y-3">
              {txLoading ? (
                <SkeletonList count={4} />
              ) : transactions.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No transactions yet.</p>
              ) : (
                transactions.slice(0, 10).map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    payerProfile={profileById[t.paid_by]}
                    currentUserId={user.id}
                  />
                ))
              )}
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
            <button type="button" className="btn-ghost w-full py-2 text-xs" onClick={runSeed}>
              Seed demo data (judges)
            </button>
          </motion.div>
        </>
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form onSubmit={createGroup} className="card w-full max-w-md">
            <h3 className="font-display text-lg font-semibold">New group</h3>
            <label className="mt-4 block text-xs text-[var(--text-secondary)]">Name</label>
            <input className="input-field mt-1" value={gName} onChange={(e) => setGName(e.target.value)} />
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">Monthly pool target (Rs)</label>
            <input
              className="input-field mt-1"
              inputMode="numeric"
              value={gTarget}
              onChange={(e) => setGTarget(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                Create
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {joinOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form onSubmit={joinGroup} className="card w-full max-w-md">
            <h3 className="font-display text-lg font-semibold">Join with invite</h3>
            <input
              className="input-field mt-4 uppercase"
              placeholder="CODE"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              maxLength={6}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setJoinOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                Join
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <BottomNav />
    </PageWrapper>
  )
}
