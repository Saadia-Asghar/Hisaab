import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, CheckCircle, Wallet, Copy, Users, Share2, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGroup } from '../hooks/useGroup'
import { useTransactions } from '../hooks/useTransactions'
import { usePoolStats } from '../hooks/usePoolStats'
import { PageWrapper } from '../components/layout/PageWrapper'
import { BalanceCard } from '../components/ui/BalanceCard'
import { TransactionItem } from '../components/ui/TransactionItem'
import { Avatar } from '../components/ui/Avatar'
import { SkeletonList } from '../components/ui/Skeleton'
import { useToast } from '../context/ToastContext'
import { seedDemoData } from '../utils/seedDemoData'
import { currentMonthKey, formatRsLabel } from '../utils/formatters'

function genInvite() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join('')
}

const CATEGORY_ICONS = {
  utilities: '⚡',
  food: '🍕',
  transport: '🚗',
  groceries: '🛒',
  entertainment: '🎬',
  other: '📦',
}

export default function Dashboard() {
  const { session, user, loading: authLoading, isSupabaseConfigured } = useAuth()
  const { showToast } = useToast()
  const { activeGroupId, setActiveGroupId, group, members, loading: groupLoading, refresh } = useGroup(user?.id)
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
  const [inviteCopied, setInviteCopied] = useState(false)

  const profileById = useMemo(
    () => Object.fromEntries((members ?? []).map((m) => [m.id, m])),
    [members]
  )

  // Spending by category this month
  const categoryTotals = useMemo(() => {
    if (!transactions.length) return []
    const map = {}
    transactions.forEach((t) => {
      const cat = t.category || 'other'
      map[cat] = (map[cat] ?? 0) + t.amount_paise
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  }, [transactions])

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
        <p className="text-center text-[var(--text-secondary)]">
          Add Supabase credentials to .env.local
        </p>
      </PageWrapper>
    )
  }

  if (!session) return <Navigate to="/" replace />

  function copyInvite() {
    if (!group?.invite_code) return
    navigator.clipboard.writeText(group.invite_code)
    setInviteCopied(true)
    showToast(`Invite code copied: ${group.invite_code}`)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  function shareInvite() {
    if (!group?.invite_code) return
    const text = `Join my Hisaab group.\nGroup: ${group.name}\nInvite code: ${group.invite_code}\n\nOpen: hisaab.vercel.app`
    if (navigator.share) {
      navigator.share({ title: 'Join Hisaab Group', text }).catch(() => null)
    } else {
      navigator.clipboard.writeText(text)
      showToast('Invite text copied!')
    }
  }

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
    showToast(`Group ready! Invite code: ${code}`)
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
    showToast('Group joined successfully.')
    setJoinOpen(false)
    setBusy(false)
    refresh()
  }

  async function runSeed() {
    if (!activeGroupId || !members?.length) {
      showToast('Create or join a group with members first.', 'error')
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
  const currentUserName = profileById[user.id]?.name ?? user.email?.split('@')[0] ?? 'User'

  return (
    <PageWrapper showBottomNav>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--accent)] lg:hidden">Hisaab</h1>
          <h1 className="font-display hidden text-2xl font-bold text-[var(--text-primary)] lg:block">
            {group?.name ?? 'Home'}
          </h1>
          {group ? (
            <p className="mt-0.5 text-xs text-[var(--text-secondary)] lg:text-[var(--text-muted)]">
              <span className="lg:hidden">{group.name}</span>
              <span className="hidden lg:inline">Group overview</span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Welcome back, {currentUserName}</p>
          )}
        </div>
        <button
          type="button"
          className="btn-ghost flex items-center gap-1.5 py-2 px-3 text-xs"
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </header>

      {/* No group state */}
      {!activeGroupId || groupLoading ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
          <div className="text-center">
            <p className="text-2xl mb-2">🏠</p>
            <p className="font-display font-semibold">Create or Join a Group</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Start tracking shared expenses with your roommates.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-primary flex-1" onClick={() => setCreateOpen(true)}>
              + Create Group
            </button>
            <button type="button" className="btn-ghost flex-1" onClick={() => setJoinOpen(true)}>
              Join Group
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Pool Balance Card */}
          <BalanceCard
            remainingPaise={remainingPaise}
            contributedPaise={contributedPaise}
            spentPaise={spentPaise}
            monthlyTargetPaise={monthlyTargetPaise}
            loading={poolLoading}
          />

          {/* Quick actions */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Link
              to="/add-expense"
              className="btn-primary flex flex-col items-center gap-1.5 py-3 text-center text-xs"
            >
              <Plus className="h-5 w-5" />
              Add Expense
            </Link>
            <Link
              to="/debts"
              className="btn-ghost flex flex-col items-center gap-1.5 py-3 text-center text-xs"
            >
              <Wallet className="h-5 w-5" />
              Debts
            </Link>
            <Link
              to="/settlement"
              className="btn-ghost flex flex-col items-center gap-1.5 py-3 text-center text-xs"
            >
              <CheckCircle className="h-5 w-5" />
              Settle
            </Link>
          </div>

          {/* Members + Invite Code */}
          <div className="card mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--text-secondary)]" />
                <p className="text-sm font-medium text-[var(--text-secondary)]">
                  Group ({(members ?? []).length} members)
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs flex items-center gap-1"
                  onClick={copyInvite}
                  title="Copy invite code"
                >
                  <Copy className="h-3 w-3" />
                  {inviteCopied ? 'Copied!' : group?.invite_code ?? ''}
                </button>
                <button
                  type="button"
                  className="btn-ghost px-2 py-1 text-xs"
                  onClick={shareInvite}
                  title="Share invite"
                >
                  <Share2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(members ?? []).map((m) => (
                <div key={m.id} className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-surface)] px-2 py-1.5">
                  <Avatar name={m.name} color={m.avatar_color} size="sm" />
                  <span className="text-xs text-[var(--text-primary)]">
                    {m.name}
                    {m.id === user.id ? ' (you)' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category spending breakdown */}
          {categoryTotals.length > 0 ? (
            <div className="card mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-3">
                This Month's Spending
              </p>
              <div className="space-y-2">
                {categoryTotals.map(([cat, paise]) => {
                  const pct = spentPaise > 0 ? paise / spentPaise : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {CATEGORY_ICONS[cat] ?? '📦'} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </span>
                        <span className="text-xs font-medium">{formatRsLabel(paise)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface)]">
                        <motion.div
                          className="h-full rounded-full bg-[var(--accent)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Recent Activity */}
          <div className="mt-6">
            <h2 className="font-display text-sm font-semibold text-[var(--text-secondary)]">
              Recent Activity
            </h2>
            <div className="mt-3 space-y-3">
              {txLoading ? (
                <SkeletonList count={4} />
              ) : transactions.length === 0 ? (
                <div className="card flex flex-col items-center py-8 text-center">
                  <p className="text-2xl mb-2">💸</p>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">No expenses yet</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Add your first expense to get started.</p>
                  <Link to="/add-expense" className="btn-primary mt-4 text-xs py-2 px-4">
                    + Add Expense
                  </Link>
                </div>
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

          {/* Judges seed button — subtle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <button
              type="button"
              className="btn-ghost w-full py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              onClick={runSeed}
            >
              🌱 Seed demo data
            </button>
          </motion.div>
        </>
      )}

      {/* Create Group Modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={createGroup}
            className="card w-full max-w-md"
          >
            <h3 className="font-display text-lg font-semibold">New Group</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              A 6-character invite code will be generated automatically.
            </p>

            <label className="mt-4 block text-xs text-[var(--text-secondary)]">Group Name</label>
            <input
              className="input-field mt-1"
              value={gName}
              onChange={(e) => setGName(e.target.value)}
              placeholder="GIKI Hostel Room 14"
              required
            />

            <label className="mt-3 block text-xs text-[var(--text-secondary)]">
              Monthly Pool Target (Rs)
            </label>
            <input
              className="input-field mt-1"
              inputMode="numeric"
              value={gTarget}
              onChange={(e) => setGTarget(e.target.value)}
              placeholder="15000"
            />

            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                {busy ? '...' : 'Create Group'}
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}

      {/* Join Group Modal */}
      {joinOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={joinGroup}
            className="card w-full max-w-md"
          >
            <h3 className="font-display text-lg font-semibold">Join with Invite Code</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Enter the 6-character code from your roommate.</p>
            <input
              className="input-field mt-4 text-center text-2xl font-display font-bold uppercase tracking-[0.3em]"
              placeholder="ABC123"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              maxLength={6}
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setJoinOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy}>
                {busy ? '...' : 'Join Group'}
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}
    </PageWrapper>
  )
}
