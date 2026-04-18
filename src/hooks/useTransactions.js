import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTransactions(groupId) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!groupId) {
      setTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error && data) setTransactions(data)
    else setTransactions([])
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  // Real-time: refresh whenever any transaction changes for this group
  useEffect(() => {
    if (!groupId) return
    const channel = supabase
      .channel(`transactions:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `group_id=eq.${groupId}` },
        () => { load() },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [groupId, load])

  return { transactions, loading, refresh: load }
}
