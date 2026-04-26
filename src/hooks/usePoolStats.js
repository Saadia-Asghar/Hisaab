import { useCallback, useEffect, useState } from 'react'
import { useSyncExternalStore } from 'react'
import { listContributedPaiseForMonth, listTransactionAmountsForGroup } from '../lib/hisaabFirestore'
import { isDemoMode } from '../lib/demoMode'
import { subscribeDemo, getDemoSnapshot } from '../demo/demoStore'
import { currentMonthKey } from '../utils/formatters'

export function usePoolStats(groupId, monthKey = currentMonthKey()) {
  const demoSnap = useSyncExternalStore(
    isDemoMode() ? subscribeDemo : () => () => {},
    isDemoMode() ? getDemoSnapshot : () => ({
      transactions: [],
      poolContributions: [],
    }),
    isDemoMode() ? getDemoSnapshot : () => ({
      transactions: [],
      poolContributions: [],
    })
  )

  const [contributedPaise, setContributedPaise] = useState(0)
  const [spentPaise, setSpentPaise] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (isDemoMode()) {
      if (!groupId) {
        setContributedPaise(0)
        setSpentPaise(0)
        setLoading(false)
        return
      }
      const pc = demoSnap.poolContributions.filter((r) => r.group_id === groupId && r.month === monthKey)
      const contrib = pc.reduce((s, r) => s + (r.amount_paise ?? 0), 0)

      const spent = demoSnap.transactions
        .filter((r) => r.group_id === groupId)
        .reduce((s, r) => {
          const d = new Date(r.created_at)
          const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          if (mk !== monthKey) return s
          return s + (r.amount_paise ?? 0)
        }, 0)

      setContributedPaise(contrib)
      setSpentPaise(spent)
      setLoading(false)
      return
    }

    if (!groupId) {
      setContributedPaise(0)
      setSpentPaise(0)
      setLoading(false)
      return
    }
    setLoading(true)

    try {
      const pc = await listContributedPaiseForMonth(groupId, monthKey)
      const tx = await listTransactionAmountsForGroup(groupId)

      const contrib = (pc ?? []).reduce((s, r) => s + (r.amount_paise ?? 0), 0)

      const spent = (tx ?? []).reduce((s, r) => {
        const d = new Date(r.created_at)
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (mk !== monthKey) return s
        return s + (r.amount_paise ?? 0)
      }, 0)

      setContributedPaise(contrib)
      setSpentPaise(spent)
    } catch {
      setContributedPaise(0)
      setSpentPaise(0)
    }
    setLoading(false)
  }, [groupId, monthKey, demoSnap])

  useEffect(() => {
    refresh()
  }, [refresh])

  const remaining = Math.max(0, contributedPaise - spentPaise)
  const pctSpent = contributedPaise > 0 ? spentPaise / contributedPaise : 0

  return {
    contributedPaise,
    spentPaise,
    remainingPaise: remaining,
    pctSpent,
    loading,
    refresh,
  }
}
