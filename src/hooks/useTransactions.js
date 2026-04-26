import { useCallback, useEffect, useState } from 'react'
import { useSyncExternalStore } from 'react'
import { listTransactions } from '../lib/hisaabFirestore'
import { isDemoMode } from '../lib/demoMode'
import { subscribeDemo, getDemoSnapshot } from '../demo/demoStore'

export function useTransactions(groupId) {
  const demoSnap = useSyncExternalStore(
    isDemoMode() ? subscribeDemo : () => () => {},
    isDemoMode() ? getDemoSnapshot : () => ({ transactions: [] }),
    isDemoMode() ? getDemoSnapshot : () => ({ transactions: [] })
  )

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (isDemoMode()) {
      if (!groupId) {
        setTransactions([])
        setLoading(false)
        return
      }
      const rows = demoSnap.transactions
        .filter((t) => t.group_id === groupId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50)
      setTransactions(rows)
      setLoading(false)
      return
    }

    if (!groupId) {
      setTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await listTransactions(groupId, 50)
      setTransactions(data ?? [])
    } catch {
      setTransactions([])
    }
    setLoading(false)
  }, [groupId, demoSnap])

  useEffect(() => {
    load()
  }, [load])

  return { transactions, loading, refresh: load }
}
