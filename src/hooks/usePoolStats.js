import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { currentMonthKey } from '../utils/formatters'

export function usePoolStats(groupId, monthKey = currentMonthKey()) {
  const [contributedPaise, setContributedPaise] = useState(0)
  const [spentPaise, setSpentPaise] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!groupId) {
      setContributedPaise(0)
      setSpentPaise(0)
      setLoading(false)
      return
    }
    setLoading(true)

    const { data: pc } = await supabase
      .from('pool_contributions')
      .select('amount_paise')
      .eq('group_id', groupId)
      .eq('month', monthKey)

    const { data: tx } = await supabase
      .from('transactions')
      .select('amount_paise, created_at')
      .eq('group_id', groupId)

    const contrib = (pc ?? []).reduce((s, r) => s + (r.amount_paise ?? 0), 0)

    const spent = (tx ?? []).reduce((s, r) => {
      const d = new Date(r.created_at)
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (mk !== monthKey) return s
      return s + (r.amount_paise ?? 0)
    }, 0)

    setContributedPaise(contrib)
    setSpentPaise(spent)
    setLoading(false)
  }, [groupId, monthKey])

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
