import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'hisaab_active_group_id'

export function useGroup(userId) {
  const [activeGroupId, setActiveGroupIdState] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  )
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const setActiveGroupId = useCallback((id) => {
    setActiveGroupIdState(id)
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  const refresh = useCallback(async () => {
    if (!userId || !activeGroupId) {
      setGroup(null)
      setMembers([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data: g, error: ge } = await supabase
      .from('groups')
      .select('*')
      .eq('id', activeGroupId)
      .maybeSingle()
    if (ge || !g) {
      setGroup(null)
      setMembers([])
      setLoading(false)
      return
    }
    setGroup(g)

    const { data: gm } = await supabase.from('group_members').select('user_id').eq('group_id', activeGroupId)

    const ids = (gm ?? []).map((r) => r.user_id)
    if (ids.length === 0) {
      setMembers([])
      setLoading(false)
      return
    }

    const { data: profs } = await supabase.from('profiles').select('*').in('id', ids)
    setMembers(profs ?? [])
    setLoading(false)
  }, [userId, activeGroupId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    activeGroupId,
    setActiveGroupId,
    group,
    members,
    loading,
    refresh,
  }
}
