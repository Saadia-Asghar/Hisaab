import { useCallback, useEffect, useState } from 'react'
import { useSyncExternalStore } from 'react'
import { getGroup, listMemberUserIds, listProfilesForIds } from '../lib/hisaabFirestore'
import { isDemoMode } from '../lib/demoMode'
import { DEMO_GROUP_ID, subscribeDemo, getDemoSnapshot } from '../demo/demoStore'

const STORAGE_KEY = 'hisaab_active_group_id'

export function useGroup(userId) {
  const demoSnap = useSyncExternalStore(
    isDemoMode() ? subscribeDemo : () => () => {},
    isDemoMode() ? getDemoSnapshot : () => ({ empty: true }),
    isDemoMode() ? getDemoSnapshot : () => ({ empty: true })
  )

  const [activeGroupId, setActiveGroupIdState] = useState(() => {
    if (typeof localStorage === 'undefined') return null
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    if (localStorage.getItem('hisaab_demo_mode') === '1' || import.meta.env.VITE_DEMO_MODE === 'true') {
      return DEMO_GROUP_ID
    }
    return null
  })

  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const setActiveGroupId = useCallback((id) => {
    setActiveGroupIdState(id)
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    if (!isDemoMode()) return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, DEMO_GROUP_ID)
      setActiveGroupIdState(DEMO_GROUP_ID)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (isDemoMode()) {
      if (!userId || !activeGroupId || demoSnap.empty) {
        setGroup(null)
        setMembers([])
        setLoading(false)
        return
      }
      const g = demoSnap.groups.find((x) => x.id === activeGroupId) ?? null
      setGroup(g)
      const gm = demoSnap.groupMembers.filter((m) => m.group_id === activeGroupId).map((m) => m.user_id)
      const profs = demoSnap.profiles.filter((p) => gm.includes(p.id))
      setMembers(profs)
      setLoading(false)
      return
    }

    if (!userId || !activeGroupId) {
      setGroup(null)
      setMembers([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const g = await getGroup(activeGroupId)
      if (!g) {
        setGroup(null)
        setMembers([])
        setLoading(false)
        return
      }
      setGroup(g)

      const ids = await listMemberUserIds(activeGroupId)
      if (ids.length === 0) {
        setMembers([])
        setLoading(false)
        return
      }

      const profs = await listProfilesForIds(ids)
      setMembers(profs ?? [])
    } catch {
      setGroup(null)
      setMembers([])
    }
    setLoading(false)
  }, [userId, activeGroupId, demoSnap])

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
    /** Demo-only helpers (no-op when not in demo) */
  }
}
