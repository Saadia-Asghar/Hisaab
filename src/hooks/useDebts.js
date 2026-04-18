import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDebts(groupId, userId) {
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!groupId) {
      setDebts([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('group_id', groupId)
      .eq('settled', false)
    setDebts(data ?? [])
    setLoading(false)
  }, [groupId])

  useEffect(() => { load() }, [load])

  // Real-time: refresh on any debt change
  useEffect(() => {
    if (!groupId) return
    const channel = supabase
      .channel(`debts:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'debts', filter: `group_id=eq.${groupId}` },
        () => { load() },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [groupId, load])

  const owedToMe = userId ? debts.filter((d) => d.owed_to_id === userId) : []
  const iOwe = userId ? debts.filter((d) => d.ower_id === userId) : []
  const unsettledCount = debts.length

  return { debts, owedToMe, iOwe, unsettledCount, loading, refresh: load }
}
