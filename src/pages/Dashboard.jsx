import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, CheckCircle, Wallet, ChevronRight, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { useTransactions } from '../hooks/useTransactions'
import { usePoolStats } from '../hooks/usePoolStats'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BottomNav } from '../components/layout/BottomNav'
import { BalanceCard } from '../components/ui/BalanceCard'
import { TransactionItem } from '../components/ui/TransactionItem'
import { GroupInfoModal } from '../components/ui/GroupInfoModal'
import { Avatar } from '../components/ui/Avatar'
import { SkeletonList } from '../components/ui/Skeleton'
import { useToast } from '../context/ToastContext'
import { seedDemoData } from '../utils/seedDemoData'
import { currentMonthKey, formatRsLabel } from '../utils/formatters'

const CATEGORY_COLORS = {
  utilities: '#4F6EF7',
  food: '#F59E0B',
  transport: '#10B981',
  groceries: '#06B6D4',
  entertainment: '#EC4899',
  other: '#8B5CF6',
}

function genInvite() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join('')
}

export default function Dashboard() {
  const { session, user, loading: authLoading, isSupabaseConfigured } = useAuth()
  const { showToast } = useToast()
  const {
    activeGroupId,
    setActiveGroupId,
    group,
    members,
    loading: groupLoading,
    refresh,
  } = useGroup(user?.id)
  const { transactions, loading: txLoading, refresh: refreshTx } = useTransactions(activeGroupId)
  const {
    contributedPaise,
    spentPaise,
    remainingPaise,
    loading: poolLoading,
    refresh: refreshPool,
  } = usePoolStats(activeGroupId, currentMonthKey())

  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [groupInfoOpen, setGroupInfoOpen] = useState(false)
  const [gName, setGName] = useState('GIKI Hostel Room 14')
  const [gTarget, setGTarget] = useState('15000')
  const [inviteInput, setInviteInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [profileName, setProfileName] = useState(null)

  const profileById = useMemo(
    () => Object.fromEntries((members ?? []).map((m) => [m.id, m])),
    [members],
  )

  // Fetch own profile name
  useEffect(() => {
    if (!user?.id) return
    const found = members?.find((m) => m.id === user.id)
    if (found) {
      setProfileName(found.name)
      return
    }
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data?.name) setProfileName(data.name) })
  }, [user?.id, members])

  // Spending by category for current month
  const categoryTotals = useMemo(() => {
    const mk = currentMonthKey()
    const totals = {}
    transactions.forEach((t) => {
      const d = new Date(t.created_at)
      const tmk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (tmk !== mk) return
      totals[t.category] = (totals[t.category] ?? 0) + t.amount_paise
    })
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [transactions])

  const maxCatPaise = categoryTotals[0]?.[1] ?? 1

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
    const { error: e2 } = await supabase
      .from('group_members')
      .insert({ group_id: g.id, user_id: user.id })
    if (e2) {
      showToast(e2.message, 'error')
      setBusy(false)
      return
    }
    setActiveGroupId(g.id)
    setCreateOpen(false)
    setBusy(false)
    refresh()
    // Show group info so they can immediately copy invite code
    setTimeout(() => setGroupInfoOpen(true), 400)
    showToast(`Group ready! Invite code: ${code}`)
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
    const { error: e2 } = await supabase
      .from('group_members')
      .insert({ group_id: g.id, user_id: user.id })
    if (e2) {
      showToast(e2.message, 'error')
      setBusy(false)
      return
    }
    setActiveGroupId(g.id)
    showToast('Group join ho gaya!')
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

  async function leaveGroup() {
    if (!activeGroupId || !user?.id) return
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', activeGroupId)
      .eq('user_id', user.id)
    if (error) {
      showToast(error.message, 'error')
    } else {
      setActiveGroupId(null)
      setGroupInfoOpen(false)
      showToast('Group chhor diya')
    }
  }

  const monthlyTargetPaise = group?.monthly_target ?? 0

  return (
    <PageWrapper>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">Hisaab</h1>
          <p className="text-xs text-[var(--text-secondary)]">{profileName ?? user.email}</p>
        </div>
        <Link to="/profile" className="btn-ghost p-2">
          <User className="h-5 w-5" />
        </Link>
      </header>

      {/* No group */}
      {!activeGroupId ? (
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
      ) : groupLoading ? (
        <SkeletonList count={4} />
      ) : !group ? (
        <div className="card space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">Group not found. Create or join one.</p>
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
          {/* Group name row + member avatars */}
          <button
            type="button"
            className="mb-4 flex w-full items-center justify-between rounded-xl bg-[var(--bg-surface)] px-4 py-3 text-left"
            onClick={() => setGroupInfoOpen(true)}
          >
            <div>
              <p className="text-xs text-[var(--text-muted)]">Active group</p>
              <p className="font-display font-semibold text-[var(--text-primary)]">{group.name}</p>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {members.slice(0, 4).map((m) => (
                  <Avatar key={m.id} name={m.name} color={m.avatar_color} size="sm" />
                ))}
                {members.length > 4 && (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card)] text-xs text-[var(--text-muted)] ring-2 ring-[var(--bg-surface)]">
                    +{members.length - 4}
                  </span>
                )}
              </div>
              <ChevronRight className="ml-2 h-4 w-4 text-[var(--text-muted)]" />
            </div>
          </button>

          <BalanceCard
            remainingPaise={remainingPaise}
            contributedPaise={contributedPaise}
            spentPaise={spentPaise}
            monthlyTargetPaise={monthlyTargetPaise}
            loading={poolLoading}
          />

          {/* Quick actions */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            <Link
              to="/add-expense"
              className="btn-primary flex flex-col items-center gap-1 py-3 text-center text-xs"
            >
              <Plus className="h-5 w-5" />
              Kharch Add
            </Link>
            <Link
              to="/debts"
              className="btn-ghost flex flex-col items-center gap-1 py-3 text-center text-xs"
            >
              <Wallet className="h-5 w-5" />
              Debts
            </Link>
            <Link
              to="/settlement"
              className="btn-ghost flex flex-col items-center gap-1 py-3 text-center text-xs"
            >
              <CheckCircle className="h-5 w-5" />
              Settle
            </Link>
          </div>

          {/* Spending by category */}
          {categoryTotals.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-sm font-semibold text-[var(--text-secondary)]">
                Is mahine ka kharch
              </h2>
              <div className="card mt-3 space-y-3">
                {categoryTotals.map(([cat, paise]) => (
                  <div key={cat}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs capitalize text-[var(--text-secondary)]">{cat}</span>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {formatRsLabel(paise)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: CATEGORY_COLORS[cat] ?? '#8B5CF6' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(paise / maxCatPaise) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          <div className="mt-8">
            <h2 className="font-display text-sm font-semibold text-[var(--text-secondary)]">
              Recent Activity
            </h2>
            <div className="mt-3 space-y-3">
              {txLoading ? (
                <SkeletonList count={4} />
              ) : transactions.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">
                  Koi transaction nahi. Upar se kharch add karo!
                </p>
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

      {/* Create group modal */}
      {createOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form onSubmit={createGroup} className="card w-full max-w-md">
            <h3 className="font-display text-lg font-semibold">New group</h3>
            <label className="mt-4 block text-xs text-[var(--text-secondary)]">Name</label>
            <input
              className="input-field mt-1"
              value={gName}
              onChange={(e) => setGName(e.target.value)}
            />
            <label className="mt-3 block text-xs text-[var(--text-secondary)]">
              Monthly pool target (Rs)
            </label>
            <input
              className="input-field mt-1"
              inputMode="numeric"
              value={gTarget}
              onChange={(e) => setGTarget(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Join group modal */}
      {joinOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <form onSubmit={joinGroup} className="card w-full max-w-md">
            <h3 className="font-display text-lg font-semibold">Join with invite</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              6-letter code daalo jo group creator ne share kiya
            </p>
            <input
              className="input-field mt-4 text-center text-xl uppercase tracking-widest"
              placeholder="XXXXXX"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              maxLength={6}
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => setJoinOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                Join
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Group info modal */}
      {groupInfoOpen && group && (
        <GroupInfoModal
          group={group}
          members={members}
          currentUserId={user.id}
          onClose={() => setGroupInfoOpen(false)}
          onLeave={leaveGroup}
        />
      )}

      <BottomNav />
    </PageWrapper>
  )
}
