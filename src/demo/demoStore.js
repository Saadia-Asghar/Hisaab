import { currentMonthKey, rupeesToPaise } from '../utils/formatters'

/* Fixed UUIDs for stable demo data */
export const DEMO_GROUP_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
export const ID_ALI = '11111111-1111-4111-8111-111111111111'
export const ID_HASSAN = '22222222-2222-4222-8222-222222222222'
export const ID_BILAL = '33333333-3333-4333-8333-333333333333'
export const ID_OMAR = '44444444-4444-4444-8444-444444444444'
export const ID_KAMRAN = '55555555-5555-4555-8555-555555555555'

export const DEMO_INVITE_CODE = 'DEMO01'

const listeners = new Set()

function id() {
  return crypto.randomUUID()
}

function seedProfiles() {
  return [
    { id: ID_ALI, name: 'Ali', phone: null, avatar_color: '#4F6EF7', created_at: new Date().toISOString() },
    { id: ID_HASSAN, name: 'Hassan', phone: null, avatar_color: '#10B981', created_at: new Date().toISOString() },
    { id: ID_BILAL, name: 'Bilal', phone: null, avatar_color: '#F59E0B', created_at: new Date().toISOString() },
    { id: ID_OMAR, name: 'Omar', phone: null, avatar_color: '#EC4899', created_at: new Date().toISOString() },
    { id: ID_KAMRAN, name: 'Kamran', phone: null, avatar_color: '#8B5CF6', created_at: new Date().toISOString() },
  ]
}

function seedGroup(month) {
  return {
    id: DEMO_GROUP_ID,
    name: 'GIKI Hostel Room 14',
    created_by: ID_ALI,
    monthly_target: rupeesToPaise(15000),
    current_month: month,
    invite_code: DEMO_INVITE_CODE,
    created_at: new Date().toISOString(),
  }
}

function seedTransactions(month) {
  const mk = (day, isoTime) =>
    `${month}-${String(day).padStart(2, '0')}T${isoTime ?? '12:00:00.000Z'}`
  const rows = [
    { paid_by: ID_ALI, desc: 'Electricity bill', amount: 3800, split: 5, cat: 'utilities', day: 3 },
    { paid_by: ID_HASSAN, desc: 'Monthly groceries', amount: 2400, split: 5, cat: 'groceries', day: 7 },
    { paid_by: ID_BILAL, desc: 'Pizza delivery', amount: 1800, split: 4, cat: 'food', day: 11 },
    { paid_by: ID_OMAR, desc: 'Uber to city', amount: 650, split: 3, cat: 'transport', day: 14 },
    { paid_by: ID_ALI, desc: 'Internet bill', amount: 1200, split: 5, cat: 'utilities', day: 18 },
  ]
  return rows.map((t) => {
    const amountPaise = rupeesToPaise(t.amount)
    const share = Math.round(amountPaise / t.split)
    return {
      id: id(),
      group_id: DEMO_GROUP_ID,
      paid_by: t.paid_by,
      amount_paise: amountPaise,
      description: t.desc,
      category: t.cat,
      split_count: t.split,
      share_paise: share,
      raw_input: null,
      created_at: mk(t.day),
    }
  })
}

function seedPool(month) {
  const contributors = [ID_ALI, ID_HASSAN, ID_BILAL, ID_OMAR, ID_KAMRAN]
  return contributors.map((uid) => ({
    id: id(),
    group_id: DEMO_GROUP_ID,
    user_id: uid,
    amount_paise: rupeesToPaise(3000),
    month,
    note: 'Demo contribution',
    created_at: new Date().toISOString(),
  }))
}

function seedDebts() {
  return [
    {
      id: id(),
      group_id: DEMO_GROUP_ID,
      ower_id: ID_HASSAN,
      owed_to_id: ID_ALI,
      amount_paise: rupeesToPaise(760),
      description: 'Electricity share',
      settled: false,
      settled_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: id(),
      group_id: DEMO_GROUP_ID,
      ower_id: ID_OMAR,
      owed_to_id: ID_ALI,
      amount_paise: rupeesToPaise(760),
      description: 'Electricity share',
      settled: false,
      settled_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: id(),
      group_id: DEMO_GROUP_ID,
      ower_id: ID_KAMRAN,
      owed_to_id: ID_HASSAN,
      amount_paise: rupeesToPaise(480),
      description: 'Grocery share',
      settled: false,
      settled_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: id(),
      group_id: DEMO_GROUP_ID,
      ower_id: ID_BILAL,
      owed_to_id: ID_OMAR,
      amount_paise: rupeesToPaise(217),
      description: 'Uber share',
      settled: false,
      settled_at: null,
      created_at: new Date().toISOString(),
    },
  ]
}

function createInitialState() {
  const month = currentMonthKey()
  const profiles = seedProfiles()
  return {
    profiles,
    groups: [seedGroup(month)],
    groupMembers: profiles.map((p) => ({
      id: `gm-${p.id}`,
      group_id: DEMO_GROUP_ID,
      user_id: p.id,
      joined_at: new Date().toISOString(),
    })),
    transactions: seedTransactions(month),
    poolContributions: seedPool(month),
    debts: seedDebts(),
  }
}

let state = createInitialState()

export function subscribeDemo(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify() {
  listeners.forEach((fn) => fn())
}

export function getDemoSnapshot() {
  return state
}

export function resetDemoStore() {
  state = createInitialState()
  notify()
}

/** Re-seed only the built-in demo group (other demo groups untouched). */
export function reseedDemoTransactionsPoolDebts() {
  const month = currentMonthKey()
  state = {
    ...state,
    transactions: [...state.transactions.filter((t) => t.group_id !== DEMO_GROUP_ID), ...seedTransactions(month)],
    poolContributions: [
      ...state.poolContributions.filter((p) => !(p.group_id === DEMO_GROUP_ID && p.month === month)),
      ...seedPool(month),
    ],
    debts: [...state.debts.filter((d) => d.group_id !== DEMO_GROUP_ID), ...seedDebts()],
  }
  notify()
}

export function getGroupByInviteCode(code) {
  const c = (code ?? '').trim().toUpperCase()
  return state.groups.find((g) => (g.invite_code ?? '').toUpperCase() === c) ?? null
}

export function demoCreateGroup({ name, createdById, monthlyTargetPaise }) {
  const gid = id()
  const invite = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
  const g = {
    id: gid,
    name,
    created_by: createdById,
    monthly_target: monthlyTargetPaise,
    current_month: currentMonthKey(),
    invite_code: invite,
    created_at: new Date().toISOString(),
  }
  state = {
    ...state,
    groups: [...state.groups, g],
    groupMembers: [
      ...state.groupMembers,
      { id: id(), group_id: gid, user_id: createdById, joined_at: new Date().toISOString() },
    ],
  }
  notify()
  return g
}

export function demoJoinGroup(groupId, userId) {
  const exists = state.groupMembers.some((m) => m.group_id === groupId && m.user_id === userId)
  if (!exists) {
    state = {
      ...state,
      groupMembers: [
        ...state.groupMembers,
        { id: id(), group_id: groupId, user_id: userId, joined_at: new Date().toISOString() },
      ],
    }
    notify()
  }
}

export function demoInsertTransaction(row) {
  const newRow = { ...row, id: row.id ?? id() }
  state = {
    ...state,
    transactions: [newRow, ...state.transactions],
  }
  notify()
  return newRow
}

export function demoInsertDebts(rows) {
  state = {
    ...state,
    debts: [...rows.map((r) => ({ ...r, id: r.id ?? id() })), ...state.debts],
  }
  notify()
}

export function demoSettleDebt(debtId, settled) {
  state = {
    ...state,
    debts: state.debts.map((d) =>
      d.id === debtId
        ? { ...d, settled, settled_at: settled ? new Date().toISOString() : null }
        : d
    ),
  }
  notify()
}

export function demoSettleDebtsForTransfer(groupId, fromId, toId, settled) {
  const t = settled ? new Date().toISOString() : null
  state = {
    ...state,
    debts: state.debts.map((d) =>
      d.group_id === groupId && d.ower_id === fromId && d.owed_to_id === toId && !d.settled
        ? { ...d, settled: !!settled, settled_at: t }
        : d
    ),
  }
  notify()
}

export function demoSettleAllDebtsInGroup(groupId) {
  const now = new Date().toISOString()
  state = {
    ...state,
    debts: state.debts.map((d) =>
      d.group_id === groupId && !d.settled ? { ...d, settled: true, settled_at: now } : d
    ),
  }
  notify()
}

export function demoInsertPoolContribution(row) {
  const newRow = { ...row, id: row.id ?? id() }
  state = {
    ...state,
    poolContributions: [newRow, ...state.poolContributions],
  }
  notify()
  return newRow
}

export function demoUpdateProfile(userId, patch) {
  state = {
    ...state,
    profiles: state.profiles.map((p) => (p.id === userId ? { ...p, ...patch } : p)),
  }
  notify()
}

export function demoFindProfile(userId) {
  return state.profiles.find((p) => p.id === userId) ?? null
}

/** Minimal shape compatible with `session.user` usage across pages */
export function getDemoAuthUser() {
  return {
    id: ID_ALI,
    email: 'ali.demo@hisaab.app',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  }
}
