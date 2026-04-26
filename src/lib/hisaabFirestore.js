import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

function assertDb() {
  if (!db) throw new Error('Firestore not initialized')
}

/** @param {import('firebase/firestore').DocumentSnapshot} snap */
export function snapToRow(snap) {
  if (!snap.exists()) return null
  const data = snap.data()
  const row = { id: snap.id, ...data }
  if (row.created_at?.toDate) row.created_at = row.created_at.toDate().toISOString()
  if (row.settled_at?.toDate) row.settled_at = row.settled_at.toDate().toISOString()
  if (row.joined_at?.toDate) row.joined_at = row.joined_at.toDate().toISOString()
  return row
}

export async function getProfile(userId) {
  assertDb()
  const snap = await getDoc(doc(db, 'profiles', userId))
  return snapToRow(snap)
}

export async function setProfileMerge(userId, payload) {
  assertDb()
  await setDoc(doc(db, 'profiles', userId), payload, { merge: true })
}

/** @returns {Promise<{ id: string } & Record<string, unknown> | null>} */
export async function getGroup(groupId) {
  assertDb()
  const snap = await getDoc(doc(db, 'groups', groupId))
  return snapToRow(snap)
}

export async function findGroupByInviteCode(code) {
  assertDb()
  const normalized = String(code).trim().toUpperCase()
  const q = query(collection(db, 'groups'), where('invite_code', '==', normalized), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snapToRow(snap.docs[0])
}

export async function createGroupDoc({
  name,
  createdById,
  monthlyTargetPaise,
  inviteCode,
  currentMonthKey: currentMonth,
}) {
  assertDb()
  const groupRef = doc(collection(db, 'groups'))
  const payload = {
    name,
    created_by: createdById,
    monthly_target: monthlyTargetPaise,
    invite_code: inviteCode,
    current_month: currentMonth,
    created_at: new Date().toISOString(),
  }
  await setDoc(groupRef, payload)
  await setDoc(doc(db, 'groups', groupRef.id, 'members', createdById), {
    joined_at: new Date().toISOString(),
  })
  return { id: groupRef.id, ...payload }
}

export async function addGroupMember(groupId, userId) {
  assertDb()
  await setDoc(doc(db, 'groups', groupId, 'members', userId), {
    joined_at: new Date().toISOString(),
  })
}

export async function listMemberUserIds(groupId) {
  assertDb()
  const snap = await getDocs(collection(db, 'groups', groupId, 'members'))
  return snap.docs.map((d) => d.id)
}

export async function listProfilesForIds(ids) {
  assertDb()
  if (!ids.length) return []
  const tasks = ids.map((id) => getDoc(doc(db, 'profiles', id)))
  const snaps = await Promise.all(tasks)
  return snaps.map((s) => snapToRow(s)).filter(Boolean)
}

export async function listTransactions(groupId, max = 50) {
  assertDb()
  const snap = await getDocs(collection(db, 'groups', groupId, 'transactions'))
  const rows = snap.docs.map((d) => snapToRow(d))
  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return rows.slice(0, max)
}

export async function listPoolContributionsForMonth(groupId, month) {
  assertDb()
  const q = query(
    collection(db, 'groups', groupId, 'pool_contributions'),
    where('month', '==', month)
  )
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => snapToRow(d))
  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return rows
}

/** For pool stats spend sum — all tx in group */
export async function listTransactionAmountsForGroup(groupId) {
  assertDb()
  const snap = await getDocs(collection(db, 'groups', groupId, 'transactions'))
  return snap.docs.map((d) => {
    const r = snapToRow(d)
    return { amount_paise: r.amount_paise, created_at: r.created_at }
  })
}

export async function listContributedPaiseForMonth(groupId, month) {
  assertDb()
  const q = query(
    collection(db, 'groups', groupId, 'pool_contributions'),
    where('month', '==', month)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => snapToRow(d))
}

export async function insertTransaction(groupId, row) {
  assertDb()
  await addDoc(collection(db, 'groups', groupId, 'transactions'), row)
}

export async function insertDebtRows(groupId, rows) {
  assertDb()
  const batch = writeBatch(db)
  for (const row of rows) {
    const ref = doc(collection(db, 'groups', groupId, 'debts'))
    batch.set(ref, row)
  }
  await batch.commit()
}

export async function insertSingleDebt(groupId, row) {
  assertDb()
  await addDoc(collection(db, 'groups', groupId, 'debts'), row)
}

export async function listUnsettledDebts(groupId) {
  assertDb()
  const q = query(collection(db, 'groups', groupId, 'debts'), where('settled', '==', false))
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => snapToRow(d))
  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return rows
}

export async function settleDebtDoc(groupId, debtId, settledAtIso) {
  assertDb()
  await updateDoc(doc(db, 'groups', groupId, 'debts', debtId), {
    settled: true,
    settled_at: settledAtIso,
  })
}

export async function settleDebtsForTransfer(groupId, fromId, toId, settledAtIso) {
  assertDb()
  const q = query(
    collection(db, 'groups', groupId, 'debts'),
    where('settled', '==', false),
    where('ower_id', '==', fromId),
    where('owed_to_id', '==', toId)
  )
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach((d) => {
    batch.update(d.ref, { settled: true, settled_at: settledAtIso })
  })
  await batch.commit()
}

export async function settleAllDebtsInGroup(groupId, settledAtIso) {
  assertDb()
  const q = query(collection(db, 'groups', groupId, 'debts'), where('settled', '==', false))
  const snap = await getDocs(q)
  const batch = writeBatch(db)
  snap.docs.forEach((d) => {
    batch.update(d.ref, { settled: true, settled_at: settledAtIso })
  })
  await batch.commit()
}

export async function insertPoolContribution(groupId, row) {
  assertDb()
  const ref = await addDoc(collection(db, 'groups', groupId, 'pool_contributions'), row)
  const snap = await getDoc(ref)
  return snapToRow(snap)
}

/** Batch seed helpers (demo data) */
export async function batchInsertTransactions(groupId, rows) {
  assertDb()
  let batch = writeBatch(db)
  let count = 0
  for (const row of rows) {
    const ref = doc(collection(db, 'groups', groupId, 'transactions'))
    batch.set(ref, row)
    count++
    if (count >= 450) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }
  if (count) await batch.commit()
}

export async function batchInsertPoolContributions(groupId, rows) {
  assertDb()
  let batch = writeBatch(db)
  let count = 0
  for (const row of rows) {
    const ref = doc(collection(db, 'groups', groupId, 'pool_contributions'))
    batch.set(ref, row)
    count++
    if (count >= 450) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }
  if (count) await batch.commit()
}

export async function batchInsertDebts(groupId, rows) {
  assertDb()
  let batch = writeBatch(db)
  let count = 0
  for (const row of rows) {
    const ref = doc(collection(db, 'groups', groupId, 'debts'))
    batch.set(ref, row)
    count++
    if (count >= 450) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }
  if (count) await batch.commit()
}
